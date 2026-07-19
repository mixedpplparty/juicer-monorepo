//! Port of `../server/src/routes/discord/server/index.ts`.

use axum::extract::{Path, State};
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
        db::create_server(&state.db, &server_id).await?;
        // verification is always ID 1
        db::create_role_category(&state.db, &server_id, "verification").await?;
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
