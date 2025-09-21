# ---- Stage 1: Build the application ----
FROM node:24-alpine AS build

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json tsconfig.json pnpm*yaml ./

# Copy the rest of the source code
COPY client ./client
COPY shared ./shared

RUN pnpm install 


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

# Copy the built static files from the 'build' stage
COPY --from=build /app/client/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY --from=build /app/client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Nginx will be started automatically by the base image