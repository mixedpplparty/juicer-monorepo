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
use crate::discord::bot::{
    authenticate_and_authorize_user, get_guild_channels_and_roles,
    validate_guild_channels_and_roles,
};
use crate::error::{HttpError, Result};
use crate::models::{
    AddCategoryToGameRequestBody, AssociableOptions, CreateGameRequestBody,
    GameWithoutRelations, ModifyTagsOfGameRequestBody, TopicDetails, TopicDetailsChannel,
    TopicDetailsRole, UpdateGameRequestBody, UpdateGameResponse,
};
use crate::state::AppState;
use crate::views::build_associable_options;
use crate::validation::{
    normalized_description, validated_db_ids, validated_discord_ids, validated_name,
    DESCRIPTION_MAX, GAME_NAME_MAX,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/create", post(create_game))
        .route("/associables", get(get_associables))
        .route("/{gameId}", get(get_game_details).put(update_game))
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

/// GET /{gameId} — topic details with resolved channel/role names.
#[utoipa::path(get, path = "/discord/servers/{serverId}/games/{gameId}", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    responses((status = 200, body = TopicDetails), (status = 404, description = "Game not found"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_game_details(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Json<TopicDetails>> {
    let token = access_token(&jar);
    // Read-only detail view: reuse the member cache instead of forcing a fetch.
    let (game, authed) = tokio::join!(
        db::get_game_details_in_db(&state.db, game_id, &server_id),
        authenticate_and_authorize_user(&state, &server_id, &token, false, false),
    );
    let authed = authed?;
    let Some(game) = game? else {
        return Err(HttpError::not_found("Game not found."));
    };

    let role_metadata = if game.role_ids.is_empty() {
        Vec::new()
    } else {
        db::get_roles_in_server_in_db_by_role_ids(&state.db, &server_id, &game.role_ids).await?
    };
    let metadata_by_role_id: std::collections::HashMap<&str, &crate::models::Role> =
        role_metadata.iter().map(|role| (role.role_id.as_str(), role)).collect();

    let entities = get_guild_channels_and_roles(&state, &server_id).await?;
    let channel_name_by_id: std::collections::HashMap<&str, &str> = entities
        .channels
        .iter()
        .map(|channel| (channel.id.as_str(), channel.name.as_str()))
        .collect();
    let guild_role_by_id: std::collections::HashMap<&str, &crate::discord::bot::GuildRoleLite> =
        entities.roles.iter().map(|role| (role.id.as_str(), role)).collect();
    let member_role_ids: std::collections::HashSet<String> =
        authed.member.roles.iter().map(|id| id.to_string()).collect();

    // Channels/roles that no longer exist in the guild are dropped, and roles
    // without DB metadata are dropped — mirrors the old backend.
    let channels: Vec<TopicDetailsChannel> = game
        .channels
        .iter()
        .filter_map(|channel_id| {
            channel_name_by_id.get(channel_id.as_str()).map(|name| TopicDetailsChannel {
                id: channel_id.clone(),
                name: (*name).to_string(),
            })
        })
        .collect();
    let roles: Vec<TopicDetailsRole> = game
        .role_ids
        .iter()
        .filter_map(|role_id| {
            let guild_role = guild_role_by_id.get(role_id.as_str())?;
            let metadata = metadata_by_role_id.get(role_id.as_str())?;
            Some(TopicDetailsRole {
                id: role_id.clone(),
                name: guild_role.name.clone(),
                color: guild_role.color.clone(),
                description: metadata.description.clone(),
                self_assignable: metadata.self_assignable,
                assigned: member_role_ids.contains(role_id),
            })
        })
        .collect();

    Ok(Json(TopicDetails {
        game_id: game.game_id,
        server_id: game.server_id,
        name: game.name,
        description: game.description,
        category: game.category,
        channels,
        roles,
    }))
}

#[utoipa::path(post, path = "/discord/servers/{serverId}/games/create", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    request_body = CreateGameRequestBody,
    responses((status = 200, body = GameWithoutRelations), (status = 400, description = "Validation failed"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn create_game(
    State(state): State<AppState>,
    Path((server_id,)): Path<(String,)>,
    jar: CookieJar,
    Json(body): Json<CreateGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let name = validated_name(&body.name, GAME_NAME_MAX, "Name")?;
    let description = normalized_description(body.description, DESCRIPTION_MAX)?;
    // TS: body.categoryId ? (categoryId === 0 ? null : Number(categoryId)) : null
    let category_id = match body.category_id {
        Some(0) | None => None,
        Some(id) => Some(id),
    };
    let game = db::create_game(
        &state.db,
        &server_id,
        &name,
        description.as_deref(),
        category_id,
    )
    .await?;
    Ok(Json(game).into_response())
}

#[utoipa::path(put, path = "/discord/servers/{serverId}/games/{gameId}", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    request_body = UpdateGameRequestBody,
    responses((status = 200, body = UpdateGameResponse), (status = 400, description = "Validation failed"), (status = 404, description = "Game not found"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn update_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    Json(body): Json<UpdateGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    // absent fields mean "leave unchanged"
    let name = body
        .name
        .map(|name| validated_name(&name, GAME_NAME_MAX, "Name"))
        .transpose()?;
    let description = normalized_description(body.description, DESCRIPTION_MAX)?;
    let channels = body
        .channels
        .map(|ids| validated_discord_ids(ids, "channel"))
        .transpose()?;
    let tag_ids = body
        .tag_ids
        .map(|ids| validated_db_ids(ids, "tag"))
        .transpose()?;
    let role_ids = body
        .role_ids
        .map(|ids| validated_discord_ids(ids, "role"))
        .transpose()?;
    validate_guild_channels_and_roles(
        &state,
        &server_id,
        channels.as_deref(),
        role_ids.as_deref(),
    )
    .await?;
    // The TS JSON handler can never carry a real File in `thumbnail`, so it
    // always resolved to null (not updated) — same here.
    let game = db::update_game(
        &state.db,
        game_id,
        &server_id,
        UpdateGameParams {
            name,
            description,
            category_id: body.category_id,
            thumbnail: None,
            channels,
            tag_ids,
            role_ids,
        },
    )
    .await?;
    Ok(Json(game).into_response())
}

#[utoipa::path(delete, path = "/discord/servers/{serverId}/games/{gameId}", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    responses((status = 200, body = GameWithoutRelations), (status = 404, description = "Game not found"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn delete_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let game = db::delete_game(&state.db, game_id, &server_id).await?;
    Ok(Json(game).into_response())
}

#[utoipa::path(post, path = "/discord/servers/{serverId}/games/{gameId}/categories/add", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    request_body = AddCategoryToGameRequestBody,
    responses((status = 200, body = Vec<GameWithoutRelations>), (status = 400, description = "Category does not belong to this server"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn add_category_to_game(
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
    // One targeted query — this previously materialized the whole server
    // aggregate (~8 queries) just to read one game's tag list. Game existence/
    // ownership is enforced by update_game's own 404 check right after.
    Ok(sqlx::query_scalar(
        "SELECT gt.tag_id FROM games_tags gt \
         JOIN games g ON g.game_id = gt.game_id \
         WHERE gt.game_id = $1 AND g.server_id = $2",
    )
    .bind(game_id)
    .bind(server_id)
    .fetch_all(&state.db)
    .await?)
}

// add tags to game
// changes after migration: tags need to be created first in the tags route
#[utoipa::path(post, path = "/discord/servers/{serverId}/games/{gameId}/tags/tag", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    request_body = ModifyTagsOfGameRequestBody,
    responses((status = 200, body = UpdateGameResponse), (status = 400, description = "Validation failed"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn tag_game(
    State(state): State<AppState>,
    Path((server_id, game_id)): Path<(String, i32)>,
    jar: CookieJar,
    Json(body): Json<ModifyTagsOfGameRequestBody>,
) -> Result<Response> {
    let token = access_token(&jar);
    authenticate_and_authorize_user(&state, &server_id, &token, true, true).await?;
    let requested_tag_ids = validated_db_ids(body.tag_ids, "tag")?;
    // merge existing tag ids with the requested ones, removing duplicates
    // while preserving first-seen order (TS: [...new Set([...existing, ...body])]).
    let mut unique_tag_ids = existing_tag_ids(&state, &server_id, game_id).await?;
    for tag_id in requested_tag_ids {
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

#[utoipa::path(post, path = "/discord/servers/{serverId}/games/{gameId}/tags/{tagId}/untag", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID"), ("tagId" = i32, Path, description = "Tag ID")),
    responses((status = 200, body = UpdateGameResponse), (status = 404, description = "Tag is not assigned to this game"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn untag_game(
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

#[utoipa::path(put, path = "/discord/servers/{serverId}/games/{gameId}/thumbnail/update", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    request_body(content_type = "multipart/form-data", description = "Form field \"file\": image, 100 B to 1 MiB"),
    responses((status = 200, body = Vec<GameWithoutRelations>), (status = 400, description = "Invalid thumbnail image"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn update_thumbnail(
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

/// Magic-byte sniff over the stored bytea (the upload's mime isn't persisted;
/// the TS backend sent no Content-Type at all and let browsers sniff).
fn sniff_image_mime(bytes: &[u8]) -> &'static str {
    match bytes {
        [0x89, b'P', b'N', b'G', ..] => "image/png",
        [0xFF, 0xD8, 0xFF, ..] => "image/jpeg",
        [b'G', b'I', b'F', b'8', ..] => "image/gif",
        [b'B', b'M', ..] => "image/bmp",
        [b'R', b'I', b'F', b'F', _, _, _, _, b'W', b'E', b'B', b'P', ..] => "image/webp",
        [0x49, 0x49, 0x2A, 0x00, ..] | [0x4D, 0x4D, 0x00, 0x2A, ..] => "image/tiff",
        _ if bytes.len() > 11 && &bytes[4..12] == b"ftypavif" => "image/avif",
        _ if bytes.starts_with(b"<?xml") || bytes.starts_with(b"<svg") => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

#[utoipa::path(get, path = "/discord/servers/{serverId}/games/{gameId}/thumbnail", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("gameId" = i32, Path, description = "Topic (game) ID")),
    responses((status = 200, description = "Thumbnail image bytes"), (status = 404, description = "Thumbnail not found"), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_thumbnail(
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
            [
                (header::CACHE_CONTROL, "private, max-age=300"),
                (header::CONTENT_TYPE, sniff_image_mime(&bytes)),
            ],
            bytes,
        )
            .into_response()),
        None => Err(HttpError::not_found("Thumbnail not found.")),
    }
}

/// GET /associables — channels/roles a topic may be associated with (issue
/// #51), following the same policy the update validation enforces.
#[utoipa::path(get, path = "/discord/servers/{serverId}/games/associables", tag = "games",
    params(("serverId" = String, Path, description = "Discord server (guild) ID")),
    responses((status = 200, body = AssociableOptions), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn get_associables(
    State(state): State<AppState>,
    Path((server_id,)): Path<(String,)>,
    jar: CookieJar,
) -> Result<Json<AssociableOptions>> {
    let token = access_token(&jar);
    let (authed, db_roles) = tokio::join!(
        authenticate_and_authorize_user(&state, &server_id, &token, true, true),
        db::get_all_roles_in_server_in_db(&state.db, &server_id),
    );
    authed?;
    let db_roles = db_roles?;
    let entities = get_guild_channels_and_roles(&state, &server_id).await?;
    Ok(Json(build_associable_options(&server_id, &entities, &db_roles)))
}
