//! Port of `../server/src/routes/discord/server/roles.ts`.
//!
//! Nested under `/discord/servers/{serverId}/roles`.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use serde_json::json;

use crate::db;
use crate::discord::bot;
use crate::error::{HttpError, Result};
use crate::models::SetRoleSelfAssignableRequestBody;
use crate::state::AppState;
use crate::validation::{normalized_description, ROLE_DESCRIPTION_MAX};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_roles))
        .route("/{roleId}/assign", post(assign_role))
        .route("/{roleId}/unassign", post(unassign_role))
        .route("/{roleId}/update", post(update_role))
}

fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

// Admin required
// Get all roles within guild (server).
async fn get_all_roles(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let data = bot::get_guild_and_member_data(&state, &server_id, &token, true).await?;
    let my_roles: Vec<String> = data
        .member
        .roles
        .iter()
        .map(|role_id| role_id.to_string())
        .collect();
    Ok(Json(json!({
        "serverRoles": data.guild.roles,
        "myRoles": my_roles,
    })))
}

async fn assign_role(
    State(state): State<AppState>,
    Path((server_id, role_id)): Path<(String, String)>,
    jar: CookieJar,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, false, true).await?;
    let role_info_in_db =
        db::get_roles_in_server_in_db_by_role_ids(&state.db, &server_id, std::slice::from_ref(&role_id))
            .await?;
    if role_info_in_db.is_empty() {
        return Err(HttpError::not_found(
            "Role not found in DB. If role exists in server, it needs to be synced.",
        ));
    }
    if !role_info_in_db[0].self_assignable {
        return Err(HttpError::bad_request(
            "Role is marked as not self-assignable in DB.",
        ));
    }
    bot::assign_roles_to_user(
        &state,
        &server_id,
        authed.member.user.id,
        &[role_id],
    )
    .await?;
    Ok((
        StatusCode::OK,
        Json(json!({ "message": "Role assigned successfully." })),
    ))
}

async fn unassign_role(
    State(state): State<AppState>,
    Path((server_id, role_id)): Path<(String, String)>,
    jar: CookieJar,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, false, true).await?;
    let role_info_in_db =
        db::get_roles_in_server_in_db_by_role_ids(&state.db, &server_id, std::slice::from_ref(&role_id))
            .await?;
    if role_info_in_db.is_empty() {
        return Err(HttpError::not_found(
            "Role not found in DB. If role exists in server, it needs to be synced.",
        ));
    }
    if !role_info_in_db[0].self_assignable {
        return Err(HttpError::bad_request(
            "Role is marked as not self-assignable in DB.",
        ));
    }
    bot::unassign_roles_from_user(
        &state,
        &server_id,
        authed.member.user.id,
        &[role_id],
    )
    .await?;
    Ok((
        StatusCode::OK,
        Json(json!({ "message": "Role unassigned successfully." })),
    ))
}

async fn update_role(
    State(state): State<AppState>,
    Path((server_id, role_id)): Path<(String, String)>,
    jar: CookieJar,
    Json(body): Json<SetRoleSelfAssignableRequestBody>,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    if authed.manage_guild_permission {
        // present-but-empty clears the description; absent keeps it
        let description = body
            .description
            .map(|value| normalized_description(value, ROLE_DESCRIPTION_MAX))
            .transpose()?;
        let role = db::update_role_info(
            &state.db,
            &role_id,
            &server_id,
            body.self_assignable,
            description,
        )
        .await?;
        return Ok((StatusCode::OK, Json(role)));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}
