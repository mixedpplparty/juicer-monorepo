FROM node:24-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

RUN npm install -g pnpm

COPY package.json tsconfig.json pnpm*yaml ./

# Note: if COPY server shared ./, contents of server and shared will be copied to /app and not /app/server and /app/shared
COPY server ./server
COPY shared ./shared

RUN pnpm install 

RUN pnpm run build:shared
RUN pnpm run build:server

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/server/node_modules /app/server/node_modules
COPY --from=builder --chown=hono:nodejs /app/shared/node_modules /app/shared/node_modules
COPY --from=builder --chown=hono:nodejs /app/server/dist /app/server/dist
COPY --from=builder --chown=hono:nodejs /app/shared/dist /app/shared/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json
COPY --from=builder --chown=hono:nodejs /app/server/package.json /app/server/package.json
COPY --from=builder --chown=hono:nodejs /app/shared/package.json /app/shared/package.json

USER hono
EXPOSE 8000

CMD ["node", "/app/server/dist/index.js"]