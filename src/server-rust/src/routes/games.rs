//! Port of ../server/src/routes/discord/server/games.ts
//!
//! Nested under `/discord/servers/{serverId}/games`, so every handler extracts
//! the accumulated path params starting with `serverId`.

use axum::{
    extract::{Multipart, Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use axum_extra::extract::CookieJar;

use crate::db::{self, UpdateGameParams};
use crate::discord::bot::authenticate_and_authorize_user;
use crate::error::{HttpError, Result};
use crate::models::{
    AddCategoryToGameRequestBody, CreateGameRequestBody, ModifyTagsOfGameRequestBody,
    UpdateGameRequestBody,
};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/create", post(create_game))
        .route("/{gameId}", put(update_game))
        .route("/{gameId}", delete(delete_game))
        .route("/{gameId}/categories/add", post(add_category_to_game))
        .route("/{gameId}/tags/tag", post(tag_game))
        .route("/{gameId}/tags/{tagId}/untag", post(untag_game))
        // Raise the default 2 MB body cap so an oversized upload reaches the
        // 100..=1_048_576 validation and gets a 400 like the TS backend
        // (multipart framing adds overhead beyond the 1 MiB payload cap).
        .route(
            "/{gameId}/thumbnail/update",
            put(update_thumbnail).layer(axum::extract::DefaultBodyLimit::max(4 * 1024 * 1024)),
        )
        .route("/{gameId}/thumbnail", get(get_thumbnail))
}

/// Read the `discord_access_token` cookie; the TS code passed `undefined`
/// straight through, so a missing cookie becomes an empty token that fails
/// downstream authentication with 401.
fn access_token(jar: &CookieJar) -> String {
    jar.get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default()
}

async fn create_game(
    State(state): State<AppState>,
    Path((server_id,)): Path<(String,)>,
    jar: CookieJar,
    Json(body): Json<CreateGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    // TS: body.categoryId ? (categoryId === 0 ? null : Number(categoryId)) : null
    let category_id = match body.category_id {
        Some(0) | None => None,
        Some(id) => Some(id),
    };
    let game = db::create_game(
        &state.db,
        &server_id,
        &body.name,
        body.description.as_deref(),
        category_id,
    )
    .await?;
    Ok(Json(game).into_response())
}

async fn update_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    Json(body): Json<UpdateGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    // The TS JSON handler can never carry a real File in `thumbnail`, so it
    // always resolved to null (not updated) — same here.
    let game = db::update_game(
        &state.db,
        game_id,
        &server_id,
        UpdateGameParams {
            name: body.name,
            description: body.description,
            category_id: body.category_id,
            thumbnail: None,
            channels: body.channels,
            tag_ids: body.tag_ids,
            role_ids: body.role_ids,
        },
    )
    .await?;
    Ok(Json(game).into_response())
}

async fn delete_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let game = db::delete_game(&state.db, game_id, &server_id).await?;
    Ok(Json(game).into_response())
}

async fn add_category_to_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    Json(body): Json<AddCategoryToGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let category =
        db::map_category_to_game(&state.db, game_id, &server_id, body.category_id).await?;
    Ok(Json(category).into_response())
}

/// Tag IDs currently assigned to `game_id` according to the server data blob.
async fn existing_tag_ids(state: &AppState, server_id: &str, game_id: i32) -> Result<Vec<i32>> {
    let server_data = db::get_server_data_in_db(&state.db, server_id).await?;
    Ok(server_data
        .and_then(|data| data.games)
        .and_then(|games| games.into_iter().find(|g| g.game.game_id == game_id))
        .and_then(|game| game.games_tags)
        .map(|tags| tags.into_iter().map(|t| t.tag_id).collect())
        .unwrap_or_default())
}

// add tags to game
// changes after migration: tags need to be created first in the tags route
async fn tag_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    Json(body): Json<ModifyTagsOfGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    // merge existing tag ids with the requested ones, removing duplicates
    // while preserving first-seen order (TS: [...new Set([...existing, ...body])]).
    let mut unique_tag_ids = existing_tag_ids(&state, &server_id, game_id).await?;
    for tag_id in body.tag_ids {
        if !unique_tag_ids.contains(&tag_id) {
            unique_tag_ids.push(tag_id);
        }
    }
    let tag = db::update_game(
        &state.db,
        game_id,
        &server_id,
        UpdateGameParams {
            name: None,
            description: None,
            category_id: None,
            thumbnail: None,
            channels: None,
            tag_ids: Some(unique_tag_ids),
            role_ids: None,
        },
    )
    .await?;
    Ok(Json(tag).into_response())
}

async fn untag_game(
    State(state): State<AppState>,
    Path((server_id, game_id, tag_id)): Path<(String, i32, i32)>,
    jar: CookieJar,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let existing = existing_tag_ids(&state, &server_id, game_id).await?;

    // check if the tag is actually assigned to this game
    if !existing.contains(&tag_id) {
        return Err(HttpError::not_found("Tag is not assigned to this game."));
    }

    // remove tagId from the game's current tags
    let new_tag_ids: Vec<i32> = existing.into_iter().filter(|id| *id != tag_id).collect();
    let tag = db::update_game(
        &state.db,
        game_id,
        &server_id,
        UpdateGameParams {
            name: None,
            description: None,
            category_id: None,
            thumbnail: None,
            channels: None,
            tag_ids: Some(new_tag_ids),
            role_ids: None,
        },
    )
    .await?;
    Ok(Json(tag).into_response())
}

async fn update_thumbnail(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    mut multipart: Multipart,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;

    // Pull the "file" field out of the multipart form.
    let mut file: Option<(Option<String>, Vec<u8>)> = None;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| HttpError::bad_request("Invalid multipart form data."))?
    {
        if field.name() == Some("file") {
            let content_type = field.content_type().map(|s| s.to_string());
            let bytes = field
                .bytes()
                .await
                .map_err(|_| HttpError::bad_request("Invalid multipart form data."))?;
            file = Some((content_type, bytes.to_vec()));
            break;
        }
    }

    match file {
        Some((content_type, bytes)) => {
            // ThumbnailImage: exact mime allowlist (shared zod schema),
            // 100..=1_048_576 bytes -> else 400.
            const ALLOWED_MIMES: [&str; 9] = [
                "image/png",
                "image/jpeg",
                "image/apng",
                "image/avif",
                "image/gif",
                "image/webp",
                "image/bmp",
                "image/svg+xml",
                "image/tiff",
            ];
            let is_image = content_type
                .as_deref()
                .is_some_and(|ct| ALLOWED_MIMES.contains(&ct));
            if !is_image || !(100..=1_048_576).contains(&bytes.len()) {
                return Err(HttpError::bad_request("Invalid thumbnail image."));
            }
            let thumbnail =
                db::update_game_thumbnail(&state.db, game_id, &server_id, &bytes).await?;
            Ok(Json(thumbnail).into_response())
        }
        // TS: file optional in the schema, but the handler's
        // `manageGuildPermission && filteredThumbnail` check fails without it.
        None => Err(HttpError::forbidden(
            "User does not have manage server permission.",
        )),
    }
}

async fn get_thumbnail(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Response> {
    let token = access_token(&jar);
    // Read-only image fetch hit once per game on the list — don't force a member
    // re-fetch (reuse cache) and don't require manage permission.
    authenticate_and_authorize_user(&state, &server_id, &token, false, false).await?;
    let thumbnail = db::get_game_thumbnail(&state.db, game_id, &server_id).await?;
    match thumbnail {
        Some(bytes) => Ok((
            StatusCode::OK,
            // Let the browser cache thumbnails: private (per-user, behind auth)
            // with a short max-age so updates go stale within minutes.
            [(header::CACHE_CONTROL, "private, max-age=300")],
            bytes,
        )
            .into_response()),
        None => Err(HttpError::not_found("Thumbnail not found.")),
    }
}
