# juicer-monorepo

## if /dashboard, /api, /backend doesn't work

Make sure not to forget the trailing slash:
e.g. `https:/your-domain/dashboard/`

## to send non-secure(non-HTTPS/TLS) requests from FE side

### juicer-frontend/nginx.conf

remove `add_header X-Forwarded-Proto "https" always;`
### juicer-frontend/index.html

remove `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />`
### don't forget to edit .env

remove `ENVIRONMENT=production` for the backend to receive non-HTTPS requests

## docker-compose.yml

~~for security, in production mode, in `servies.traefik.command`, remove `api=true` and `api.dashboard=true`~~\

You can setup authentication in the `TRAEFIK_AUTH` section below if you want basic authentication in dashboard. You have the choice to remove the dashboard feature completely by removing `api=true` and `api.dashboard=true`

## .env

Refer to [.env.example](.env.example)

### TRAEFIK_AUTH

```bash
# Install htpasswd (if not available)
# On Ubuntu/Debian: sudo apt-get install apache2-utils
# On macOS: brew install httpd

# Generate password hash
htpasswd -nb admin your_secure_password

# Add the output to your .env file as TRAEFIK_AUTH
```

### ENVIRONMENT

`production` makes HTTPS required for backend

## Discord Dev Portal Settings

1. Create Application
2. Head to `OAuth2`
3. Add `http://your_domain/api/discord/auth/callback` to Redirect URI
4. Select `http://your_domain/api/discord/auth/callback` as Redirect URI

## running project

1. [Install Docker](https://www.docker.com/)
2. To run locally for development, run in the project root:

`docker compose -f docker-compose-dev.yml up --build -d`

or to run with Traefik, run in the project root:

`docker compose up --build -d`

3. to shutdown:

`docker compose down`