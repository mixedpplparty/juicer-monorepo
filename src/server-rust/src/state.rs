use std::sync::Arc;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
    /// Serenity REST client (bot token).
    pub discord_http: Arc<serenity::http::Http>,
    /// Serenity gateway cache — populated by the gateway task (Guilds intent),
    /// same role as discord.js's guild cache in the old backend.
    pub discord_cache: Arc<serenity::cache::Cache>,
    /// Plain HTTP client for Discord OAuth calls (user token endpoints).
    pub http: reqwest::Client,
}
