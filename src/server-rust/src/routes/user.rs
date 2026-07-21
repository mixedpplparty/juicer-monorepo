//! Port of `../server/src/routes/discord/user.ts`.

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use axum_extra::extract::CookieJar;

use crate::discord::{bot, oauth};
use crate::error::{HttpError, Result};
use crate::models::MyInfo;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/me", get(me))
}

/// GET /discord/user/me — Discord user data passthrough + mutual guilds.
#[utoipa::path(get, path = "/discord/user/me", tag = "user", operation_id = "userMe",
    responses((status = 200, body = MyInfo), (status = 401, description = "Not authenticated")),
    security(("discord_cookie" = [])))]
pub(crate) async fn me(State(state): State<AppState>, jar: CookieJar) -> Result<Json<MyInfo>> {
    let access_token = jar
        .get("discord_access_token")
        .map(|c| c.value().to_string())
        .ok_or_else(|| HttpError::unauthorized("Unauthorized"))?;

    let user_data = oauth::get_discord_oauth_user_data(&state, &access_token).await?;
    let user_id = user_data
        .get("id")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .map(serenity::model::id::UserId::new)
        .ok_or_else(|| HttpError::internal("Discord error."))?;
    let guilds = bot::get_all_servers_user_and_bot_are_in(&state, user_id).await?;

    Ok(Json(MyInfo { user_data, guilds }))
}
