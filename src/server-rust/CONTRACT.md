# juicer-server (Rust) — module contract

Rust port of the Hono backend at `../server`. axum 0.8 + sqlx 0.8 (Postgres) +
serenity 0.12 + reqwest + ts-rs. Behavior must match the TS backend
route-for-route: same paths, same JSON field names (camelCase — models in
`src/models.rs` already encode this via serde), same status codes, same
plain-text error bodies (`error::HttpError`).

Already written (do NOT rewrite, only consume): `Cargo.toml`, `src/main.rs`,
`src/models.rs`, `src/error.rs`, `src/config.rs`, `src/state.rs`.

Use `crate::error::{HttpError, Result}` everywhere. `AppState` is cloneable and
passed as `axum::extract::State<AppState>`.

## Module layout

```
src/db.rs                  — all Postgres queries (sqlx, runtime queries — do NOT use query! macros)
src/discord/mod.rs         — `pub mod bot; pub mod oauth;`
src/discord/bot.rs         — serenity gateway/REST helpers + `pub struct ReadyHandler` (EventHandler logging "Ready!" on ready)
src/discord/oauth.rs       — Discord OAuth via reqwest (user-token endpoints)
src/middleware.rs          — CORS + CSRF + rate limit + trace
src/routes/mod.rs          — `pub fn router(state: AppState) -> axum::Router`
src/routes/{auth,user,server,games,roles,role_categories,tags,categories,search,swagger}.rs
```

## Signatures (exact — other modules compile against these)

### src/db.rs  (port of ../server/src/functions/db.ts — keep per-function behavior, incl. thrown statuses)

```rust
use crate::error::Result;
use crate::models::*;
use sqlx::PgPool;

pub async fn get_server_data_in_db(db: &PgPool, server_id: &str) -> Result<Option<ServerDataDb>>;
pub async fn create_server(db: &PgPool, server_id: &str) -> Result<CreateServerResponse>;          // unique violation -> 400 "Server already exists."
pub async fn create_game(db: &PgPool, server_id: &str, name: &str, description: Option<&str>, category_id: Option<i32>) -> Result<GameWithoutRelations>; // not-null violation -> 400
pub struct UpdateGameParams { pub name: Option<String>, pub description: Option<String>, pub category_id: Option<i32>, pub thumbnail: Option<Vec<u8>>, pub channels: Option<Vec<String>>, pub tag_ids: Option<Vec<i32>>, pub role_ids: Option<Vec<String>> }
pub async fn update_game(db: &PgPool, game_id: i32, server_id: &str, params: UpdateGameParams) -> Result<UpdateGameResponse>; // 404 "Game not found." if missing; tags/roles diffing inside one transaction, same semantics as TS
pub async fn delete_game(db: &PgPool, game_id: i32, server_id: &str) -> Result<GameWithoutRelations>; // 404 "Game not found."
pub async fn create_tag(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Tag>>;             // returns existing tag if (server,name) exists
pub async fn get_all_tags_in_server(db: &PgPool, server_id: &str) -> Result<Vec<Tag>>;
pub async fn delete_tag(db: &PgPool, tag_id: i32, server_id: &str) -> Result<Vec<Tag>>;
pub async fn create_role_in_db(db: &PgPool, server_id: &str, role_id: &str) -> Result<Vec<Role>>;  // swallow unique violation (return Ok(vec![]))
pub async fn get_all_roles_in_server_in_db(db: &PgPool, server_id: &str) -> Result<Vec<Role>>;
pub async fn get_roles_in_server_in_db_by_role_ids(db: &PgPool, server_id: &str, role_ids: &[String]) -> Result<Vec<Role>>;
pub async fn delete_role_from_db(db: &PgPool, server_id: &str, role_id: &str) -> Result<()>;       // also deletes games_roles rows for the role
pub async fn create_category(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Category>>;
pub async fn delete_category(db: &PgPool, category_id: i32, server_id: &str) -> Result<Vec<Category>>;
pub async fn map_category_to_game(db: &PgPool, game_id: i32, server_id: &str, category_id: i32) -> Result<Vec<GameWithoutRelations>>;
pub async fn create_role_category(db: &PgPool, server_id: &str, name: &str, is_verification: bool) -> Result<Vec<RoleCategory>>;
pub async fn delete_role_category(db: &PgPool, role_category_id: i32, server_id: &str) -> Result<Vec<RoleCategory>>; // 400 when the category is flagged is_verification
pub async fn update_role_category_of_role(db: &PgPool, role_id: &str, role_category_id: Option<i32>, server_id: &str) -> Result<Vec<Role>>;
pub async fn find_games_by_category_name(db: &PgPool, server_id: &str, category_name: &str) -> Result<Vec<Game>>;
pub async fn find_games_by_tags(db: &PgPool, server_id: &str, tag_names: &[String]) -> Result<Vec<Game>>;
pub async fn find_games_by_name(db: &PgPool, server_id: &str, name: &str) -> Result<Vec<Game>>;    // ILIKE %name%
pub async fn get_all_games_in_server(db: &PgPool, server_id: &str) -> Result<Vec<Game>>;
pub async fn update_game_thumbnail(db: &PgPool, game_id: i32, server_id: &str, thumbnail: &[u8]) -> Result<Vec<GameWithoutRelations>>;
pub async fn get_game_thumbnail(db: &PgPool, game_id: i32, server_id: &str) -> Result<Option<Vec<u8>>>;
pub async fn update_role_info(db: &PgPool, role_id: &str, server_id: &str, self_assignable: Option<bool>, description: Option<Option<String>>) -> Result<Vec<Role>>; // self_assignable None -> false; description: absent=keep, null=clear
pub async fn update_server_verification_required(db: &PgPool, server_id: &str, verification_required: bool) -> Result<Vec<CreateServerResponse>>;
```

Tables (existing schema, snake_case columns): `servers(server_id text PK, created_at timestamp, verification_required bool)`,
`games(game_id serial PK, server_id, category_id, name, description, thumbnail bytea, channels text[])`,
`categories(category_id serial PK, server_id, name)`, `tags(tag_id serial PK, server_id, name)`,
`roles(role_id text PK, server_id, role_category_id, self_assignable bool, description)`,
`roles_categories(role_category_id serial PK, server_id, name, is_verification bool default false)`,
`games_roles(game_id, role_id)`, `games_tags(game_id, tag_id)`.
List payloads must EXCLUDE the thumbnail column (`Game`/`GameWithoutRelations.thumbnail = None`).
`ServerDataDb.games[*].games_tags/games_roles` are loaded with separate queries and grouped in Rust.

### src/discord/oauth.rs  (port of discord-oauth.ts; use `state.http` reqwest client + `state.config`)

```rust
use crate::{error::Result, state::AppState};
pub async fn get_discord_oauth_user_data(state: &AppState, access_token: &str) -> Result<serde_json::Value>; // GET https://discordapp.com/api/users/@me, Bearer; map errors like axios-error-handler.ts (401 "Most likely not authenticated." etc.)
#[derive(serde::Deserialize)] pub struct TokenResponse { pub access_token: Option<String>, pub refresh_token: Option<String>, pub expires_in: Option<i64> }
pub async fn exchange_code(state: &AppState, code: &str) -> Result<TokenResponse>;        // POST {VITE_API_ENDPOINT}/oauth2/token, form-encoded, basic auth client_id/secret, grant_type=authorization_code + redirect_uri
pub async fn refresh_auth_token(state: &AppState, refresh_token: &str) -> Result<TokenResponse>;
pub async fn revoke_token(state: &AppState, token: &str, token_type_hint: &str) -> Result<()>;
```

### src/discord/bot.rs  (port of discord-bot.ts; serenity 0.12)

```rust
use crate::{error::Result, models::*, state::AppState};
use serenity::model::guild::Member;

pub struct ReadyHandler; // impl serenity EventHandler: log "Ready! Logged in as <tag>" on ready

pub struct AuthedMember { pub member: Member, pub manage_guild_permission: bool }
// OAuth user lookup (oauth::get_discord_oauth_user_data) + guild resolve (cache first, REST fallback) run concurrently (tokio::join!).
// 404 "Server not found. Bot may not be in that server." / 404 "User not in server." /
// 403 "User does not have manage server permission in that server." when require_manage && !perm.
// manage_guild_permission = owner || role perms contain MANAGE_GUILD or ADMINISTRATOR (compute from cached guild roles).
pub async fn authenticate_and_authorize_user(state: &AppState, server_id: &str, access_token: &str, require_manage: bool, force_member_fetch: bool) -> Result<AuthedMember>;

pub struct GuildAndMember { pub guild: FilteredServerDataDiscord, pub member: Member, pub manage_guild_permission: bool }
pub async fn get_guild_and_member_data(state: &AppState, server_id: &str, access_token: &str, require_manage: bool) -> Result<GuildAndMember>;
// roles: hex color "#RRGGBB" lowercase like discord.js hexColor? discord.js returns "#abcdef" lowercase — match that; me_in_role from member.roles; channels: viewable text channels (id, name).

pub async fn get_all_servers_user_and_bot_are_in(state: &AppState, user_id: serenity::model::id::UserId) -> Result<Vec<FilteredGuild>>; // iterate cached guilds concurrently (futures join_all), skip guilds where member fetch 404s
pub async fn assign_roles_to_user(state: &AppState, server_id: &str, user_id: serenity::model::id::UserId, role_ids: &[String]) -> Result<()>;   // only roles present in DB (db::get_roles_in_server_in_db_by_role_ids), skip @everyone
pub async fn unassign_roles_from_user(state: &AppState, server_id: &str, user_id: serenity::model::id::UserId, role_ids: &[String]) -> Result<()>;
pub async fn sync_roles_with_db_and_discord(state: &AppState, server_id: &str) -> Result<SyncRolesResponse>; // discord side wins; await all writes
pub fn member_to_response(member: &Member) -> GuildMemberResponse; // avatar/banner/display URLs via serenity helpers (None where serenity lacks a helper is acceptable for banner/decoration)
```

### src/middleware.rs

```rust
pub fn apply(router: axum::Router, config: std::sync::Arc<crate::config::Config>) -> axum::Router;
```
- CORS (tower-http): origins = config.allowed_origins, credentials true, methods GET/POST/PUT/DELETE, headers Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With.
- CSRF middleware (axum::middleware::from_fn): for non-GET/HEAD/OPTIONS requests, allow if `Sec-Fetch-Site` is `same-origin`/`same-site`/`none`, or `Origin` header ∈ allowed_origins; else 403.
- Rate limit: 250 req / 60s fixed window, keyed by cookie `discord_access_token`, else `x-forwarded-for`, else `x-real-ip`, else peer IP (ConnectInfo<SocketAddr>). In-house: `Mutex<HashMap<String, (Instant, u32)>>` in a static/Extension; 429 with `RateLimit-*` draft-6 style headers on limit.
- `tower_http::trace::TraceLayer::new_for_http()` for request logging.

### src/routes/*

`routes::mod.rs`:
```rust
pub fn router(state: AppState) -> axum::Router {
    // nest: /discord/auth, /discord/user, /discord/servers, /swagger (+ GET /docs swagger-ui HTML page pointing at /swagger)
}
```
Sub-routers take `State<AppState>`; axum 0.8 path params use `{serverId}` syntax. Read the
`discord_access_token` cookie via `axum_extra::extract::CookieJar`; missing token behaves like the
TS code (it passed `undefined` through — here: treat missing as 401 via oauth call failing, or
explicit 401 where the TS code checked). Cookies set with HttpOnly, SameSite=Lax,
Secure=config.is_production(), Max-Age=expires_in, Path=/.

Route inventory (must match ../server/src/routes exactly):
- auth.rs: GET /me; GET /callback; POST /refresh; POST /revoke; GET /remove-cookies
- user.rs: GET /me -> MyInfo (userData passthrough + guilds)
- server.rs: GET /{serverId}; POST /{serverId}/create (atomically creates the server row and its is_verification-flagged "verification" role category); GET /{serverId}/me (MyDataInServer: roles grouped by role category); GET /{serverId}/sync-roles; PUT /{serverId} (verificationRequired); nests categories/games/role-categories/roles/search/tags under /{serverId}/...
- games.rs: GET /{gameId} (TopicDetails: resolved channel/role names, assigned flags); POST /create; PUT /{gameId}; DELETE /{gameId}; POST /{gameId}/categories/add; POST /{gameId}/tags/tag; POST /{gameId}/tags/{tagId}/untag; PUT /{gameId}/thumbnail/update (multipart field "file", validate mime image/*, 100..=1_048_576 bytes); GET /{gameId}/thumbnail (binary body, Cache-Control: private, max-age=300; auth with require_manage=false, force_fetch=false)
- roles.rs: GET /  (admin; returns { serverRoles, myRoles: member role ids }); PATCH /{roleId} (partial role settings update, admin); POST /{roleId}/assign; POST /{roleId}/unassign; POST /{roleId}/update
- role_categories.rs: POST /create; DELETE /{roleCategoryId} (is_verification flag → 400); POST /assign
- tags.rs: GET /; POST /create; DELETE /{tagId}
- categories.rs: POST /create; DELETE /{categoryId}
- search.rs: GET /all?query= (matches game name/tag/category plus Discord channel and role names — issue #40)
- swagger.rs: GET /swagger serves the OpenAPI JSON generated by utoipa from the #[utoipa::path] route annotations; /docs returns a minimal swagger-ui HTML page (unpkg swagger-ui-dist). Both are mounted only when Config::docs_enabled() allows it: hidden when ENVIRONMENT=production, overridable either way with ENABLE_API_DOCS=true|false.

All "Admin required" handlers must keep the exact 403 message "User does not have manage server permission."

## Intentional divergences from the TS backend (reviewed & accepted)

- `update_game`: an absent `tagIds`/`roleIds` leaves the game's relations
  untouched; an empty array clears them. (The TS treated absent as "remove
  everything", which silently stripped roles on tags-only calls and vice
  versa.) The relation DELETEs are also scoped to the game — the TS deletes
  filtered only on tag_id/role_id and corrupted sibling games sharing them.

- `find_games_by_tags` uses a real JOIN on `games_tags`. The TS version produced
  invalid relational SQL (referenced `games_tags` without joining it) and 500'd
  whenever matching tags existed; the Rust version returns actual results.
- `create_role_in_db` / `create_category` return 500 on unexpected DB errors.
  The TS versions caught every error and returned it as a value, so the route
  answered 200 with a serialized error object — kept the stricter behavior.
- Thumbnail bytes in RETURNING-based responses serialize as a plain JSON number
  array (`Vec<u8>`), not Node's `{"type":"Buffer","data":[...]}` envelope. The
  regenerated ts-rs bindings declare `Array<number> | null`; the client fetches
  thumbnails via the binary endpoint anyway.
- Multipart thumbnail uploads have a 4 MB transport cap (axum body limit,
  raised from the 2 MB default); payload validation still enforces
  100..=1_048_576 bytes with a 400 like the zod schema.

## Later API changes (issues #40/#46/#47/#48, PR #44 review)

- Verification role category is a distinct DB-flagged row (`is_verification`),
  not "roleCategoryId 1". `ensure_verification_category_schema` runs at boot:
  adds the column if missing and backfills the oldest "verification"-named
  category per legacy server.
- Verification guard: with `verificationRequired` on and verification roles
  configured, every `/discord/servers/{serverId}` route returns 403
  ("Server verification required.") unless the member holds ALL verification
  roles or has ManageGuild.
- Mutation validation: names are trimmed (empty → 400; limits 255 game /
  100 category / 100 role-category / 50 tag chars); descriptions trimmed,
  limited (2000 game / 500 role) and normalized to null when empty;
  channel/role IDs must be snowflakes, tag/category IDs positive; ID lists are
  deduplicated (max 100).
- Game mutations verify referenced categories/tags/roles belong to the server
  (400 otherwise), channels exist in the guild, and roles are real, non-managed
  and never @everyone. Checks run inside the mutation's transaction.
- Multi-statement writes (server+verification create, game update, role sync,
  role category assign) are transactional — partial failure rolls back fully.
