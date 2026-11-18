# StroyBazaar

Construction materials marketplace for Khujand.

- [Local development](docs/development.md): setup, running, database, testing, troubleshooting
- [API integration](docs/api-integration.md): connecting the mobile app
- [Business model](docs/business-model.md)

## Structure

| Path | What | Port |
|---|---|---|
| `apps/api` | Public API for the mobile app and supplier dashboard | 4000 |
| `apps/admin-api` | Platform management API (admin role) | 4001 |
| `apps/web-app` | Next.js customer website | 3000 |
| `apps/admin-app` | Next.js admin dashboard | 3001 |
| `apps/mobile-app` | Expo / React Native app (Expo Go, Android, iOS, web) | 8081 (Metro) |
| `packages/db` | Prisma schema, migrations, seed (PostgreSQL) | |
| `packages/server` | Shared Express pieces: auth, errors, OpenAPI route helper | |
| `packages/shared` | Code shared with the web apps (locales) | |
| `packages/tsconfig` | Shared TypeScript configs | |

## API docs

Both APIs generate their OpenAPI document from their route definitions:

- api: http://localhost:4000/docs (Swagger UI), http://localhost:4000/openapi.json
- admin-api: http://localhost:4001/docs, http://localhost:4001/openapi.json

Routes are declared with `api.route({ ... })` from `@stroybazaar/server`, which validates requests
and responses with the same Zod schemas it documents.

## Getting started

```sh
pnpm install
cp .env.example .env
podman compose up -d        # local Postgres on port 5433
pnpm db:migrate             # apply migrations
pnpm db:seed                # categories, demo suppliers and products, admin user
pnpm dev                    # run all apps
```

Run one app: `pnpm dev --filter=@stroybazaar/api`.

## Tests

```sh
pnpm test                   # api + admin-api integration tests
```

`pnpm dev`, `pnpm build` and `pnpm typecheck` are Turbo tasks and include every app,
including the Expo mobile app. Use `pnpm dev --filter=@stroybazaar/mobile-app` to run
Metro on its own.

Tests use a separate `test` schema in the same database (override with `TEST_DATABASE_URL`).
