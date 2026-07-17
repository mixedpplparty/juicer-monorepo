# syntax=docker/dockerfile:1
# ---- Stage 1: Build the application ----
FROM node:24-alpine AS build

# vulnurability mitigations
RUN apk update && apk upgrade --no-cache

# Set working directory
WORKDIR /app

# Enable pnpm via corepack (uses the version pinned in package.json "packageManager")
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install dependencies first so this layer stays cached unless the manifests or
# lockfile change. The pnpm content-addressable store lives in a BuildKit cache
# mount (PNPM_HOME=/pnpm -> store at /pnpm/store), so packages are not
# re-downloaded on every build.
COPY package.json tsconfig.json pnpm*yaml ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts

# Copy the rest of the source code (after install so source edits don't bust the
# dependency layer).
# Note: if COPY server shared ./, contents of server and shared will be copied to /app and not /app/server and /app/shared
COPY client ./client
COPY shared ./shared

# Accept build arguments for environment variables
ARG VITE_BACKEND_URI
ARG VITE_BOT_INSTALL_URI
ARG VITE_USER_AUTH_URI
ARG VITE_API_ENDPOINT
ARG VITE_CLIENT_ID

# Set environment variables for build (Vite needs these as ENV, not ARG)
ENV VITE_BACKEND_URI=$VITE_BACKEND_URI
ENV VITE_BOT_INSTALL_URI=$VITE_BOT_INSTALL_URI
ENV VITE_USER_AUTH_URI=$VITE_USER_AUTH_URI
ENV VITE_API_ENDPOINT=$VITE_API_ENDPOINT
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID

# Build the project for production
RUN pnpm run build:shared
RUN pnpm run build:client

# ---- Stage 2: Serve the application with Nginx ----
FROM nginx:alpine

# vulnurability mitigations
RUN apk update && apk upgrade --no-cache

# Copy the React Router SPA build from the 'build' stage
COPY --from=build /app/client/build/client /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY --from=build /app/client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Nginx will be started automatically by the base image
