# juicer-server (Rust)

Rust backend — axum 0.8 + sqlx 0.8 (Postgres) + serenity 0.12 + ts-rs.
Replaces the Hono/TS backend in `../server`; same routes, same JSON shapes,
same env vars (see the repo root `.env.example`). Listens on `:8000`.

## Develop

```sh
cargo run                # needs Postgres + the env vars from .env
cargo clippy             # lint
cargo test               # unit tests (DB suite skipped without env below)
```

DB integration suite (runs against a real Postgres, e.g. a scratch container):

```sh
SMOKE_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/db cargo test full_db_flow
```

## Shared types (ts-rs)

`src/models.rs` is the source of truth for the API types. Regenerate the
TypeScript bindings in `../shared/src/types/generated/` after changing them:

```sh
cargo test export_bindings
```

## Schema / migrations

The database schema is still owned by drizzle-kit in `../server` — the db
Docker image runs those migrations on first boot. `../server` is kept for that
purpose only; don't delete it until migrations move (e.g. to `sqlx migrate`).

`CONTRACT.md` documents the module contract and the intentional behavioral
divergences from the TS backend.
