# Use Node.js 20 Alpine for smaller image size
FROM node:24-alpine AS base

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package*.json ./
COPY src/shared/package*.json ./src/shared/
COPY src/backend/package*.json ./src/backend/

# Install dependencies
RUN npm ci --only=production

# Copy shared source code and build it
COPY src/shared ./src/shared
RUN cd src/shared && npm run build

# Copy backend source code
COPY src/backend ./src/backend

# Build the backend
WORKDIR /app/src/backend
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy only production files
COPY --from=base /app/src/backend/dist ./dist
COPY --from=base /app/src/backend/package*.json ./
COPY --from=base /app/src/shared/dist ./node_modules/@juicer/shared/dist
COPY --from=base /app/src/shared/package.json ./node_modules/@juicer/shared/

# Install only production dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

USER backend

EXPOSE 8000

CMD ["npm", "start"]
