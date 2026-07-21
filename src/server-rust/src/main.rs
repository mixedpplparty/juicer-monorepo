mod config;
mod db;
mod discord;
mod error;
mod member_roles;
mod middleware;
mod models;
mod routes;
mod state;
mod validation;
mod views;

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

    db::ensure_verification_category_schema(&db)
        .await
        .expect("failed to ensure verification category schema");

    // Serenity gateway client: Guilds intent only, mirroring the old bot.
    let mut discord_client =
        serenity::Client::builder(&config.discord_bot_token, GatewayIntents::GUILDS)
            .event_handler(discord::bot::ReadyHandler)
            .await
            .expect("failed to build Discord client");
    let discord_http = discord_client.http.clone();
    let discord_cache = discord_client.cache.clone();
    let shard_manager = discord_client.shard_manager.clone();
    // Gateway exits are retried with capped backoff; persistent failure (e.g. a
    // rotated token) kills the process so the orchestrator restarts it instead
    // of serving indefinitely with an empty guild cache.
    tokio::spawn(async move {
        let mut failures: u32 = 0;
        loop {
            match discord_client.start().await {
                Ok(()) => break, // clean shutdown (shard manager told to stop)
                Err(err) => {
                    failures += 1;
                    tracing::error!(error = %err, failures, "Discord gateway client exited");
                    if failures >= 5 {
                        tracing::error!("Discord gateway failed 5 times; exiting for restart");
                        std::process::exit(1);
                    }
                    tokio::time::sleep(std::time::Duration::from_secs(2u64.pow(failures))).await;
                }
            }
        }
    });

    let state = state::AppState {
        db,
        config: config.clone(),
        discord_http,
        discord_cache,
        // Explicit timeouts: a blackholed Discord endpoint must not wedge every
        // authenticated handler (reqwest's default has no timeout at all).
        http: reqwest::Client::builder()
            .connect_timeout(std::time::Duration::from_secs(5))
            .timeout(std::time::Duration::from_secs(15))
            .build()
            .expect("failed to build HTTP client"),
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
    .with_graceful_shutdown(async move {
        let ctrl_c = tokio::signal::ctrl_c();
        #[cfg(unix)]
        {
            let mut sigterm =
                tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                    .expect("failed to install SIGTERM handler");
            tokio::select! {
                _ = ctrl_c => {},
                _ = sigterm.recv() => {},
            }
        }
        #[cfg(not(unix))]
        ctrl_c.await.ok();
        tracing::info!("shutdown signal received; draining");
        shard_manager.shutdown_all().await;
    })
    .await
    .expect("server error");
}
