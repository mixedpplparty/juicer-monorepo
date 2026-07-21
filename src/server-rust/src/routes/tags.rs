//! Port of `../server/src/routes/discord/server/tags.ts`.
//! Nested under `/discord/servers/{serverId}/tags`.

use axum::extract::{Path, State};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use axum_extra::extract::CookieJar;

use crate::db;
use crate::discord::bot::authenticate_and_authorize_user;
use crate::error::{HttpError, Result};
use crate::models::{NameRequiredRequestBody, Tag};
use crate::state::AppState;
use crate::validation::{validated_name, TAG_NAME_MAX};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_tags))
        .route("/create", post(create_tag))
        .route("/{tagId}", delete(delete_tag))
}

fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

async fn get_tags(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
) -> Result<Json<Vec<Tag>>> {
    let access_token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &access_token, true, true).await?;
    let tags = db::get_all_tags_in_server(&state.db, &server_id).await?;
    Ok(Json(tags))
}

async fn create_tag(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    jar: CookieJar,
    Json(body): Json<NameRequiredRequestBody>,
) -> Result<Json<Vec<Tag>>> {
    let access_token = access_token(&jar);
    let authed =
        authenticate_and_authorize_user(&state, &server_id, &access_token, true, true).await?;
    if authed.manage_guild_permission {
        let name = validated_name(&body.name, TAG_NAME_MAX, "Name")?;
        let tag = db::create_tag(&state.db, &server_id, &name).await?;
        return Ok(Json(tag));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}

async fn delete_tag(
    State(state): State<AppState>,
    Path((server_id, tag_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Json<Vec<Tag>>> {
    let access_token = access_token(&jar);
    let authed =
        authenticate_and_authorize_user(&state, &server_id, &access_token, true, true).await?;
    if authed.manage_guild_permission {
        let tag = db::delete_tag(&state.db, tag_id, &server_id).await?;
        return Ok(Json(tag));
    }
    Err(HttpError::forbidden(
        "User does not have manage server permission.",
    ))
}
