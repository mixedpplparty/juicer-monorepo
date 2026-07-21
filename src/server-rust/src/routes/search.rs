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
use crate::models::Game;
use crate::state::AppState;
use crate::validation::filter_ids_by_name_match;

pub fn router() -> Router<AppState> {
    Router::new().route("/all", get(search_all))
}

#[derive(Debug, Deserialize)]
struct SearchQuery {
    query: Option<String>,
}

async fn search_all(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    Query(params): Query<SearchQuery>,
    jar: CookieJar,
) -> Result<Json<Vec<Game>>> {
    let access_token = jar
        .get("discord_access_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    authenticate_and_authorize_user(&state, &server_id, &access_token, false, true).await?;

    // Match TS: `if (!query)` — missing OR empty string both mean "all games".
    let query = match params.query.filter(|q| !q.is_empty()) {
        None => {
            let games = db::get_all_games_in_server(&state.db, &server_id).await?;
            return Ok(Json(games));
        }
        Some(query) => query,
    };

    let entities = get_guild_channels_and_roles(&state, &server_id).await?;
    let matched_channel_ids = filter_ids_by_name_match(
        entities
            .channels
            .iter()
            .map(|(id, name)| (id.clone(), name.as_str())),
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
    Ok(Json(unique_games))
}
