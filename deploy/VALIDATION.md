# Legacy server removal: validation record

Validated on 2026-09-20, on `feat/remove-legacy-server`, based on fetched
`origin/main` commit `e666f8a48985dd7338971e341b128c75b2c2d89f`.

## Scope and database preservation

The retired server contained Drizzle schema definitions, but no committed SQL
migration history. Those definitions are now represented by numbered SQL files
embedded in the Rust backend through the existing SQLx dependency. No ORM was
introduced. The old custom database image and its first-start-only initialization
script have been removed.

The original local `juicer_db` container was read only for inspection and a
logical backup. No migration, container recreation, restart or volume deletion
was performed against it. All upgrade writes happened on disposable restored
copies. Its observed PostgreSQL version was 17.10; it had Drizzle history and no
SQLx history. Its exact source revision could not be established from the old
image, so it is evidence for this observed installation, not every deployment.

The migration retains application rows, primary keys, relations, sequence state
and Drizzle history. The only intentional record change is the existing Rust
verification-category backfill, now run once as a recorded migration. Missing
query indexes are added. Unexpected legacy schema differences stop adoption.

## Completed checks

| Check | Result |
| --- | --- |
| Rust suite against disposable PostgreSQL 17 | 76 passed on Windows and CI's Rust 1.88 Linux toolchain, none skipped |
| Clippy across all targets | Passed |
| Backend production Docker build, Rust 1.88 / musl | Passed |
| Frontend production Docker build with frozen pnpm lockfile | Passed |
| All four Compose configurations | Validated volume mappings, migration ordering and release selection |
| Woodpecker 3.18 workflow lint | Passed with the existing `plugins/docker` privileged-plugin allowance; server prerequisite documented |
| Three local Compose entry points on fresh volumes | Schema created; repeat migration safe; marker retained after database container recreation |
| Backup and restore of existing local database | Passed; application row fingerprints, sequence values and Drizzle history preserved |
| Restored upgrade versus fresh setup | Equivalent application columns/defaults, constraints, indexes and sequence definitions |
| Deployment control-flow tests using fake Docker | 14 passed, including new installation, failures, stale pipelines and concurrent deployment serialization |
| Migration-only Docker cache regression | Added a fourth migration in a disposable context; cached dependency build produced a binary that applied all four migrations |
| Unavailable database | Migration exited unsuccessfully after 30 seconds; no application startup |
| Production backup fingerprint SQL | Synthetic legacy backfill and later-deployment comparisons passed; included in CI |
| Previous main backend database flow on upgraded test DB | Passed; corrected the same pre-existing stale test assertion in the disposable old-source copy |

Migration tests include both historical verification-column states, missing and
already-present indexes, synthetic multi-server data, binary thumbnails, arrays,
Unicode, nullable values, renamed verification categories, partial/incompatible
schemas, checksum/history mismatches, concurrent migrators, transactional failure,
connection termination and retry. Readiness returns an error for mismatched
migration history. The existing CRUD flow now requires a real test database;
it no longer silently skips when no database is configured.

The stale CRUD assertion expected a category-filtered match after the test had
explicitly cleared that game's category. The test now checks the positive match
before clearing and an empty result afterward; application behavior is unchanged.

Local backup/evidence is under
`.migration-validation/juicer-migration-verify-1789873786534/`. It is deliberately
gitignored and contains private data. Do not publish it as a CI artifact.
Reproduction commands are in [the deployment guide](README.md).

## Deployment gates and remaining verification

Woodpecker tests run before publishing. Production deployment uses a single
commit tag for the backend and migrator. It discovers the existing volume,
rejects changed database identity, stops application writers, backs up and
restore-tests the actual database with that release, and compares fingerprints
before migrating the original. The volume remains external and explicitly named.
Migration/readiness failures stop rollout and retain backups. Normal CI refuses
to initialize a missing database installation.

The real Woodpecker instance, SCP/SSH delivery, production registry/host and live
Discord OAuth/bot interactions have not been exercised here. First rollout needs
a maintenance window, sufficient backup/restore space and the host prerequisites
in the deployment guide. External database writers must also be paused. The
production restore rehearsal is mandatory because production may differ from
the local database. A failed deployment can leave the application stopped while
the original volume and backup remain available for recovery.

These checks demonstrate preservation for the tested schemas and data; they
cannot guarantee against host/storage failure or every possible deployment
state. Recovery deliberately avoids automatic database restore or reverse
migrations, which could discard writes made after a backup.

## Primary references used

- [SQLx 0.8.6 Migrator](https://docs.rs/sqlx/0.8.6/sqlx/migrate/struct.Migrator.html): migration validation and default advisory locking.
- [SQLx embedded migrations](https://docs.rs/sqlx/0.8.6/sqlx/macro.migrate.html): build-script tracking for newly added migration files.
- [PostgreSQL 17 backup and restore](https://www.postgresql.org/docs/17/backup-dump.html): logical backup/restore procedures.
- [Docker Compose startup ordering](https://docs.docker.com/compose/how-tos/startup-order/): database health and successful one-off dependency completion.
- [Woodpecker workflow syntax](https://woodpecker-ci.org/docs/usage/workflow-syntax): step dependencies, services and conditions.
- [Woodpecker linter](https://woodpecker-ci.org/docs/usage/linter): local workflow validation.
- [SSH plugin](https://github.com/appleboy/drone-ssh) and [SCP plugin](https://github.com/appleboy/drone-scp): release delivery and remote script settings.
