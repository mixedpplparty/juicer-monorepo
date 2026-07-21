//! Discord OAuth via reqwest (user-token endpoints).
//!
//! Port of `../server/src/functions/discord-oauth.ts` with the error mapping
//! from `../server/src/functions/axios-error-handler.ts`.

use axum::http::StatusCode;
use reqwest::Response;

use crate::error::{HttpError, Result};
use crate::state::AppState;

/// Mirror of `throwAxiosError` for responses that came back with a non-2xx
/// status (axios's `error.response` branch).
fn map_error_status(status: StatusCode) -> HttpError {
    match status.as_u16() {
        401 => HttpError::unauthorized("Most likely not authenticated."),
        404 => HttpError::not_found("User not found."),
        403 => HttpError::forbidden("User not authorized."),
        400 => HttpError::bad_request("Bad request."),
        500 => {
            tracing::error!("500");
            HttpError::internal("Internal server error.")
        }
        _ => {
            tracing::error!("Unhandled axios error");
            HttpError::internal("Unhandled axios error.")
        }
    }
}

/// Mirror of `throwAxiosError` for requests that never got a response
/// (axios's `error.request` branch — network / connection errors).
fn map_request_error(err: reqwest::Error) -> HttpError {
    tracing::error!(error = %err, "Error on request");
    HttpError::internal("Error on request.")
}

/// Checks the response status like axios does (axios rejects on non-2xx) and
/// maps failures through the axios-error-handler equivalents.
async fn check_status(response: Response) -> Result<Response> {
    let status = response.status();
    if status.is_success() {
        Ok(response)
    } else {
        Err(map_error_status(status))
    }
}

/// Mirror of the `error.request`-less catch-all: a 2xx response whose body
/// failed to decode ("Unhandled axios error.").
fn map_decode_error(err: reqwest::Error) -> HttpError {
    tracing::error!(error = %err, "Unhandled axios error");
    HttpError::internal("Unhandled axios error.")
}

/// GET https://discordapp.com/api/users/@me with a Bearer user token.
pub async fn get_discord_oauth_user_data(
    state: &AppState,
    access_token: &str,
) -> Result<serde_json::Value> {
    let response = state
        .http
        .get("https://discordapp.com/api/users/@me")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(map_request_error)?;
    let response = check_status(response).await?;
    response
        .json::<serde_json::Value>()
        .await
        .map_err(map_decode_error)
}

#[derive(serde::Deserialize)]
pub struct TokenResponse {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
}

/// POST {VITE_API_ENDPOINT}/oauth2/token — authorization_code grant.
pub async fn exchange_code(state: &AppState, code: &str) -> Result<TokenResponse> {
    let config = &state.config;
    let url = format!("{}/oauth2/token", config.discord_api_endpoint);
    let redirect_uri = config.redirect_uri.clone().unwrap_or_default();
    let form = [
        ("grant_type", "authorization_code"),
        ("code", code),
        ("redirect_uri", redirect_uri.as_str()),
    ];
    let response = state
        .http
        .post(url)
        .basic_auth(&config.discord_client_id, Some(&config.discord_client_secret))
        .form(&form)
        .send()
        .await
        .map_err(map_request_error)?;
    let response = check_status(response).await?;
    response.json::<TokenResponse>().await.map_err(map_decode_error)
}

/// POST {VITE_API_ENDPOINT}/oauth2/token — refresh_token grant.
pub async fn refresh_auth_token(state: &AppState, refresh_token: &str) -> Result<TokenResponse> {
    let config = &state.config;
    let url = format!("{}/oauth2/token", config.discord_api_endpoint);
    let form = [
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token),
    ];
    let response = state
        .http
        .post(url)
        .basic_auth(&config.discord_client_id, Some(&config.discord_client_secret))
        .form(&form)
        .send()
        .await
        .map_err(map_request_error)?;
    let response = check_status(response).await?;
    response.json::<TokenResponse>().await.map_err(map_decode_error)
}

/// POST {VITE_API_ENDPOINT}/oauth2/token/revoke.
pub async fn revoke_token(state: &AppState, token: &str, token_type_hint: &str) -> Result<()> {
    let config = &state.config;
    let url = format!("{}/oauth2/token/revoke", config.discord_api_endpoint);
    // TS defaulted a missing hint to "access_token".
    let hint = if token_type_hint.is_empty() {
        "access_token"
    } else {
        token_type_hint
    };
    let form = [("token", token), ("token_type_hint", hint)];
    let response = state
        .http
        .post(url)
        .basic_auth(&config.discord_client_id, Some(&config.discord_client_secret))
        .form(&form)
        .send()
        .await
        .map_err(map_request_error)?;
    check_status(response).await?;
    Ok(())
}
