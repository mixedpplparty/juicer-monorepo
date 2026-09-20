//! API route tree and readiness endpoint.

pub mod auth;
pub mod categories;
pub mod games;
pub mod role_categories;
pub mod roles;
pub mod search;
pub mod server;
pub mod swagger;
pub mod tags;
pub mod user;

use axum::Router;

use crate::state::AppState;

pub fn router(state: AppState) -> Router {
    let mut router = Router::new()
        .route("/health/ready", axum::routing::get(ready))
        .nest("/discord/auth", auth::router())
        .nest("/discord/user", user::router())
        .nest(
            "/discord/servers",
            server::router().layer(axum::middleware::from_fn_with_state(
                state.clone(),
                server::verification_guard,
            )),
        );
    // API docs are hidden in production unless ENABLE_API_DOCS says otherwise.
    if state.config.docs_enabled() {
        tracing::info!("API docs enabled at /docs (spec at /swagger)");
        router = router
            .nest("/swagger", swagger::router())
            .nest("/docs", swagger::docs_router());
    }
    router.with_state(state)
}

async fn ready(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> axum::http::StatusCode {
    match tokio::time::timeout(
        std::time::Duration::from_secs(3),
        crate::migrations::check(&state.db),
    )
    .await
    {
        Ok(Ok(())) => axum::http::StatusCode::OK,
        _ => axum::http::StatusCode::SERVICE_UNAVAILABLE,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use std::sync::Arc;
    use tower::ServiceExt;

    #[sqlx::test]
    async fn readiness_tracks_database_schema(pool: sqlx::PgPool) {
        let state = AppState {
            db: pool.clone(),
            config: Arc::new(crate::config::Config::from_env()),
            discord_http: Arc::new(serenity::http::Http::new("test-only")),
            discord_cache: Arc::new(serenity::cache::Cache::default()),
            http: reqwest::Client::new(),
        };
        let app = router(state);
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/health/ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        sqlx::query("DELETE FROM _sqlx_migrations WHERE version=3")
            .execute(&pool)
            .await
            .unwrap();
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health/ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
