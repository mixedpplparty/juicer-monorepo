mod config;
mod db;
mod discord;
mod error;
mod middleware;
mod models;
mod routes;
mod state;

use std::sync::Arc;

use serenity::prelude::GatewayIntents;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=info".into()),
        )
        .init();

    let config = Arc::new(config::Config::from_env());
    tracing::info!(origins = ?config.allowed_origins, "Allowed Origins");

    let db = sqlx::postgres::PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url())
        .await
        .expect("failed to connect to Postgres");

    // Serenity gateway client: Guilds intent only, mirroring the old bot.
    let mut discord_client =
        serenity::Client::builder(&config.discord_bot_token, GatewayIntents::GUILDS)
            .event_handler(discord::bot::ReadyHandler)
            .await
            .expect("failed to build Discord client");
    let discord_http = discord_client.http.clone();
    let discord_cache = discord_client.cache.clone();
    tokio::spawn(async move {
        if let Err(err) = discord_client.start().await {
            tracing::error!(error = %err, "Discord gateway client exited");
        }
    });

    let state = state::AppState {
        db,
        config: config.clone(),
        discord_http,
        discord_cache,
        http: reqwest::Client::new(),
    };

    let app = middleware::apply(routes::router(state.clone()), config.clone());

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", 8000))
        .await
        .expect("failed to bind port 8000");
    tracing::info!("Server is running on http://localhost:8000");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await
    .expect("server error");
}
