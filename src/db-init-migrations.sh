#!/usr/bin/env bash

set -e

echo "Running database migrations..."

# Wait for postgres to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" ; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

cd /app/server

echo "Generating database schema..."
pnpm run db:generate

echo "Running database migrations..."

# Background function to wait for PostgreSQL and run migrations
migrate_when_ready() {
    until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT" ; do
        echo "Waiting for PostgreSQL to finalize in background..."
        sleep 2
    done
    echo "PostgreSQL is ready, running migrations..."
    pnpm run db:migrate
}

# Run migration in background
migrate_when_ready &

echo "Database setup completed successfully!"