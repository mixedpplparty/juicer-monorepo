//! Port of `../server/src/routes/discord/server/index.ts`.

use std::collections::HashSet;

use axum::extract::{Path, Request, State};
use axum::middleware::Next;
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use serde_json::json;

use crate::db;
use crate::discord::bot;
use crate::error::{HttpError, Result};
use crate::member_roles::{categorize_member_roles, MemberRoleInfo};
use crate::models::{CreateServerResponse, MyDataInServer, ServerData, SyncRolesResponse, UpdateServerVerificationRequiredRequestBody};
use crate::routes::{categories, games, role_categories, roles, search, tags};
use crate::state::AppState;
use crate::validation::is_verification_satisfied;

/// Read the `discord_access_token` cookie; missing behaves like the TS code
/// passing `undefined` through (downstream OAuth call fails with 401).
fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/{serverId}", get(get_server_data).put(update_server))
        .route("/{serverId}/create", post(create_server))
        .route("/{serverId}/me", get(get_my_data_in_server))
        .route("/{serverId}/sync-roles", get(sync_roles))
        .nest("/{serverId}/categories", categories::router())
        .nest("/{serverId}/games", games::router())
        .nest("/{serverId}/role-categories", role_categories::router())
        .nest("/{serverId}/roles", roles::router())
        .nest("/{serverId}/search", search::router())
        .nest("/{serverId}/tags", tags::router())
}

/// 403s every /{serverId} route for members missing verification roles.
/// Admins bypass; servers without a DB row or configured roles are unaffected.
pub async fn verification_guard(
    State(state): State<AppState>,
    Path(params): Path<std::collections::HashMap<String, String>>,
    jar: CookieJar,
    req: Request,
    next: Next,
) -> Result<Response> {
    let Some(server_id) = params.get("serverId") else {
        return Ok(next.run(req).await);
    };
    let (verification_required, required_role_ids) =
        db::get_verification_requirement(&state.db, server_id).await?;
    if verification_required && !required_role_ids.is_empty() {
        let token = access_token(&jar);
        let authed =
            bot::authenticate_and_authorize_user(&state, server_id, &token, false, false).await?;
        let member_roles: HashSet<String> =
            authed.member.roles.iter().map(|id| id.to_string()).collect();
        let mut satisfied = is_verification_satisfied(
            true,
            &required_role_ids,
            &member_roles,
            authed.manage_guild_permission,
        );
        // a stale member cache must not lock out a freshly verified member
        if !satisfied {
            let authed =
                bot::authenticate_and_authorize_user(&state, server_id, &token, false, true)
                    .await?;
            let member_roles: HashSet<String> =
                authed.member.roles.iter().map(|id| id.to_string()).collect();
            satisfied = is_verification_satisfied(
                true,
                &required_role_ids,
                &member_roles,
                authed.manage_guild_permission,
            );
        }
        if !satisfied {
            return Err(HttpError::forbidden("Server verification required."));
        }
    }
    Ok(next.run(req).await)
}

/// GET /{serverId} — server data from Discord and the DB.
#[utoipa::path(get, path = "/discord/servers/{serverId}", tag = "servers",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, body = ServerData), (status = 404, description = "Server not found"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_server_data(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<ServerData>> {
    let access_token = access_token(&jar);
    // The Discord aggregation and the DB read are independent — run concurrently.
    let (guild_and_member, server_data_db) = tokio::join!(
        bot::get_guild_and_member_data(&state, &server_id, &access_token, false),
        db::get_server_data_in_db(&state.db, &server_id),
    );
    let guild_and_member = guild_and_member?;
    let server_data_db = server_data_db?;
    Ok(Json(ServerData {
        admin: guild_and_member.manage_guild_permission,
        server_data_db,
        server_data_discord: guild_and_member.guild,
    }))
}

/// Admin required.
/// POST /{serverId}/create — create server (also creates the "verification" role category).
#[utoipa::path(post, path = "/discord/servers/{serverId}/create", tag = "servers",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, description = "Server and verification role category created"), (status = 400, description = "Server already exists"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn create_server(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<serde_json::Value>> {
    let access_token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &access_token, true, true)
            .await?;
    if authed.manage_guild_permission {
        db::create_server_with_verification_category(&state.db, &server_id).await?;
        return Ok(Json(json!({
            "message": "Server created. Roles need to be synced."
        })));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

/// GET /{serverId}/me — my roles in the server, grouped by role category.
#[utoipa::path(get, path = "/discord/servers/{serverId}/me", tag = "servers",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, body = MyDataInServer), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_my_data_in_server(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<MyDataInServer>> {
    let access_token = access_token(&jar);
    let (authed, metadata) = tokio::join!(
        bot::authenticate_and_authorize_user(&state, &server_id, &access_token, false, true),
        db::get_server_role_metadata(&state.db, &server_id),
    );
    let authed = authed?;
    let (db_roles, role_categories) = metadata?;

    // Resolve the member's role IDs to names/colors via the guild snapshot.
    let entities = bot::get_guild_channels_and_roles(&state, &server_id).await?;
    let guild_role_by_id: std::collections::HashMap<&str, &bot::GuildRoleLite> =
        entities.roles.iter().map(|role| (role.id.as_str(), role)).collect();
    let member_roles: Vec<MemberRoleInfo> = authed
        .member
        .roles
        .iter()
        .filter_map(|role_id| {
            guild_role_by_id
                .get(role_id.to_string().as_str())
                .map(|role| MemberRoleInfo {
                    id: role.id.clone(),
                    name: role.name.clone(),
                    color: role.color.clone(),
                })
        })
        .collect();

    let categorized_roles =
        categorize_member_roles(&server_id, &member_roles, &db_roles, &role_categories);
    Ok(Json(MyDataInServer {
        id: authed.member.user.id.to_string(),
        display_name: authed.member.display_name().to_string(),
        display_avatar_url: authed.member.face(),
        categorized_roles,
    }))
}

/// Admin required.
/// GET /{serverId}/sync-roles — sync roles between the DB and Discord.
#[utoipa::path(get, path = "/discord/servers/{serverId}/sync-roles", tag = "servers",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, body = SyncRolesResponse), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn sync_roles(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<SyncRolesResponse>> {
    let access_token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &access_token, true, true)
            .await?;
    if authed.manage_guild_permission {
        let diff = bot::sync_roles_with_db_and_discord(&state, &server_id).await?;
        return Ok(Json(diff));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

/// Admin required.
/// PUT /{serverId} — update `verificationRequired`.
#[utoipa::path(put, path = "/discord/servers/{serverId}", tag = "servers",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    request_body = UpdateServerVerificationRequiredRequestBody,
    responses((status = 200, body = Vec<CreateServerResponse>), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn update_server(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
    Json(body): Json<UpdateServerVerificationRequiredRequestBody>,
) -> Result<Json<Vec<CreateServerResponse>>> {
    let access_token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &access_token, true, true)
            .await?;
    if authed.manage_guild_permission {
        let server = db::update_server_verification_required(
            &state.db,
            &server_id,
            body.verification_required,
        )
        .await?;
        return Ok(Json(server));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}
