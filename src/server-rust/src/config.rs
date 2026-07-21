/// Environment configuration, read once at startup. Variable names match the
/// old Node backend so the existing .env / docker-compose keep working.
#[derive(Debug, Clone)]
pub struct Config {
    pub allowed_origins: Vec<String>,
    pub discord_bot_token: String,
    pub discord_api_endpoint: String,
    pub discord_client_id: String,
    pub discord_client_secret: String,
    pub redirect_uri: Option<String>,
    pub redirect_after_sign_in_uri: String,
    pub redirect_after_sign_in_failed_uri: String,
    pub environment: String,
    pub pg_host: String,
    pub pg_port: u16,
    pub pg_user: String,
    pub pg_password: String,
    pub pg_database: String,
}

fn env(key: &str) -> String {
    std::env::var(key).unwrap_or_default()
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            allowed_origins: env("ALLOWED_ORIGINS")
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
            discord_bot_token: env("DISCORD_BOT_TOKEN"),
            discord_api_endpoint: env("VITE_API_ENDPOINT"),
            discord_client_id: env("VITE_CLIENT_ID"),
            discord_client_secret: env("CLIENT_SECRET"),
            redirect_uri: std::env::var("REDIRECT_URI").ok(),
            redirect_after_sign_in_uri: env("REDIRECT_AFTER_SIGN_IN_URI"),
            redirect_after_sign_in_failed_uri: env("REDIRECT_AFTER_SIGN_IN_FAILED_URI"),
            environment: env("ENVIRONMENT"),
            // The old backend used POSTGRES_DB as the host too ("fix for
            // ECONNREFUSED"); honor POSTGRES_HOST if set, else fall back the same way.
            pg_host: std::env::var("POSTGRES_HOST").unwrap_or_else(|_| env("POSTGRES_DB")),
            pg_port: env("POSTGRES_PORT").parse().unwrap_or(5432),
            pg_user: env("POSTGRES_USER"),
            pg_password: env("POSTGRES_PASSWORD"),
            pg_database: env("POSTGRES_DB"),
        }
    }

    pub fn database_url(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}",
            self.pg_user, self.pg_password, self.pg_host, self.pg_port, self.pg_database
        )
    }

    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }
}
