# Juicer Monorepo

A TypeScript monorepo with shared types between frontend and backend.

## Project Structure

```
src/
├── shared/          # Shared types and utilities
├── frontend/        # React frontend (Vite + TypeScript)
├── backend/         # Hono backend (Node.js + TypeScript)
└── db/             # Database schemas and migrations
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- Docker & Docker Compose

### Local Development

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Build shared types**
   ```bash
   npm run build:shared
   ```

3. **Start development servers**
   ```bash
   # Start all services
   npm run dev

   # Or start individually
   npm run dev --workspace=src/frontend
   npm run dev --workspace=src/backend
   ```

### Docker Development

```bash
# Start all services with Docker
docker-compose -f docker-compose-dev.yml up --build

# Start specific services
docker-compose -f docker-compose-dev.yml up db backend
```

### Production Deployment

```bash
# Production build and deploy
docker-compose up --build -d
```

## Available Scripts

### Root Level
- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages with Biome
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Biome

### Workspace-specific
- `npm run build --workspace=src/shared` - Build shared types
- `npm run dev --workspace=src/frontend` - Start frontend dev server
- `npm run dev --workspace=src/backend` - Start backend dev server

## Shared Types

The `src/shared` package contains TypeScript definitions shared between frontend and backend:

```typescript
import type { ServerData, Game, Role } from '@juicer/shared'
```

Types are automatically built when building frontend or backend projects.

## Architecture Decisions

### Separate Containers vs Single Container

We use **separate containers** for frontend and backend because:

1. **Independent Scaling** - Scale frontend and backend independently based on load
2. **Technology Flexibility** - Use different base images optimized for each service
3. **Development Experience** - Develop and deploy services independently
4. **Security** - Isolate services and apply different security policies
5. **Monitoring** - Monitor and debug services separately

### Build Process

1. **Shared types** are built first in both frontend and backend Dockerfiles
2. **TypeScript project references** ensure proper dependency tracking
3. **Biome** provides consistent linting across all packages
4. **npm workspaces** manage dependencies efficiently

## Environment Variables

Create a `.env` file with:

```env
# Database
POSTGRES_DB=juicer_db
POSTGRES_USER=juicer_user
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432

# Frontend
VITE_BACKEND_URI=http://localhost:8000
VITE_BOT_INSTALL_URI=https://discord.com/install
VITE_USER_AUTH_URI=https://discord.com/oauth2/authorize
VITE_API_ENDPOINT=http://localhost:8000
VITE_CLIENT_ID=your_discord_client_id

# Production (docker-compose.yml only)
TRAEFIK_DOMAIN=your-domain.com
ACME_EMAIL=your-email@domain.com
TRAEFIK_AUTH=your_basic_auth_hash
```

## Ports

- **Frontend**: 8080
- **Backend**: 8000  
- **Database**: 5432 (dev), exposed internally only (prod)
- **Traefik**: 80, 443 (prod only)