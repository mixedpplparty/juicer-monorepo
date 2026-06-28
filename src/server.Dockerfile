# syntax=docker/dockerfile:1
FROM node:lts-alpine AS base

# Enable pnpm via corepack (uses the version pinned in package.json "packageManager")
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

FROM base AS builder

# vulnerability mitigations
RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache gcompat unzip

WORKDIR /app

# Install dependencies first so this layer stays cached unless the manifests or
# lockfile change. The pnpm content-addressable store lives in a BuildKit cache
# mount (PNPM_HOME=/pnpm -> store at /pnpm/store), so packages are not
# re-downloaded on every build.
COPY package.json tsconfig.json pnpm*yaml ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts

# Copy the rest of the source code (after install so source edits don't bust the
# dependency layer).
# Note: if COPY server shared ./, contents of server and shared will be copied to /app and not /app/server and /app/shared
COPY server ./server
COPY shared ./shared

RUN pnpm run build:shared
#RUN pnpm run build:server

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

RUN npm install -g bun

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/server /app/server
COPY --from=builder --chown=hono:nodejs /app/shared /app/shared
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 8000

CMD ["bun", "run", "/app/server/src/index.ts"]
