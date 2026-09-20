# Database setup, upgrades and deployment

The backend image includes SQLx migrations. PostgreSQL remains version 17 and
uses `/var/lib/postgresql/data`. Removing the TypeScript server does not remove
or replace existing database data. PostgreSQL volumes are never deleted by the
upgrade/deployment scripts. Schema changes are additive in this release.

## New local installation

Copy `.env.example` to `.env`, configure Discord, then run from the repo root:

```sh
docker compose -f docker-compose-dev.yml up --build -d
```

An empty database is initialized by PostgreSQL; the separate migration service
creates the schema. The backend waits for successful migration completion.
The Compose environment sets the container database hostname to `db`, even when
the host `.env` uses `localhost` for native development. To expose PostgreSQL for
native Rust development, use `docker-compose-dev-server-debug.yml`.

## Existing local installation (Windows, macOS or Linux)

Use Node 22+ and Docker. Keep the original `.env`, Compose configuration and
project identity. Do not change database credentials or upgrade PostgreSQL's
major version in the same operation.

```sh
node scripts/upgrade-local.mjs docker-compose-dev-server-debug.yml
```

Choose the Compose file originally used for your installation. This command:

1. Inspects `juicer_db` and checks the resolved Compose volume and database
   identity against the existing container. Missing/mismatched state is an error.
2. Builds the new backend and stops the application's writers.
3. Saves a binary logical backup under `.migration-validation/` (gitignored).
4. Restores it into a disposable PostgreSQL 17 container, migrates the copy,
   compares every application table's row fingerprints and sequence values,
   preserves Drizzle history, and compares against a fresh schema.
5. Recreates PostgreSQL on the **same volume**, explicitly adopts/migrates the
   real database, and starts the application after successful migration.

On failure, the backup and original volume remain; the application may remain
stopped. Diagnose the error and retry, or restart the previous application image.
Do not resolve an error by deleting the volume. Preserve the backup until the
application has been checked. Backups contain private application data and must
not be committed or uploaded to CI artifacts.

## Woodpecker / existing production installation

The pipeline tests Rust (including isolated PostgreSQL migration/upgrade tests),
frontend builds and deployment failure handling on pull requests. Publishing and
SSH deployment run only for `main` pushes/manual runs. There is no custom DB image.

The deployment host needs Docker Compose with `--wait`, Bash, `flock`, standard
coreutils, registry access, free space for a backup and restored copy, and the
existing external `infra` network. The existing SSH key must also permit SCP.
The host `.env` remains at `~/projects/apps/juicer/.env`.

The existing `plugins/docker` build plugin is retained. Woodpecker 3.18's default
privileged-plugin list no longer includes it: a server on that version must
already allow it through `WOODPECKER_PLUGINS_PRIVILEGED=plugins/docker` (preserve
other entries in the host's list). This is a prerequisite for the existing build
steps, not a database permission. Confirm the CI server's version/settings before
first rollout; no server settings are changed by this branch.

SCP delivers `deploy/` into `releases/<commit>/`. SSH invokes that release's
`deploy.sh`. Application images use the same commit tag, not `latest`. A host
lock serializes deployments; pipeline numbers prevent a delayed older build from
replacing a newer successful release. The script:

1. Finds `juicer-db`, verifies PostgreSQL major version and discovers its actual
   Compose project and named volume. It checks database identity against `.env`.
2. Pulls the release images before stopping the old backend/frontend.
3. Saves previous application image identities/configuration and backs up
   PostgreSQL into a unique private `backups/<timestamp>-<commit>-<suffix>/` directory.
4. Restores the backup on an isolated network; runs this release's migration
   executable on the restored database; compares data/sequence/history
   fingerprints, allowing only the documented verification backfill.
5. Uses an **external volume with the discovered exact name** for PostgreSQL,
   applies migrations to the real database, then checks database readiness.
6. Starts the backend and frontend with health checks. Only then writes
   `current-release`. Any failed command makes the deployment fail.

This intentionally uses a maintenance window: writers remain stopped between
backup and readiness. Database migrations use transactions and advisory locking;
there is no automatic destructive rollback. Independent external database writers
must also be paused during this window. The restore rehearsal checks the actual
production schema, not an assumed match with a development database.

## First production installation

Provision `.env`, the external `infra` network and release images/configuration.
On a genuinely new host, invoke the delivered script once with:

```sh
bash releases/<commit>/deploy/deploy.sh "$PWD" <commit> --initialize
```

The initialization flag refuses an existing database container or the intended
database volume. Normal CI deployment never passes it. If `juicer-db` disappears
on an existing installation, recover the existing container/volume rather than
initializing another database. Production Compose requires the exact external
volume name and cannot silently invent a replacement.

## Failure recovery / rollback

First retain the failed release's logs, backup and database volume. Failed
migration transactions roll back; any earlier completed migrations stay recorded.
Retry the same release after fixing the cause. Do not edit applied SQL/checksums.

This release's columns/indexes are compatible with the previous Rust backend, so
an application-only rollback can use the previous backend/frontend images while
keeping the upgraded database. On a first migration rollout, preserve the host's
previous Compose file and image tags/IDs before deploying. Later releases also
retain their configuration under `releases/`. Do not rerun a previous deployment
script if its migrations cannot understand the current database; restore the
application images deliberately. Test their readiness before resuming traffic.

Restore a backup only as a separate recovery operation after assessing writes
since that backup; automatic restore could itself lose newer data. Keep the
original volume until recovery is verified. `down --volumes`, volume pruning,
and database drops are not part of normal deployment or rollback.

## Reproducible validation

```sh
# Against a disposable PostgreSQL 17 instance with CREATEDB, never production:
DATABASE_URL=postgres://postgres:test@localhost:15439/postgres sh scripts/test-backend.sh

docker build -f src/server.Dockerfile -t juicer-migration-backend:test src
node scripts/validate-fresh-compose.mjs

# Read-only backup of source; all migration writes happen on restored copies:
node scripts/validate-docker.mjs juicer_db

# Linux/Bash deployment order/failure tests; fake Docker, no daemon access:
node --test scripts/deploy.test.mjs
node scripts/check-compose.mjs
```

The checked-in legacy schema fixture is a schema-only PostgreSQL dump; all its
test records are synthetic. Tests cover failed/interrupted migrations, repeat
runs, concurrency, explicit adoption, incompatible schemas and preservation.
Real Discord OAuth/bot behavior still requires a separate test guild; database
and deployment tests do not contact Discord or change users' roles.
