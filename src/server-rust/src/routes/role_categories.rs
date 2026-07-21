//! Port of `../server/src/routes/discord/server/role-categories.ts`.
//!
//! Nested under `/discord/servers/{serverId}/role-categories`.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;

use crate::db;
use crate::discord::bot;
use crate::error::{HttpError, Result};
use crate::models::{AssignRoleCategoryToRoleRequestBody, NameRequiredRequestBody};
use crate::state::AppState;
use crate::validation::{is_valid_discord_id, validated_name, CATEGORY_NAME_MAX};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/create", post(create_role_category))
        .route("/{roleCategoryId}", delete(delete_role_category))
        .route("/assign", post(assign_role_category))
}

fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

async fn create_role_category(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
    Json(body): Json<NameRequiredRequestBody>,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    if authed.manage_guild_permission {
        let name = validated_name(&body.name, CATEGORY_NAME_MAX, "Name")?;
        let role_category = db::create_role_category(&state.db, &server_id, &name, false).await?;
        return Ok((StatusCode::OK, Json(role_category)));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

async fn delete_role_category(
    State(state): State<AppState>,
    Path((server_id, role_category_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    if authed.manage_guild_permission {
        let role_category =
            db::delete_role_category(&state.db, role_category_id, &server_id).await?;
        return Ok((StatusCode::OK, Json(role_category)));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

async fn assign_role_category(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
    Json(body): Json<AssignRoleCategoryToRoleRequestBody>,
) -> Result<impl IntoResponse> {
    let token = access_token(&jar);
    let authed =
        bot::authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    if authed.manage_guild_permission {
        if !is_valid_discord_id(&body.role_id) {
            return Err(HttpError::bad_request("Invalid role ID."));
        }
        if body.role_category_id.is_some_and(|id| id <= 0) {
            return Err(HttpError::bad_request("Invalid role category ID."));
        }
        let role_category = db::update_role_category_of_role(
            &state.db,
            &body.role_id,
            body.role_category_id,
            &server_id,
        )
        .await?;
        return Ok((StatusCode::OK, Json(role_category)));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}
