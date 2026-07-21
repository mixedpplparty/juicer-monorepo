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
    /// Whether /swagger and /docs are mounted. `ENABLE_API_DOCS` overrides
    /// ("true"/"1" or "false"/"0"); unset defaults to hidden in production.
    pub api_docs_enabled: Option<bool>,
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
            api_docs_enabled: match env("ENABLE_API_DOCS").to_ascii_lowercase().as_str() {
                "true" | "1" => Some(true),
                "false" | "0" => Some(false),
                _ => None,
            },
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

    pub fn docs_enabled(&self) -> bool {
        self.api_docs_enabled.unwrap_or(!self.is_production())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(environment: &str, api_docs_enabled: Option<bool>) -> Config {
        Config {
            allowed_origins: Vec::new(),
            discord_bot_token: String::new(),
            discord_api_endpoint: String::new(),
            discord_client_id: String::new(),
            discord_client_secret: String::new(),
            redirect_uri: None,
            redirect_after_sign_in_uri: String::new(),
            redirect_after_sign_in_failed_uri: String::new(),
            environment: environment.to_string(),
            api_docs_enabled,
            pg_host: String::new(),
            pg_port: 5432,
            pg_user: String::new(),
            pg_password: String::new(),
            pg_database: String::new(),
        }
    }

    #[test]
    fn docs_hidden_in_production_by_default() {
        assert!(config("development", None).docs_enabled());
        assert!(config("", None).docs_enabled());
        assert!(!config("production", None).docs_enabled());
    }

    #[test]
    fn enable_api_docs_overrides_environment() {
        assert!(config("production", Some(true)).docs_enabled());
        assert!(!config("development", Some(false)).docs_enabled());
    }
}
