#!/bin/sh
# Exercise the production backup comparison against synthetic data only.
set -eu
: "${DATABASE_URL:?A disposable PostgreSQL instance with CREATEDB is required}"
temporary=$(mktemp -d)
database="juicer_snapshot_$(date +%s)_$$"
created=false
cleanup() {
    if "$created"; then
        psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -c "DROP DATABASE \"$database\"" >/dev/null
    fi
    rm -rf "$temporary"
}
trap cleanup EXIT
psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$database\""
created=true
query() {
    psql "$DATABASE_URL" -X -qAt -v ON_ERROR_STOP=1 -c "\\connect $database" "$@"
}
snapshot() {
    # Keep psql outside a pipeline so its failure cannot be masked by tail.
    query -v "normalize_verification=$1" -f deploy/snapshot.sql > "$temporary/raw"
    tail -n +2 "$temporary/raw" > "$temporary/$2"
}
query -f src/server-rust/tests/fixtures/legacy.sql -c 'SET search_path=public,pg_catalog' -f src/server-rust/tests/fixtures/data.sql >/dev/null
snapshot true before
query -c BEGIN -f src/server-rust/migrations/0002_verification_categories.sql -c COMMIT >/dev/null
snapshot false after
cmp "$temporary/before" "$temporary/after"

# Migration 2 is complete. A new unflagged category named verification must
# remain unchanged; a later deployment must not expect another backfill.
query -c "CREATE TABLE _sqlx_migrations(version bigint,success boolean); INSERT INTO _sqlx_migrations VALUES (2,true); INSERT INTO servers(server_id) VALUES ('later'); INSERT INTO roles_categories(server_id,name) VALUES ('later','verification')" >/dev/null
snapshot true before
snapshot false after
cmp "$temporary/before" "$temporary/after"
echo 'Backup fingerprints: legacy backfill and subsequent releases passed'
