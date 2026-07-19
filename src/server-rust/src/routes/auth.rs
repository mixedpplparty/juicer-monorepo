//! Port of ../server/src/routes/discord/auth.ts (Hono) to axum.
//!
//! Routes: GET /me; GET /callback; POST /refresh; POST /revoke; GET /remove-cookies

use axum::extract::{Query, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::Deserialize;
use serde_json::json;

use crate::discord::oauth;
use crate::error::{HttpError, Result};
use crate::state::AppState;

const ACCESS_TOKEN_COOKIE: &str = "discord_access_token";
const REFRESH_TOKEN_COOKIE: &str = "discord_refresh_token";

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/me", get(me))
        .route("/callback", get(callback))
        .route("/refresh", post(refresh))
        .route("/revoke", post(revoke))
        .route("/remove-cookies", get(remove_cookies))
}

/// Hono's `c.redirect` defaults to 302 Found; `axum::response::Redirect` only
/// offers 303/307/308, so build the 302 response directly to match the TS
/// backend's status code exactly.
fn found(location: &str) -> Response {
    (StatusCode::FOUND, [(header::LOCATION, location.to_string())]).into_response()
}

/// Auth cookie with the same attributes as the TS backend's `setCookie` calls:
/// HttpOnly; SameSite=Lax; Path=/ (Hono default); Secure in production;
/// Max-Age=expires_in when present.
fn auth_cookie(
    name: &str,
    value: &str,
    expires_in: Option<i64>,
    secure: bool,
) -> Cookie<'static> {
    let mut raw = format!("{name}={value}; HttpOnly; SameSite=Lax; Path=/");
    if let Some(max_age) = expires_in {
        raw.push_str(&format!("; Max-Age={max_age}"));
    }
    if secure {
        raw.push_str("; Secure");
    }
    // The string is well-formed by construction; fall back to a bare
    // name=value cookie if parsing somehow fails.
    Cookie::parse(raw).unwrap_or_else(|_| Cookie::new(name.to_string(), value.to_string()))
}

/// Mirror of Hono's `deleteCookie`: expire the cookie at Path=/.
fn removal_cookie(name: &'static str) -> Cookie<'static> {
    Cookie::build((name, "")).path("/").build()
}

// only userData
async fn me(State(state): State<AppState>, jar: CookieJar) -> Result<Response> {
    let access_token = jar
        .get(ACCESS_TOKEN_COOKIE)
        .map(|c| c.value().to_string())
        .ok_or_else(|| HttpError::unauthorized("Unauthorized"))?;
    let user_data = oauth::get_discord_oauth_user_data(&state, &access_token).await?;
    Ok(Json(json!({ "userData": user_data })).into_response())
}

#[derive(Deserialize)]
struct CallbackQuery {
    code: Option<String>,
}

async fn callback(
    State(state): State<AppState>,
    jar: CookieJar,
    Query(query): Query<CallbackQuery>,
) -> Result<Response> {
    let code = query.code.unwrap_or_default();
    let token_data = oauth::exchange_code(&state, &code).await?;
    let secure = state.config.is_production();

    let mut jar = jar;
    match token_data.access_token {
        Some(access_token) => {
            jar = jar.add(auth_cookie(
                ACCESS_TOKEN_COOKIE,
                &access_token,
                token_data.expires_in,
                secure,
            ));
        }
        None => {
            return Ok(found(&state.config.redirect_after_sign_in_failed_uri));
        }
    }
    if let Some(refresh_token) = token_data.refresh_token {
        jar = jar.add(auth_cookie(
            REFRESH_TOKEN_COOKIE,
            &refresh_token,
            token_data.expires_in,
            secure,
        ));
    }
    Ok((jar, found(&state.config.redirect_after_sign_in_uri)).into_response())
}

async fn refresh(State(state): State<AppState>, jar: CookieJar) -> Result<Response> {
    // The TS code passed the (possibly missing) cookie straight through and let
    // the OAuth call fail; mirror that by defaulting to an empty token.
    let refresh_token = jar
        .get(REFRESH_TOKEN_COOKIE)
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let token_data = oauth::refresh_auth_token(&state, &refresh_token).await?;
    let secure = state.config.is_production();

    let mut jar = jar;
    match token_data.access_token {
        Some(access_token) => {
            jar = jar.add(auth_cookie(
                ACCESS_TOKEN_COOKIE,
                &access_token,
                token_data.expires_in,
                secure,
            ));
        }
        None => {
            return Ok(found(&state.config.redirect_after_sign_in_failed_uri));
        }
    }
    if let Some(new_refresh_token) = token_data.refresh_token {
        jar = jar.add(auth_cookie(
            REFRESH_TOKEN_COOKIE,
            &new_refresh_token,
            token_data.expires_in,
            secure,
        ));
    }
    Ok((jar, found(&state.config.redirect_after_sign_in_uri)).into_response())
}

async fn revoke(State(state): State<AppState>, jar: CookieJar) -> Result<Response> {
    let access_token = jar
        .get(ACCESS_TOKEN_COOKIE)
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let refresh_token = jar
        .get(REFRESH_TOKEN_COOKIE)
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    oauth::revoke_token(&state, &access_token, "access_token").await?;
    oauth::revoke_token(&state, &refresh_token, "refresh_token").await?;
    let jar = jar
        .remove(removal_cookie(ACCESS_TOKEN_COOKIE))
        .remove(removal_cookie(REFRESH_TOKEN_COOKIE));
    Ok((jar, found(&state.config.redirect_after_sign_in_uri)).into_response())
}

async fn remove_cookies(jar: CookieJar) -> Result<Response> {
    let jar = jar
        .remove(removal_cookie(ACCESS_TOKEN_COOKIE))
        .remove(removal_cookie(REFRESH_TOKEN_COOKIE));
    Ok((jar, Json(json!({ "detail": "Cookies removed" }))).into_response())
}
