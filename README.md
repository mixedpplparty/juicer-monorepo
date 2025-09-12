# juicer-monorepo
## .env
```yaml
POSTGRES_DB=juicer_db
POSTGRES_USER=juicer_postgres_user
POSTGRES_PASSWORD=(whatever)
POSTGRES_PORT=8008
REDIRECT_URI=http://localhost:8000/discord/auth/callback
REDIRECT_AFTER_SIGN_IN_URI=http://localhost:8080/
REDIRECT_AFTER_SIGN_IN_FAILED_URI=http://localhost:8080/sign-in-failed
DISCORD_BOT_TOKEN=(discord bot token)
VITE_CLIENT_ID=(discord client id)
VITE_CLIENT_SECRET=(discord client secret)
VITE_API_ENDPOINT=https://discord.com/api/v10
VITE_USER_AUTH_URI=https://discord.com/oauth2/authorize?client_id=(discord_client_id))&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fdiscord%2Fauth%2Fcallback&scope=identify
VITE_BOT_INSTALL_URI=https://discord.com/oauth2/authorize?client_id=(discord_client_id)&permissions=268438576&integration_type=0&scope=bot
VITE_BACKEND_URI=http://localhost:8000
```