//! Serenity gateway/REST helpers — port of `../server/src/functions/discord-bot.ts`.
//!
//! Guilds are resolved from the gateway cache when possible (the bot runs with
//! the Guilds intent, so guilds it is in are already cached) and only fall back
//! to a REST fetch on a miss. Independent Discord calls run concurrently
//! (`tokio::join!` / `join_all`), mirroring the `Promise.all` shapes in the TS
//! source.

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant};

use axum::http::StatusCode;
use serenity::async_trait;
use serenity::futures::stream::{self, StreamExt};
use serenity::client::{Context, EventHandler};
use serenity::futures::future::join_all;
use serenity::model::channel::{ChannelType, GuildChannel, PermissionOverwriteType};
use serenity::model::gateway::Ready;
use serenity::model::guild::{Member, Role as DiscordRole};
use serenity::model::id::{GuildId, RoleId, UserId};
use serenity::model::permissions::Permissions;

use crate::db;
use crate::discord::oauth;
use crate::error::{HttpError, Result};
use crate::models::*;
use crate::state::AppState;

/// Serenity event handler that logs once the gateway session is ready,
/// mirroring the discord.js `ClientReady` listener.
pub struct ReadyHandler;

#[async_trait]
impl EventHandler for ReadyHandler {
    async fn ready(&self, _ctx: Context, ready: Ready) {
        tracing::info!("Ready! Logged in as {}", ready.user.tag());
    }
}

pub struct AuthedMember {
    pub member: Member,
    pub manage_guild_permission: bool,
}

pub struct GuildAndMember {
    pub guild: FilteredServerDataDiscord,
    pub member: Member,
    pub manage_guild_permission: bool,
}

// ---------- internal helpers ----------

/// Snapshot of the guild fields the handlers need, valid whether the guild came
/// from the gateway cache or a REST fetch (the two serenity types differ).
struct ResolvedGuild {
    id: GuildId,
    name: String,
    icon_url: Option<String>,
    owner_id: UserId,
    member_count: i64,
    roles: Vec<DiscordRole>,
}

fn server_not_found() -> HttpError {
    HttpError::not_found("Server not found. Bot may not be in that server.")
}

fn user_not_in_server() -> HttpError {
    HttpError::not_found("User not in server.")
}

fn no_manage_permission() -> HttpError {
    HttpError::forbidden("User does not have manage server permission in that server.")
}

/// True when the serenity error is a Discord REST response with this status.
fn is_discord_status(err: &serenity::Error, status: StatusCode) -> bool {
    matches!(
        err,
        serenity::Error::Http(serenity::http::HttpError::UnsuccessfulRequest(resp))
            if resp.status_code.as_u16() == status.as_u16()
    )
}

fn parse_guild_id(server_id: &str) -> Result<GuildId> {
    server_id
        .parse::<u64>()
        .ok()
        .filter(|id| *id != 0)
        .map(GuildId::new)
        .ok_or_else(server_not_found)
}

fn user_id_from_oauth(user_data: &serde_json::Value) -> Result<UserId> {
    user_data
        .get("id")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .filter(|id| *id != 0)
        .map(UserId::new)
        .ok_or_else(|| HttpError::unauthorized("Most likely not authenticated."))
}

/// Cache-first / REST-fallback guild resolution (see module docs).
async fn resolve_guild(state: &AppState, server_id: &str) -> Result<ResolvedGuild> {
    let guild_id = parse_guild_id(server_id)?;

    // The cache guard must not be held across an await point — clone what we
    // need inside this block.
    let cached: Option<ResolvedGuild> = {
        state.discord_cache.guild(guild_id).map(|guild| ResolvedGuild {
            id: guild.id,
            name: guild.name.clone(),
            icon_url: guild.icon_url(),
            owner_id: guild.owner_id,
            member_count: guild.member_count as i64,
            roles: guild.roles.values().cloned().collect(),
        })
    };
    if let Some(resolved) = cached {
        return Ok(resolved);
    }

    // Cache miss: REST fetch (with counts, so memberCount is populated like the
    // cached path).
    let guild = state
        .discord_http
        .get_guild_with_counts(guild_id)
        .await
        .map_err(|err| {
            if is_discord_status(&err, StatusCode::NOT_FOUND)
                || is_discord_status(&err, StatusCode::FORBIDDEN)
            {
                server_not_found()
            } else {
                err.into()
            }
        })?;
    Ok(ResolvedGuild {
        id: guild.id,
        name: guild.name.clone(),
        icon_url: guild.icon_url(),
        owner_id: guild.owner_id,
        member_count: guild.approximate_member_count.unwrap_or_default() as i64,
        roles: guild.roles.values().cloned().collect(),
    })
}

/// Process-level TTL member cache. With only the Guilds intent serenity's own
/// member cache never fills (no member gateway events), so this stands in for
/// discord.js's member cache on force=false paths — notably the per-game
/// thumbnail endpoint, which otherwise pays one REST call per image.
const MEMBER_CACHE_TTL: Duration = Duration::from_secs(30);
type MemberCacheMap = HashMap<(GuildId, UserId), (Instant, Member)>;
static MEMBER_CACHE: LazyLock<Mutex<MemberCacheMap>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn member_cache_get(guild_id: GuildId, user_id: UserId) -> Option<Member> {
    let cache = MEMBER_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache
        .get(&(guild_id, user_id))
        .filter(|(at, _)| at.elapsed() < MEMBER_CACHE_TTL)
        .map(|(_, member)| member.clone())
}

fn member_cache_put(guild_id: GuildId, user_id: UserId, member: &Member) {
    let mut cache = MEMBER_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    if cache.len() >= 4096 {
        cache.retain(|_, (at, _)| at.elapsed() < MEMBER_CACHE_TTL);
    }
    cache.insert((guild_id, user_id), (Instant::now(), member.clone()));
}

/// REST member fetch through the TTL cache. `force` bypasses (and refreshes)
/// the cached entry, mirroring discord.js `members.fetch({ force })`.
async fn get_member_cached(
    state: &AppState,
    guild_id: GuildId,
    user_id: UserId,
    force: bool,
) -> serenity::Result<Member> {
    if !force {
        if let Some(member) = member_cache_get(guild_id, user_id) {
            return Ok(member);
        }
    }
    let member = state.discord_http.get_member(guild_id, user_id).await?;
    member_cache_put(guild_id, user_id, &member);
    Ok(member)
}

/// REST member fetch, mapping Discord's 404 (Unknown Member/User) to the
/// contract's "User not in server." error. Always forces a fresh fetch.
async fn fetch_member(state: &AppState, guild_id: GuildId, user_id: UserId) -> Result<Member> {
    get_member_cached(state, guild_id, user_id, true)
        .await
        .map_err(|err| {
            if is_discord_status(&err, StatusCode::NOT_FOUND) {
                user_not_in_server()
            } else {
                err.into()
            }
        })
}

/// Guild-level permission check equivalent to discord.js
/// `member.permissions.has(ManageGuild)`: the owner always has it; otherwise
/// union the @everyone role and the member's roles and look for
/// MANAGE_GUILD or ADMINISTRATOR.
fn compute_manage_guild_permission(
    guild_id: GuildId,
    owner_id: UserId,
    roles: &[DiscordRole],
    member: &Member,
) -> bool {
    if member.user.id == owner_id {
        return true;
    }
    let everyone_id = RoleId::new(guild_id.get());
    roles
        .iter()
        .filter(|role| role.id == everyone_id || member.roles.contains(&role.id))
        .any(|role| {
            role.permissions.contains(Permissions::ADMINISTRATOR)
                || role.permissions.contains(Permissions::MANAGE_GUILD)
        })
}

/// Whether the bot can view a channel (discord.js `channel.viewable`):
/// base permissions from @everyone + the bot's roles, then the channel
/// overwrites applied in Discord's documented order.
fn bot_can_view_channel(
    guild_id: GuildId,
    roles: &[DiscordRole],
    bot_member: &Member,
    channel: &GuildChannel,
) -> bool {
    let everyone_id = RoleId::new(guild_id.get());
    let mut base = Permissions::empty();
    for role in roles {
        if role.id == everyone_id || bot_member.roles.contains(&role.id) {
            base |= role.permissions;
        }
    }
    if base.contains(Permissions::ADMINISTRATOR) {
        return true;
    }

    let mut perms = base;
    // 1. @everyone overwrite.
    for overwrite in &channel.permission_overwrites {
        if let PermissionOverwriteType::Role(role_id) = overwrite.kind {
            if role_id == everyone_id {
                perms &= !overwrite.deny;
                perms |= overwrite.allow;
            }
        }
    }
    // 2. Role overwrites (all denies, then all allows).
    let mut allow = Permissions::empty();
    let mut deny = Permissions::empty();
    for overwrite in &channel.permission_overwrites {
        if let PermissionOverwriteType::Role(role_id) = overwrite.kind {
            if role_id != everyone_id && bot_member.roles.contains(&role_id) {
                allow |= overwrite.allow;
                deny |= overwrite.deny;
            }
        }
    }
    perms &= !deny;
    perms |= allow;
    // 3. Member overwrite.
    for overwrite in &channel.permission_overwrites {
        if let PermissionOverwriteType::Member(user_id) = overwrite.kind {
            if user_id == bot_member.user.id {
                perms &= !overwrite.deny;
                perms |= overwrite.allow;
            }
        }
    }
    perms.contains(Permissions::VIEW_CHANNEL)
}

/// discord.js `role.hexColor`: "#rrggbb", lowercase.
fn role_hex_color(role: &DiscordRole) -> String {
    format!("#{:06x}", role.colour.0)
}

/// discord.js `role.iconURL()`.
fn role_icon_url(role: &DiscordRole) -> Option<String> {
    role.icon
        .as_ref()
        .map(|hash| format!("https://cdn.discordapp.com/role-icons/{}/{}.webp", role.id, hash))
}

// ---------- public API ----------

pub async fn authenticate_and_authorize_user(
    state: &AppState,
    server_id: &str,
    access_token: &str,
    require_manage: bool,
    force_member_fetch: bool,
) -> Result<AuthedMember> {
    // The OAuth user lookup and the guild resolution are independent — run them
    // concurrently instead of one after the other.
    let (user_data, guild) = tokio::join!(
        oauth::get_discord_oauth_user_data(state, access_token),
        resolve_guild(state, server_id),
    );
    let user_data = user_data?;
    let guild = guild?;
    let user_id = user_id_from_oauth(&user_data)?;

    // force defaults to true in callers that need fresh roles/permissions;
    // read-only endpoints pass false so repeated hits reuse the TTL member
    // cache instead of forcing a Discord round-trip on every request.
    let member = get_member_cached(state, guild.id, user_id, force_member_fetch)
        .await
        .map_err(|err| {
            if is_discord_status(&err, StatusCode::NOT_FOUND) {
                user_not_in_server()
            } else {
                err.into()
            }
        })?;

    let manage_guild_permission =
        compute_manage_guild_permission(guild.id, guild.owner_id, &guild.roles, &member);
    if require_manage && !manage_guild_permission {
        return Err(no_manage_permission());
    }
    Ok(AuthedMember { member, manage_guild_permission })
}

pub async fn get_guild_and_member_data(
    state: &AppState,
    server_id: &str,
    access_token: &str,
    require_manage: bool,
) -> Result<GuildAndMember> {
    // Resolve the OAuth user and the guild in parallel — neither depends on the
    // other.
    let (user_data, guild) = tokio::join!(
        oauth::get_discord_oauth_user_data(state, access_token),
        resolve_guild(state, server_id),
    );
    let user_data = user_data?;
    let guild = guild?;
    let user_id = user_id_from_oauth(&user_data)?;

    // Owner, channels, roles, the requesting member and the bot's own member
    // (needed for channel visibility) are independent given the guild — fetch
    // them concurrently instead of one after another.
    // The bot's own member must come from the regular guild-member endpoint —
    // /users/@me/guilds/{id}/member is OAuth-only and Discord answers
    // "Bots cannot use this endpoint" to bot tokens.
    let bot_user_id = {
        let cached = state.discord_cache.current_user().id;
        if cached.get() != 0 {
            cached
        } else {
            state.discord_http.get_current_user().await?.id
        }
    };
    let (owner, fetched_channels, fetched_roles, member, bot_member) = tokio::join!(
        get_member_cached(state, guild.id, guild.owner_id, false),
        state.discord_http.get_channels(guild.id),
        state.discord_http.get_guild_roles(guild.id),
        fetch_member(state, guild.id, user_id),
        // The bot's own role set changes rarely — serve it from the TTL cache.
        get_member_cached(state, guild.id, bot_user_id, false),
    );
    let owner = owner?;
    let fetched_channels = fetched_channels?;
    let fetched_roles = fetched_roles?;
    let member = member?;
    let bot_member = bot_member?;

    let manage_guild_permission =
        compute_manage_guild_permission(guild.id, guild.owner_id, &fetched_roles, &member);
    if require_manage && !manage_guild_permission {
        return Err(no_manage_permission());
    }

    let channels: Vec<ServerDataDiscordChannel> = fetched_channels
        .iter()
        .filter(|channel| {
            channel.kind == ChannelType::Text
                && bot_can_view_channel(guild.id, &fetched_roles, &bot_member, channel)
        })
        .map(|channel| ServerDataDiscordChannel {
            id: channel.id.to_string(),
            name: channel.name.clone(),
        })
        .collect();

    let everyone_id = RoleId::new(guild.id.get());
    let roles: Vec<ServerDataDiscordRole2> = fetched_roles
        .iter()
        .map(|role| ServerDataDiscordRole2 {
            id: role.id.to_string(),
            name: role.name.clone(),
            color: role_hex_color(role),
            icon: role_icon_url(role),
            managed: role.managed,
            // meInRole reads from the fetched member's own roles (discord.js
            // counts @everyone as a role of every member).
            me_in_role: role.id == everyone_id || member.roles.contains(&role.id),
        })
        .collect();

    let filtered = FilteredServerDataDiscord {
        id: guild.id.to_string(),
        name: guild.name.clone(),
        icon: guild.icon_url.clone(),
        owner_id: guild.owner_id.to_string(),
        owner_name: owner.display_name().to_string(),
        owner_nick: owner.nick.clone(),
        member_count: guild.member_count,
        roles: Some(roles),
        channels: Some(channels),
    };

    Ok(GuildAndMember { guild: filtered, member, manage_guild_permission })
}

// MUST authenticate before using
pub async fn get_all_servers_user_and_bot_are_in(
    state: &AppState,
    user_id: UserId,
) -> Result<Vec<FilteredGuild>> {
    // The bot has the Guilds intent, so every guild it is in is already cached —
    // use the cache instead of REST-fetching each one, and check membership for
    // all guilds concurrently instead of in a sequential loop.
    struct GuildSnapshot {
        id: GuildId,
        name: String,
        icon_url: Option<String>,
        owner_id: UserId,
        member_count: i64,
    }
    let snapshots: Vec<GuildSnapshot> = state
        .discord_cache
        .guilds()
        .into_iter()
        .filter_map(|guild_id| {
            state.discord_cache.guild(guild_id).map(|guild| GuildSnapshot {
                id: guild.id,
                name: guild.name.clone(),
                icon_url: guild.icon_url(),
                owner_id: guild.owner_id,
                member_count: guild.member_count as i64,
            })
        })
        .collect();

    // Bounded fan-out: each guild is its own rate-limit bucket, so unbounded
    // join_all would fire 2×N REST calls at once on a multi-guild bot. The
    // membership probe stays fresh per user; the owner lookup goes through the
    // TTL member cache (owners rarely change), halving steady-state calls.
    // Futures are collected eagerly before streaming (lazily-mapped iterators
    // trip a higher-ranked lifetime error in stream::iter).
    let futs: Vec<_> = snapshots
        .iter()
        .map(|guild| async move {
            match get_member_cached(state, guild.id, user_id, false).await {
                Ok(_member) => {}
                Err(err) => {
                    // 404 (10007) = user simply isn't in this guild; anything else
                    // is real, but the TS code only logged it and skipped the guild.
                    if !matches!(
                        err,
                        serenity::Error::Http(serenity::http::HttpError::UnsuccessfulRequest(_))
                    ) {
                        tracing::error!(guild_id = %guild.id, error = %err, "Error fetching member in guild");
                    }
                    return Ok::<Option<FilteredGuild>, HttpError>(None);
                }
            }
            let owner = get_member_cached(state, guild.id, guild.owner_id, false).await?;
            Ok(Some(FilteredGuild {
                id: guild.id.to_string(),
                name: guild.name.clone(),
                icon: guild.icon_url.clone(),
                owner_id: guild.owner_id.to_string(),
                owner_name: owner.display_name().to_string(),
                owner_nick: owner.nick.clone(),
                member_count: guild.member_count,
            }))
        })
        .collect();
    let results: Vec<std::result::Result<Option<FilteredGuild>, HttpError>> =
        stream::iter(futs).buffer_unordered(8).collect().await;

    let mut guilds = Vec::new();
    for result in results {
        if let Some(guild) = result? {
            guilds.push(guild);
        }
    }
    Ok(guilds)
}

// MUST authenticate before using
// MUST check if role is self-assignable on the DB side
pub async fn assign_roles_to_user(
    state: &AppState,
    server_id: &str,
    user_id: UserId,
    role_ids: &[String],
) -> Result<()> {
    modify_roles_of_user(state, server_id, user_id, role_ids, true).await
}

// MUST authenticate before using
// MUST check if role is self-assignable on the DB side
pub async fn unassign_roles_from_user(
    state: &AppState,
    server_id: &str,
    user_id: UserId,
    role_ids: &[String],
) -> Result<()> {
    modify_roles_of_user(state, server_id, user_id, role_ids, false).await
}

/// Shared body of assign/unassign: cache-first guild + a single member fetch
/// (not once per role), then add/remove each DB-known role concurrently.
async fn modify_roles_of_user(
    state: &AppState,
    server_id: &str,
    user_id: UserId,
    role_ids: &[String],
    add: bool,
) -> Result<()> {
    let guild = resolve_guild(state, server_id).await?;
    // Only roles present in the DB may be touched.
    let db_roles = db::get_roles_in_server_in_db_by_role_ids(&state.db, server_id, role_ids).await?;
    let member = fetch_member(state, guild.id, user_id).await?;

    let guild = &guild;
    let member = &member;
    let results = join_all(db_roles.iter().map(|db_role| async move {
        let role_id = match db_role.role_id.parse::<u64>().ok().filter(|id| *id != 0) {
            Some(id) => RoleId::new(id),
            None => return Ok::<(), HttpError>(()),
        };
        // Resolved (cached) roles first, REST-refreshed roles on a miss —
        // mirrors `guild.roles.cache.get(id) ?? guild.roles.fetch(id)`.
        let role = match guild.roles.iter().find(|r| r.id == role_id).cloned() {
            Some(role) => Some(role),
            None => state
                .discord_http
                .get_guild_roles(guild.id)
                .await?
                .into_iter()
                .find(|r| r.id == role_id),
        };
        if let Some(role) = role {
            if role.name != "@everyone" {
                if add {
                    state
                        .discord_http
                        .add_member_role(guild.id, member.user.id, role.id, None)
                        .await?;
                } else {
                    state
                        .discord_http
                        .remove_member_role(guild.id, member.user.id, role.id, None)
                        .await?;
                }
            }
        }
        Ok(())
    }))
    .await;
    for result in results {
        result?;
    }
    Ok(())
}

pub async fn sync_roles_with_db_and_discord(
    state: &AppState,
    server_id: &str,
) -> Result<SyncRolesResponse> {
    let guild_id = parse_guild_id(server_id)?;
    // Roles always come fresh from REST here (discord.js `guild.roles.fetch()`).
    let discord_roles = state
        .discord_http
        .get_guild_roles(guild_id)
        .await
        .map_err(|err| {
            if is_discord_status(&err, StatusCode::NOT_FOUND)
                || is_discord_status(&err, StatusCode::FORBIDDEN)
            {
                server_not_found()
            } else {
                err.into()
            }
        })?;
    let db_roles = db::get_all_roles_in_server_in_db(&state.db, server_id).await?;

    let db_role_ids: std::collections::HashSet<&str> =
        db_roles.iter().map(|role| role.role_id.as_str()).collect();
    let discord_role_ids: std::collections::HashSet<String> =
        discord_roles.iter().map(|role| role.id.to_string()).collect();

    // Prioritize the Discord side: create roles new to the DB, delete roles
    // that no longer exist in Discord.
    let roles_created: Vec<String> = discord_roles
        .iter()
        .map(|role| role.id.to_string())
        .filter(|id| !db_role_ids.contains(id.as_str()))
        .collect();
    let roles_deleted: Vec<String> = db_roles
        .iter()
        .filter(|role| !discord_role_ids.contains(&role.role_id))
        .map(|role| role.role_id.clone())
        .collect();

    // Two set-based statements instead of one INSERT/DELETE per role — a big
    // guild's first sync was an N+1 write burst against a 10-connection pool.
    tokio::try_join!(
        db::create_roles_bulk(&state.db, server_id, &roles_created),
        db::delete_roles_bulk(&state.db, server_id, &roles_deleted),
    )?;

    Ok(SyncRolesResponse { roles_created, roles_deleted })
}

pub fn member_to_response(member: &Member) -> GuildMemberResponse {
    GuildMemberResponse {
        // Guild-specific avatar, like discord.js `member.avatarURL()`.
        avatar_url: member.avatar_url(),
        banner_url: member.user.banner_url(),
        // Guild avatar ?? user avatar ?? default, like `member.displayAvatarURL()`.
        display_avatar_url: Some(member.face()),
        display_banner_url: member.user.banner_url(),
        // serenity has no avatar-decoration URL helper; the client tolerates null.
        avatar_decoration_url: None,
        roles: member.roles.iter().map(|role_id| role_id.to_string()).collect(),
        id: member.user.id.to_string(),
        nick: member.nick.clone(),
        // nick ?? global display name ?? username, like discord.js displayName.
        display_name: member.display_name().to_string(),
        joined_at: member.joined_at.map(|timestamp| timestamp.to_string()),
    }
}
