//! Port of `../server/src/routes/discord/server/search.ts`.
//! Nested under `/discord/servers/{serverId}/search`.

use std::collections::HashSet;

use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use serde::Deserialize;

use crate::db;
use crate::discord::bot::{authenticate_and_authorize_user, get_guild_channels_and_roles};
use crate::error::Result;
use crate::models::{Game, TopicSearchResult};
use crate::state::AppState;
use crate::validation::filter_ids_by_name_match;
use crate::views::project_topic_search_results;

pub fn router() -> Router<AppState> {
    Router::new().route("/all", get(search_all))
}

#[derive(Debug, Deserialize)]
pub(crate) struct SearchQuery {
    query: Option<String>,
}

#[utoipa::path(get, path = "/discord/servers/{serverId}/search/all", tag = "search",
    params(("serverId" = String, Path, description = "Discord server (guild) ID"), ("query" = Option<String>, Query, description = "Matches topic name, tag, category, channel and role names; empty returns all topics")),
    responses((status = 200, body = Vec<TopicSearchResult>), (status = 403, description = "Missing manage permission or server verification required")),
    security(("discord_cookie" = [])))]
pub(crate) async fn search_all(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    Query(params): Query<SearchQuery>,
    jar: CookieJar,
) -> Result<Json<Vec<TopicSearchResult>>> {
    let access_token = jar
        .get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let authed =
        authenticate_and_authorize_user(&state, &server_id, &access_token, false, true).await?;
    let member_role_ids: std::collections::HashSet<String> =
        authed.member.roles.iter().map(|id| id.to_string()).collect();
    let entities = get_guild_channels_and_roles(&state, &server_id).await?;

    // Match TS: `if (!query)` — missing OR empty string both mean "all games".
    let query = match params.query.filter(|q| !q.is_empty()) {
        None => {
            let games = db::get_all_games_in_server(&state.db, &server_id).await?;
            return Ok(Json(project_topic_search_results(
                games,
                &entities,
                &member_role_ids,
            )));
        }
        Some(query) => query,
    };
    let matched_channel_ids = filter_ids_by_name_match(
        entities
            .channels
            .iter()
            .map(|channel| (channel.id.clone(), channel.name.as_str())),
        &query,
    );
    let matched_role_ids = filter_ids_by_name_match(
        entities
            .roles
            .iter()
            // @everyone would match generic queries yet is never a topic role
            .filter(|role| role.id != server_id)
            .map(|role| (role.id.clone(), role.name.as_str())),
        &query,
    );

    // The five lookups are independent — run them concurrently.
    let (games_by_name, games_by_tags, games_by_categories, games_by_channels, games_by_roles) =
        tokio::try_join!(
            db::find_games_by_name(&state.db, &server_id, &query),
            db::find_games_by_tags(&state.db, &server_id, std::slice::from_ref(&query)),
            db::find_games_by_category_name(&state.db, &server_id, &query),
            db::find_games_by_channel_ids(&state.db, &server_id, &matched_channel_ids),
            db::find_games_by_role_ids(&state.db, &server_id, &matched_role_ids),
        )?;

    let mut seen_ids: HashSet<i32> = HashSet::new();
    let unique_games: Vec<Game> = games_by_name
        .into_iter()
        .chain(games_by_tags)
        .chain(games_by_categories)
        .chain(games_by_channels)
        .chain(games_by_roles)
        .filter(|game| seen_ids.insert(game.game.game_id))
        .collect();
    Ok(Json(project_topic_search_results(
        unique_games,
        &entities,
        &member_role_ids,
    )))
}
