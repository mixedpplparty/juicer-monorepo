//! Port of `../server/src/routes/discord/server/roles.ts`.
//!
//! Nested under `/discord/servers/{serverId}/roles`.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use serde_json::json;

use crate::db;
use crate::discord::bot;
use crate::error::{HttpError, Result};
use crate::models::{Role, RoleSettingsView, SetRoleSelfAssignableRequestBody, UpdateRoleSettingsRequest};
use crate::state::AppState;
use crate::validation::{normalized_description, ROLE_DESCRIPTION_MAX};
use crate::views::build_role_settings_view;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_roles))
        .route("/settings", get(get_role_settings))
        .route("/{roleId}", patch(update_role_settings))
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
#[utoipa::path(get, path = "/discord/servers/{serverId}/roles/", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, description = "serverRoles + myRoles"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_all_roles(
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

#[utoipa::path(post, path = "/discord/servers/{serverId}/roles/{roleId}/assign", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("roleId" = String, Path, description = "Discord role ID")),
    responses((status = 200, description = "Role assigned"), (status = 400, description = "Role not self-assignable"), (status = 404, description = "Role not synced"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn assign_role(
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

#[utoipa::path(post, path = "/discord/servers/{serverId}/roles/{roleId}/unassign", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("roleId" = String, Path, description = "Discord role ID")),
    responses((status = 200, description = "Role unassigned"), (status = 400, description = "Role not self-assignable"), (status = 404, description = "Role not synced"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn unassign_role(
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

#[utoipa::path(post, path = "/discord/servers/{serverId}/roles/{roleId}/update", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("roleId" = String, Path, description = "Discord role ID")),
    request_body = SetRoleSelfAssignableRequestBody,
    responses((status = 200, body = Vec<Role>), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn update_role(
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

/// PATCH /{roleId} — partial role settings update (admin required).
#[utoipa::path(patch, path = "/discord/servers/{serverId}/roles/{roleId}", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("roleId" = String, Path, description = "Discord role ID")),
    request_body = UpdateRoleSettingsRequest,
    responses((status = 200, body = Role), (status = 400, description = "Validation failed"), (status = 404, description = "Role not found in this server"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn update_role_settings(
    State(state): State<AppState>,
    Path((server_id, role_id)): Path<(String, String)>,
    jar: CookieJar,
    Json(body): Json<UpdateRoleSettingsRequest>,
) -> Result<Json<Role>> {
    let token = access_token(&jar);
    bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    if body.role_category_id.is_none()
        && body.self_assignable.is_none()
        && body.description.is_none()
    {
        return Err(HttpError::bad_request("At least one role setting is required."));
    }
    if let Some(Some(category_id)) = body.role_category_id {
        if category_id <= 0 {
            return Err(HttpError::bad_request("Invalid role category ID."));
        }
    }
    let description = body
        .description
        .map(|value| normalized_description(value, ROLE_DESCRIPTION_MAX))
        .transpose()?;
    let role = db::update_role_settings(
        &state.db,
        &role_id,
        &server_id,
        body.role_category_id,
        body.self_assignable,
        description,
    )
    .await?;
    Ok(Json(role))
}

/// GET /settings — admin view model for the role settings menu (issue #50):
/// Discord/DB roles joined and policy (visibility, editability, deletability)
/// applied server-side.
#[utoipa::path(get, path = "/discord/servers/{serverId}/roles/settings", tag = "roles",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, body = RoleSettingsView), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_role_settings(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<RoleSettingsView>> {
    let token = access_token(&jar);
    let (authed, metadata) = tokio::join!(
        bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true),
        db::get_server_role_metadata(&state.db, &server_id),
    );
    authed?;
    let (db_roles, role_categories) = metadata?;
    let entities = bot::get_guild_channels_and_roles(&state, &server_id).await?;
    Ok(Json(build_role_settings_view(
        &server_id,
        &db_roles,
        &role_categories,
        &entities.roles,
    )))
}
