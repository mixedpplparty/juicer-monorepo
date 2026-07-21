//! Port of `../server/src/routes/discord/server/categories.ts`.
//! Nested under `/discord/servers/{serverId}/categories`.

use axum::extract::{Path, State};
use axum::routing::{delete, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;

use crate::db;
use crate::discord::bot::authenticate_and_authorize_user;
use crate::error::{HttpError, Result};
use crate::models::{Category, NameRequiredRequestBody};
use crate::state::AppState;
use crate::validation::{validated_name, CATEGORY_NAME_MAX};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/create", post(create_category))
        .route("/{categoryId}", delete(delete_category))
}

fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

async fn create_category(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
    Json(body): Json<NameRequiredRequestBody>,
) -> Result<Json<Vec<Category>>> {
    let access_token = access_token(&jar);
    let authed =
        authenticate_and_authorize_user(&state, &server_id, &access_token, true, true).await?;
    if authed.manage_guild_permission {
        let name = validated_name(&body.name, CATEGORY_NAME_MAX, "Name")?;
        let category = db::create_category(&state.db, &server_id, &name).await?;
        return Ok(Json(category));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

async fn delete_category(
    State(state): State<AppState>,
    Path((server_id, category_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Json<Vec<Category>>> {
    let access_token = access_token(&jar);
    let authed =
        authenticate_and_authorize_user(&state, &server_id, &access_token, true, true).await?;
    if authed.manage_guild_permission {
        let category = db::delete_category(&state.db, category_id, &server_id).await?;
        return Ok(Json(category));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}
