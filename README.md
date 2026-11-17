# StroyBazaar

Construction materials marketplace for Khujand. See [docs/business-model.md](docs/business-model.md).

## Structure

| Path | What | Port |
|---|---|---|
| `apps/api` | Express API for the mobile app (catalog, RFQs) | 4000 |
| `apps/admin-api` | Express API for platform management (suppliers) | 4001 |
| `apps/web-app` | Next.js customer website | 3000 |
| `apps/admin-app` | Next.js admin dashboard | 3001 |
| `packages/db` | Prisma schema and client (PostgreSQL) | |
| `packages/shared` | Zod schemas, locales, shared types | |
| `packages/tsconfig` | Shared TypeScript configs | |

## Getting started

```sh
pnpm install
cp .env.example .env
podman compose up -d        # local Postgres
pnpm db:migrate             # create tables
pnpm dev                    # run all apps
```

Run one app: `pnpm dev --filter=@stroybazaar/api`.
