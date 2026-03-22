# Gabe Website

Next.js 16 application for the site, admin dashboard, theme management, visitor analytics, contact messages, authentication, and shop management.

## Stack

- Next.js 16
- React 19
- Bun
- Prisma
- PostgreSQL
- NextAuth
- HeroUI

## Requirements

- Bun
- Node-compatible environment for Next.js/Bun tooling
- PostgreSQL if running locally without Docker
- Docker Desktop if running the container stack

## Environment

### Local development

Use `.env.local`.

Required values:

```env
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gabe_website
SESSION_TIMEOUT_MINUTES=480
```

### Docker

Copy `.env.docker.example` to `.env.docker` and set the values there.

Example:

```env
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
SESSION_TIMEOUT_MINUTES=480
DATABASE_URL=postgresql://postgres:postgres@db:5432/gabe_website
POSTGRES_DB=gabe_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Local development

Install dependencies:

```powershell
bun install
```

Generate Prisma client:

```powershell
bunx prisma generate
```

Push the schema to your local database:

```powershell
bunx prisma db push
```

Start the dev server:

```powershell
bun run dev
```

Open:

- `http://localhost:3000`

## Production build locally

Build:

```powershell
bun run build
```

Start:

```powershell
bun run start
```

## Docker

Files added for the container setup:

- [Dockerfile](/D:/Programming/Website/gabe-website/Dockerfile)
- [docker-compose.yml](/D:/Programming/Website/gabe-website/docker-compose.yml)
- [docker/start.sh](/D:/Programming/Website/gabe-website/docker/start.sh)
- [.env.docker.example](/D:/Programming/Website/gabe-website/.env.docker.example)
- [.dockerignore](/D:/Programming/Website/gabe-website/.dockerignore)

### Start the full stack

1. Copy `.env.docker.example` to `.env.docker`
2. Set the secrets and database values
3. Run:

```powershell
docker compose up --build
```

This starts:

- `db`: PostgreSQL 16
- `app`: the Next.js production server on port `3000`

URLs:

- App: `http://localhost:3000`
- Postgres: `localhost:5432`

### What the app container does on startup

`docker/start.sh`:

1. waits for the database
2. runs `bunx prisma db push`
3. starts `bun run start`

This means the schema is applied automatically when the app container boots.

### Stop the stack

```powershell
docker compose down
```

### Stop and remove database data

```powershell
docker compose down -v
```

That removes the `postgres_data` volume and resets the database.

## Database

Prisma schema:

- `prisma/schema.prisma`

Prisma config:

- `prisma.config.ts`

Useful commands:

```powershell
bunx prisma generate
bunx prisma db push
```

## Authentication

Admin auth uses NextAuth.

Bootstrap admin credentials are created from:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

The bootstrap admin is assigned the locked `system_administrator` role.

## Lint and typecheck

```powershell
bunx tsc --noEmit
bun run lint
```

## Notes

- Theme changes are stored in Postgres and applied globally through the root layout.
- The Docker stack is intended for running the app and database together with one command.
- If you change Prisma models, rerun `bunx prisma db push` locally or rebuild the Docker stack.
