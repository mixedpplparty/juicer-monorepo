#!/usr/bin/env bash

set -e

echo "Running database migrations..."

# Wait for postgres to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" ; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Change to app directory and run migrations
echo "running pnpm install..."
cd /app
pnpm install

cd server
echo "Generating database schema..."
pnpm run db:generate

echo "Running database migrations..."
pnpm run db:migrate

echo "Database setup completed successfully!"