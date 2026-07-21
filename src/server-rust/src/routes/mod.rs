//! Route tree — port of `../server/src/index.ts` app mounting.

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
    Router::new()
        .nest("/discord/auth", auth::router())
        .nest("/discord/user", user::router())
        .nest(
            "/discord/servers",
            server::router().layer(axum::middleware::from_fn_with_state(
                state.clone(),
                server::verification_guard,
            )),
        )
        .nest("/swagger", swagger::router())
        .nest("/docs", swagger::docs_router())
        .with_state(state)
}
