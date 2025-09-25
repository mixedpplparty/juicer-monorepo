#!/usr/bin/env bash

set -e

db_migration_main() {
  echo "Running database migrations..."

  # Wait for postgres to be ready
  until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" ; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
  done

  cd /app/server/dist

  echo "Generating database schema..."
  npx drizzle-kit generate --config=drizzle.config.js

  echo "Running database migrations..."
  npx drizzle-kit migrate --config=drizzle.config.js

  echo "Database setup completed successfully!"
}
export -f db_migration_main

# run in background and keep the script running after exit
nohup bash -c db_migration_main &