# Custom PostgreSQL image with Node.js for database migrations
FROM postgres:17-alpine

# Install Node.js and pnpm
RUN apk add --no-cache nodejs npm
RUN npm install -g pnpm

# Set working directory for our setup scripts
WORKDIR /app

# Copy package files and source code for database setup
COPY package.json tsconfig.json pnpm*yaml ./
COPY server ./server
COPY shared ./shared

# Install dependencies
RUN pnpm install

# Copy our custom initialization script that runs migrations
COPY ../db-init-migrations.sh /docker-entrypoint-initdb.d/02-run-migrations.sh

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/02-run-migrations.sh

# Switch back to postgres working directory
WORKDIR /var/lib/postgresql/data

# Use the default postgres entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
