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
use crate::models::{CreateServerResponse, GuildMemberResponse, ServerData, SyncRolesResponse, UpdateServerVerificationRequiredRequestBody};
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
async fn get_server_data(
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
async fn create_server(
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

/// GET /{serverId}/me — my member data in the server.
async fn get_my_data_in_server(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<GuildMemberResponse>> {
    let access_token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &access_token, false, true)
            .await?;
    Ok(Json(bot::member_to_response(&authed.member)))
}

/// Admin required.
/// GET /{serverId}/sync-roles — sync roles between the DB and Discord.
async fn sync_roles(
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
async fn update_server(
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
