# Local development

How to run StroyBazaar on your machine and work on it day to day.

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.9 or newer (developed on 24) | `node -v` |
| pnpm | 10.x | `corepack enable` picks up the version pinned in `package.json` |
| Podman | 5 or newer, with `podman compose` | Runs Postgres. Docker also works: use `docker compose` instead |

On Windows and macOS, Podman runs inside a VM. Start it once with `podman machine start`.

## 2. First-time setup

```sh
pnpm install
cp .env.example .env          # then edit .env, see section 3
podman compose up -d          # Postgres 17 on localhost:5433
pnpm db:migrate               # apply migrations
pnpm db:seed                  # categories, demo suppliers and products, admin user
pnpm dev                      # start all four apps
```

Check that everything is up:

| App | URL |
|---|---|
| api | http://localhost:4000/health, docs at http://localhost:4000/docs |
| admin-api | http://localhost:4001/health, docs at http://localhost:4001/docs |
| web-app | http://localhost:3000 |
| admin-app | http://localhost:3001 |

## 3. Environment variables

All apps read the root `.env`.

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | db, both APIs | none | Postgres connection. Port **5433** (see Troubleshooting) |
| `JWT_SECRET` | both APIs | insecure dev value | Signs login tokens. Must be the same for both APIs. **Required in production** |
| `COMMISSION_RATE` | api | `0.02` | Commission recorded when a buyer confirms receipt |
| `DEMO_ENDPOINTS` | api | `true` outside production | Enables `POST /rfqs/{rfqId}/quotes/simulate` |
| `OTP_RATE_LIMIT` | api | `10` | OTP requests per IP per 15 minutes |
| `PUBLIC_URL` | both APIs | `http://localhost:<port>` | Server URL shown in the OpenAPI document |
| `ADMIN_APP_ORIGIN` | admin-api | `http://localhost:3001` | Allowed CORS origin |
| `ADMIN_PHONE` | seed | none | `pnpm db:seed` makes this phone number an admin |
| `TEST_DATABASE_URL` | tests | `DATABASE_URL` with `schema=test` | Database used by `pnpm test` |

Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Running apps

```sh
pnpm dev                                    # everything
pnpm dev --filter=@stroybazaar/api          # one app
pnpm dev --filter=@stroybazaar/api --filter=@stroybazaar/admin-api   # both APIs
```

The APIs restart on save (`tsx watch`) and the Next.js apps hot-reload. Stop with `Ctrl+C`.
Postgres keeps running until you stop it with `podman compose down`. Your data is kept in the
`pgdata` volume. `podman compose down -v` deletes it.

## 5. Logging in during development

There is no SMS provider yet. The api prints login codes to its console instead:

```
[sms] to +992900000000: StroyBazaar code: 896514
```

1. Open http://localhost:4000/docs.
2. Call `POST /auth/otp/request` with a phone number in E.164 format, e.g. `+992925550101`.
3. Copy the code from the api console and call `POST /auth/otp/verify`.
4. Click **Authorize** and paste the `token` from the response.

The first login with a new number creates a **buyer**. For other roles:

- **Admin:** log in with the `ADMIN_PHONE` number from your `.env` (created by the seed).
  The same token works on admin-api (http://localhost:4001/docs).
- **Supplier staff:** log in once as a buyer, then as an admin call
  `PATCH /v1/users/{userId}` on admin-api with `{ "role": "supplier", "supplierId": "..." }`.
  Only suppliers with status `verified` can submit quotes.

Each phone number gets at most 3 codes per 10 minutes. If you hit that limit, wait or use
another number.

## 6. Database workflow

The schema is in `packages/db/prisma/schema.prisma`.

| Command | What it does |
|---|---|
| `pnpm db:migrate` | After editing the schema: creates a migration and applies it (asks for a name) |
| `pnpm db:generate` | Regenerates the Prisma client (also runs before `dev`, `build`, `test`) |
| `pnpm db:seed` | Adds categories and demo data. Safe to re-run: demo suppliers are only created into an empty database |
| `pnpm db:reset` | **Deletes all data**, re-applies migrations and re-seeds |
| `pnpm db:studio` | Opens Prisma Studio to browse and edit data |

Commit the generated folder in `packages/db/prisma/migrations/` together with the schema change.

To open a SQL shell:

```sh
podman exec -it stroybazaar-postgres psql -U postgres -d stroybazaar
```

## 7. Working on the APIs

Both APIs use the `ApiRouter` from `packages/server`. A route is declared once, and that one
declaration does four things:

- validates the request with Zod
- checks the caller's role
- trims the response to the documented shape
- adds the route to the OpenAPI document at `/openapi.json`

```ts
api.route({
  method: "get",
  path: "/suppliers/{supplierId}",
  tags: ["Suppliers"],
  summary: "Get a supplier profile",
  access: "public",                 // or "authenticated", or ["buyer"], ["supplier", "admin"], ...
  params: S.SupplierParams,         // also: query, headers, body
  response: { status: 200, description: "OK.", schema: S.Supplier },
  errors: [404],                    // 401/403/422/500 are added automatically
  handler: async ({ params, user }) => serializeSupplier(await findSupplier(params.supplierId)),
});
```

Where things live in `apps/api/src`:

| File | Contents |
|---|---|
| `schemas.ts` | Request and response schemas. `.openapi("Name")` makes a named component |
| `serializers.ts` | Converts database rows into response shapes |
| `routes/*.ts` | Route handlers, grouped by area |
| `pricing.ts` | Wholesale tier pricing |
| `sms.ts` | SMS sender. Replace `consoleSmsSender` with a real provider |

Throw errors with the helpers in `@stroybazaar/server` (`notFound`, `forbidden`, `conflict`,
`unprocessable`, or `new ApiError(...)`). They produce the standard
`{ code, message, details }` body. Import `z` from `@stroybazaar/server`, not from `zod`, so
`.openapi()` is available.

After changing a route, check the result at `/docs` and run `pnpm validate:api`. To give the
mobile team a snapshot for code generation:

```sh
pnpm --filter @stroybazaar/api openapi:export openapi.yaml
```

The mobile app integration is described in [api-integration.md](./api-integration.md).

## 8. Tests and checks

```sh
pnpm test            # integration tests for api and admin-api
pnpm validate:api    # OpenAPI document tests only
pnpm typecheck       # TypeScript across the monorepo
pnpm build           # production builds
```

The tests run against your local Postgres in a separate `test` schema, so they never touch your
dev data. They apply migrations themselves and empty the tables before each test, so Postgres
must be running. Test files are in `apps/*/test/`. `apps/api/test/helpers.ts` has fixtures and a
`login()` helper that runs the real OTP flow.

Run a single file or test:

```sh
pnpm --filter @stroybazaar/api exec vitest run test/rfq-orders.test.ts
pnpm --filter @stroybazaar/api exec vitest run -t "accrues commission"
```

## 9. Troubleshooting

**`netavark ... nftables error` when starting Postgres.** Podman's bridge networking doesn't
work on some WSL kernels. `compose.yaml` uses `network_mode: pasta` to avoid it. Keep that line.

**Port 5432 is already in use.** Many machines already run a Postgres on 5432, so the container
uses **5433**. Make sure `DATABASE_URL` in `.env` uses 5433.

**`EPERM: operation not permitted, rename ... query_engine` on Windows.** A running dev server
is holding the Prisma engine file. Stop `pnpm dev`, run the command again, then restart.

**`Authentication failed against database server`.** You are probably connecting to a different
Postgres. Check the port in `DATABASE_URL`, and check the container is up with `podman ps`.

**Prisma asks for consent before `db:reset`.** Prisma asks for confirmation when an AI assistant
runs destructive commands. Run `pnpm db:reset` yourself in a terminal.

**`401 OTP_INVALID` with the right code.** Codes expire after 5 minutes and lock after 5 wrong
attempts. Request a new code.

**Endpoints fail after pulling new code.** Run `pnpm install` and `pnpm db:migrate`, then
restart `pnpm dev`.
