# juicer-server (Rust)

Rust backend — axum 0.8 + sqlx 0.8 (Postgres) + serenity 0.12 + ts-rs.
Owns both the API and SQL migrations. Environment variables are documented in
the repo root `.env.example`. Listens on `:8000`.

## Develop

```sh
cargo run --locked -- migrate  # new database; needs only POSTGRES_* variables
cargo run --locked            # migrated Postgres + Discord settings from .env
cargo clippy --locked --all-targets
```

The full test suite REQUIRES a disposable PostgreSQL 17 instance and a user
with CREATEDB permission. SQLx creates a separate database per database test;
do not point this command at production. Database tests never silently skip.

```sh
DATABASE_URL=postgres://user:pass@127.0.0.1:15439/postgres cargo test --locked
```

## Shared types (ts-rs)

`src/models.rs` is the source of truth for the API types. Regenerate the
TypeScript bindings in `../shared/src/types/generated/` after changing them:

```sh
cargo test export_bindings
```

## Schema / migrations

`migrations/` is the source of truth. SQLx executes ordered SQL files with
transactions, checksums and PostgreSQL advisory locking. SQLx is a SQL toolkit;
there is no ORM schema to regenerate. Add a new numbered migration for each
schema change; never edit an already-deployed migration. Keep SQL files LF-only
(`.gitattributes` enforces this). `build.rs` tracks newly added files so cached
builds also embed new migrations.

CLI commands (also available as `/juicer-server ...` inside the image):

- `migrate`: apply pending migrations to a new or SQLx-managed database.
- `migrate --adopt-legacy`: explicitly accept a structurally verified legacy
  database after backup/restore validation. It retains Drizzle history, existing
  rows and sequences; adds/backfills the verification flag and missing indexes.
- `check-db`: read-only release/schema readiness check; no Discord connection.
- `healthcheck`: check the running HTTP server's `/health/ready` endpoint.
- No arguments: serve the API; refuses a missing/mismatched migration history.

The first migration rejects partial schemas, incompatible column definitions,
constraints, sequence definitions, custom triggers/RLS and incorrectly defined
named indexes. The reference schema used for validation is created and dropped
inside the transaction. Adoption does not blindly mark old migrations as applied.
An error may leave an empty SQLx history table, but never a successful migration
entry for rolled-back application changes.

Migration mode uses a dedicated database connection, a 30-second lock timeout,
and a five-minute statement timeout. Failed/interrupted transactions roll back;
completed earlier migrations remain committed and a retry resumes from them.
The verification backfill preserves already-flagged categories, including renamed
ones, otherwise flags the oldest category named `verification`, matching the
previous startup behavior. It now runs once, as a recorded migration.

For existing Docker installations, use [the deployment procedures](../../deploy/README.md),
which restore-test a backup before touching the original database. The migrator
does not create backups itself. Native users must likewise back up and verify
their database before explicitly adopting it.

`CONTRACT.md` documents the module contract and the intentional behavioral
divergences from the TS backend.

## API docs (utoipa)

The OpenAPI document is generated from `#[utoipa::path]` annotations on the
route handlers and served at `GET /swagger`, with a swagger-ui page at
`GET /docs`. Both routes are hidden when `ENVIRONMENT=production`; set
`ENABLE_API_DOCS=true` (or `false`) to override in either direction.
