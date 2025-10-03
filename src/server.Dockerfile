FROM node:lts-alpine AS base

FROM base AS builder

# vulnerability mitigations
RUN apk update
RUN apk upgrade --no-cache

RUN apk add --no-cache gcompat
RUN apk add --no-cache unzip
WORKDIR /app

RUN npm install -g pnpm

COPY package.json tsconfig.json pnpm*yaml ./

# Note: if COPY server shared ./, contents of server and shared will be copied to /app and not /app/server and /app/shared
COPY server ./server
COPY shared ./shared

RUN pnpm install 

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