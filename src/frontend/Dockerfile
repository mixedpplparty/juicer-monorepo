# Multi-stage build for frontend
FROM node:24-alpine AS base

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package*.json ./
COPY src/shared/package*.json ./src/shared/
COPY src/frontend/package*.json ./src/frontend/

# Install dependencies
RUN npm ci

# Copy shared source code and build it
COPY src/shared ./src/shared
RUN cd src/shared && npm run build

# Copy frontend source code
COPY src/frontend ./src/frontend

# Build arguments for environment variables
ARG VITE_BACKEND_URI
ARG VITE_BOT_INSTALL_URI
ARG VITE_USER_AUTH_URI
ARG VITE_API_ENDPOINT
ARG VITE_CLIENT_ID

# Set environment variables for build
ENV VITE_BACKEND_URI=$VITE_BACKEND_URI
ENV VITE_BOT_INSTALL_URI=$VITE_BOT_INSTALL_URI
ENV VITE_USER_AUTH_URI=$VITE_USER_AUTH_URI
ENV VITE_API_ENDPOINT=$VITE_API_ENDPOINT
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID

# Build the frontend
WORKDIR /app/src/frontend
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY src/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend from previous stage
COPY --from=base /app/src/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx_group
RUN adduser -S frontend -u 1001 -G nginx_group

# Change ownership of nginx directories
RUN chown -R frontend:nginx_group /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

# Switch to non-root user
USER frontend

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]