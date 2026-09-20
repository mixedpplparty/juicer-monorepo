#!/bin/sh
set -eu
: "${DATABASE_URL:?Set DATABASE_URL to a disposable PostgreSQL 17 instance with CREATEDB permission}"
attempt=0
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    [ "$attempt" -lt 60 ] || { echo 'Test database unavailable' >&2; exit 1; }
    sleep 1
done
cd src/server-rust
cargo test --locked
cargo clippy --locked --all-targets
cd ../..
git diff --exit-code -- src/shared/src/types/generated
sh scripts/test-snapshot.sh
