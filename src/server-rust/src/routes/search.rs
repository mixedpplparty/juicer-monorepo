//! Port of `../server/src/routes/discord/server/search.ts`.
//! Nested under `/discord/servers/{serverId}/search`.

use std::collections::HashSet;

use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use serde::Deserialize;

use crate::db;
use crate::discord::bot::authenticate_and_authorize_user;
use crate::error::Result;
use crate::models::Game;
use crate::state::AppState;

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

    // The three lookups are independent — run them concurrently.
    let (games_by_name, games_by_tags, games_by_categories) = tokio::try_join!(
        db::find_games_by_name(&state.db, &server_id, &query),
        db::find_games_by_tags(&state.db, &server_id, std::slice::from_ref(&query)),
        db::find_games_by_category_name(&state.db, &server_id, &query),
    )?;

    let mut seen_ids: HashSet<i32> = HashSet::new();
    let unique_games: Vec<Game> = games_by_name
        .into_iter()
        .chain(games_by_tags)
        .chain(games_by_categories)
        .filter(|game| seen_ids.insert(game.game.game_id))
        .collect();
    Ok(Json(unique_games))
}
