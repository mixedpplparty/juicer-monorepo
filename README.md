# juicer

A Discord-integrated web application built as a pnpm monorepo. juicer pairs a
React single-page app with a Hono API server, a PostgreSQL database, and a
Traefik reverse proxy that terminates TLS — all orchestrated with Docker
Compose.

## Overview

**juicer** is a web service that works in close integration with the Discord
messaging platform.

On Discord, a *role* that a server can grant to its members carries only
simple, one-dimensional information such as a name and a color. **Discord
provides no way to describe a role or to organize roles into categories.**
juicer was built to solve this. It **introduces the concept of a "topic"**,
which lets you map roles, categories, and channels within a Discord server to
a topic. The resulting mappings are easy for users to browse, and users can
grant or remove roles for themselves through the Discord API.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Traefik Dashboard Authentication](#traefik-dashboard-authentication)
  - [Discord Developer Portal](#discord-developer-portal)
- [Running Without HTTPS](#running-without-https)
- [Troubleshooting](#troubleshooting)

## Architecture

The project is a pnpm workspace under [`src/`](src/) with three packages:

| Package  | Path           | Stack                                                      |
| -------- | -------------- | --------------------------------------------------------- |
| `client` | `src/client`   | React 19, Vite, MUI, TanStack Query, Jotai, served by nginx |
| `server` | `src/server`   | Hono on Bun, Drizzle ORM, Zod                             |
| `shared` | `src/shared`   | Shared Zod schemas and types consumed by client + server  |

At runtime, Docker Compose brings up four services:

| Service    | Container          | Role                                            |
| ---------- | ------------------ | ----------------------------------------------- |
| `traefik`  | `juicer_traefik`   | Reverse proxy, TLS termination, routing         |
| `frontend` | `juicer_frontend`  | Serves the built SPA                            |
| `backend`  | `juicer_backend`   | REST API, reachable under `/backend`            |
| `db`       | `juicer_db`        | PostgreSQL database                             |

Traefik routes requests by path prefix: `/backend` → backend, `/dashboard`
and `/api` → the Traefik dashboard, and everything else → frontend.

## Prerequisites

- [Docker](https://www.docker.com/) (with Docker Compose)
- A Discord application — see [Discord Developer Portal](#discord-developer-portal)

## Getting Started

1. Copy [`.env.example`](.env.example) to `.env` and fill in the values — see
   [Configuration](#configuration).

2. Start the stack from the project root:

   **Local development**

   ```bash
   docker compose -f docker-compose-dev.yml up --build -d
   ```

   **Production (with Traefik + TLS)**

   ```bash
   docker compose up --build -d
   ```

3. Shut down:

   ```bash
   docker compose down
   ```

## Configuration

### Environment Variables

All configuration lives in `.env`. Refer to [`.env.example`](.env.example)
for the full list. A few keys deserve extra attention:

#### `ENVIRONMENT`

Setting `ENVIRONMENT=production` forces the backend to require HTTPS. Remove or
change it to accept plain HTTP requests — see
[Running Without HTTPS](#running-without-https).

#### Traefik Dashboard

The Traefik dashboard is enabled by default. To disable it entirely, remove
`api=true` and `api.dashboard=true` from `services.traefik.command` in
[`docker-compose.yml`](docker-compose.yml). To keep it but protect it with
HTTP basic auth, configure `TRAEFIK_AUTH` below.

### Traefik Dashboard Authentication

Generate a credential hash with `htpasswd` and add it to `.env` as
`TRAEFIK_AUTH`:

```bash
# Install htpasswd if needed:
#   Ubuntu/Debian: sudo apt-get install apache2-utils
#   macOS:         brew install httpd

# Generate the hash
htpasswd -nb admin your_secure_password
```

> **Note:** In `.env`, every `$` in the generated hash must be doubled (`$$`).

### Discord Developer Portal

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Open the **OAuth2** section.
3. Add `http://your_domain/api/discord/auth/callback` as a Redirect URI.
4. Select that same URI as the active Redirect URI.

## Running Without HTTPS

To send non-secure (plain HTTP) requests from the frontend, make the following
three changes:

1. **`src/client/nginx.conf`** — remove:

   ```nginx
   add_header X-Forwarded-Proto "https" always;
   ```

2. **`src/client/index.html`** — remove:

   ```html
   <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
   ```

3. **`.env`** — remove `ENVIRONMENT=production` so the backend accepts
   non-HTTPS requests.

## Troubleshooting

**`/dashboard`, `/api`, or `/backend` return an error.** Make sure the URL
ends with a trailing slash — for example `https://your-domain/dashboard/`.
