# syntax=docker/dockerfile:1
# Custom PostgreSQL image with Node.js for database migrations
FROM postgres:17-alpine

# vulnurability mitigations
RUN apk update && apk upgrade --no-cache

# Install Node.js and pnpm (pinned to match package.json "packageManager")
RUN apk add --no-cache acl nodejs npm
RUN npm install -g pnpm@10.12.1

# pnpm content-addressable store location (paired with the BuildKit cache mount)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

# Set working directory for our setup scripts
WORKDIR /app

# Install dependencies first so this layer stays cached unless the manifests or
# lockfiles change. The pnpm store lives in a BuildKit cache mount
# (PNPM_HOME=/pnpm -> store at /pnpm/store), so packages are not re-downloaded
# on every build.
COPY package.json tsconfig.json pnpm*yaml ./
COPY server/package.json server/pnpm-lock.yaml ./server/
COPY shared/package.json ./shared/
RUN pnpm install --ignore-scripts
RUN pnpm install --prefix /app/server --ignore-scripts

# Copy source code and build (after install so source edits don't bust the
# dependency layer).
COPY server ./server
COPY shared ./shared
RUN pnpm run build:shared
RUN pnpm run build:server

# give permissions to user postgres to read and write in the server directory
RUN chmod -R o+rwx /app/server

# Copy our custom initialization script that runs migrations
COPY db-init-migrations.sh /docker-entrypoint-initdb.d/02-run-migrations.sh

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/02-run-migrations.sh

# Switch back to postgres working directory
WORKDIR /var/lib/postgresql/data

# Use the default postgres entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
