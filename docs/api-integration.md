# API integration guide

This document connects the React Native app to a real backend. The canonical
contract is the OpenAPI 3.0.3 document that `apps/api` generates from its own
route definitions, so it always matches what the server validates and returns:

- **http://localhost:4000/openapi.json** (or `/openapi.yaml`): the document
- **http://localhost:4000/docs**: Swagger UI, with "Try it out"

The app currently talks to an in-memory mock in `src/api/client.ts`; replacing
that one file is enough to switch to a live API.

The supplier dashboard and admin console use the same tokens. Platform
management lives in `apps/admin-api` (admin role only), documented at
http://localhost:4001/openapi.json and http://localhost:4001/docs.

---

## 1. Configure the base URL

Create a `.env` file in the project root:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:4000/v1
```

Expo exposes `EXPO_PUBLIC_*` variables to the client bundle. Restart Metro
(`npm start -- --clear`) after changing it.

Use a real HTTPS URL in production. For a physical device, `localhost` points
at the phone — use your machine's LAN IP (e.g. `http://192.168.1.10:4000/v1`)
or a tunnel.

---

## 2. Authentication

The model specifies **SMS OTP phone login**. Flow:

1. `POST /auth/otp/request` with `{ "phone": "+992925550101" }`
2. `POST /auth/otp/verify` with `{ "phone": "...", "code": "123456" }`
3. Store the returned JWT and send `Authorization: Bearer <token>` on
   protected requests.

Add the token to the existing persisted Zustand store:

```ts
// src/store/useStore.ts — add to AppState and the store initializer
token: string | null;
setToken: (token: string | null) => void;

// initializer
token: null,
setToken: (token) => set({ token }),
```

`AsyncStorage` persistence is fine for the MVP; use `expo-secure-store` for
production tokens.

Public endpoints (catalog, suppliers, reviews) need no token. Everything under
`/rfqs`, `/orders`, `/reviews` (POST), and `/me` requires one.

---

## 3. Mapping the mock client to endpoints

| `src/api/client.ts` function | Method & path | Auth | Notes |
|---|---|---|---|
| `fetchCategories` | `GET /categories` | public | |
| `fetchProducts(categoryId?)` | `GET /products?categoryId=...` | public | Optional `search`, `Accept-Language` |
| `fetchProduct(id)` | `GET /products/{productId}` | public | |
| `fetchSuppliers` | `GET /suppliers` | public | |
| `fetchSupplier(id)` | `GET /suppliers/{supplierId}` | public | |
| `fetchReviews(supplierId)` | `GET /suppliers/{supplierId}/reviews` | public | |
| `fetchRFQs` | `GET /rfqs` | buyer | Current buyer only |
| `fetchRFQ(id)` | `GET /rfqs/{rfqId}` | buyer | Includes quotes |
| `createRFQ(input)` | `POST /rfqs` | buyer | Body: `items[]`, `deliveryLocation`, `neededBy` |
| `simulateSupplierQuotes` | `POST /rfqs/{rfqId}/quotes/simulate` | — | **Demo only** — delete this button in production |
| `awardQuote(id, quoteId)` | `POST /rfqs/{rfqId}/award` | buyer | Body: `{ quoteId }` |
| `fetchOrders` | `GET /orders` | buyer | Current buyer only |
| `createOrder(input)` | `POST /orders` | buyer | Server recalculates prices |
| `advanceOrderStatus(id)` | `PATCH /orders/{orderId}` | supplier/admin | Remove the buyer-side "advance" button in production |
| `confirmReceipt(id)` | `POST /orders/{orderId}/confirm-receipt` | buyer | Idempotent; triggers commission + review prompt |
| `submitReview(input)` | `POST /reviews` | buyer | One review per order |

New endpoints the mock has no equivalent for: `POST /auth/otp/request`,
`POST /auth/otp/verify`, `GET /me`, `PATCH /me` (name, language),
`GET /rfqs/{rfqId}/quotes`, and for the supplier dashboard
`POST /rfqs/{rfqId}/quotes`, `POST /products`, `PATCH /products/{productId}`.
`GET /rfqs` and `GET /orders` accept an optional `status` filter and return
what the caller's role may see (buyer: own; supplier: open RFQs / own orders;
admin: all).

---

## 4. Replace the mock client

Create `src/api/http.ts`:

```ts
import { useStore } from '@/store/useStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token, language } = useStore.getState();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': language,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    throw new ApiClientError(
      response.status,
      body?.code ?? 'HTTP_ERROR',
      body?.message ?? response.statusText,
    );
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
```

Then rewrite the exported functions in `src/api/client.ts` while keeping their
signatures — no screen needs to change:

```ts
import { api } from './http';
import type { Product, RFQ, RFQItem, Order, Review } from '@/types';

export const fetchProducts = (categoryId?: string) =>
  api<Product[]>(`/products${categoryId ? `?categoryId=${categoryId}` : ''}`);

export const fetchProduct = (id: string) => api<Product>(`/products/${id}`);

export const fetchRFQs = () => api<RFQ[]>('/rfqs');

export const createRFQ = (input: {
  items: RFQItem[];
  deliveryLocation: string;
  neededBy: string;
}) => api<RFQ>('/rfqs', { method: 'POST', body: JSON.stringify(input) });

export const confirmReceipt = (orderId: string) =>
  api<Order>(`/orders/${orderId}/confirm-receipt`, { method: 'POST' });
```

Do the same for the remaining functions. Keep the `delay()` calls out of the
real implementation — TanStack Query already handles loading state.

### Error handling in screens

TanStack Query mutations expose the thrown error:

```tsx
const mutation = useMutation({
  mutationFn: () => confirmReceipt(order.id),
  onError: (error) => {
    if (error instanceof ApiClientError && error.status === 401) {
      // navigate to login / clear token
    }
    Alert.alert(error.message);
  },
});
```

The standard error body is `{ "code": "ORDER_ALREADY_CONFIRMED", "message": "...", "details": {} }`.

---

## 5. Server-side rules to enforce

These come straight from the business model and must not be client-side only:

1. **Price integrity** — on `POST /orders` and `POST /rfqs/{id}/quotes`,
   recompute unit prices from the catalog and wholesale tiers. Never trust
   `unitPrice`/`total` sent by a client (§3, §4).
2. **Commission on confirmation only** — create a commission ledger entry when
   an order transitions to `confirmed_receipt`. This prevents leakage from
   cash-on-delivery (§4).
3. **Idempotency** — `confirm-receipt` and `POST /reviews` must be safe to retry;
   return `409` on duplicate review per order.
4. **Role checks** — buyers cannot PATCH order status or submit supplier
   quotes; suppliers cannot read other buyers' RFQs/orders.
5. **Supplier verification** — `verified` is set by the platform after license
   check / shop visit / sample orders (§8).
6. **Localization** — store supplier-written text verbatim; platform-owned
   categories, units and attributes are translated in all three languages (§7).
7. **Rate limit OTP** requests and log auth attempts.

---

## 6. Getting quotes into the buyer app

The mock uses a button that calls `simulateSupplierQuotes`. In production,
suppliers submit quotes through their dashboard (`POST /rfqs/{rfqId}/quotes`).
Choose one delivery mechanism:

| Option | Implementation | Pros / cons |
|---|---|---|
| **Polling (simplest MVP)** | `useQuery({ queryKey: ['rfq', id], queryFn: ..., refetchInterval: (q) => q.state.data?.status === 'open' ? 15000 : false })` | No extra infra; slight delay |
| **FCM push** | Send a notification on quote creation; app refetches on `onNotification` (FCM is already in the model's stack, §11) | Instant, needs push setup |
| **WebSocket** | `subscribe /rfqs/{id}` and invalidate the query on events | Instant, needs a socket server |

Recommended: polling during the concierge/MVP phase, add FCM in the growth
phase alongside the wallet payments work.

---

## 7. Try the API

Start the stack (`podman compose up -d`, `pnpm db:seed`, `pnpm dev`), then open
http://localhost:4000/docs. In development the OTP code is printed in the
`api` console instead of being sent by SMS.

The document is generated from the route definitions in `apps/api/src/routes`.
To change the contract, change the route or its Zod schema in
`apps/api/src/schemas.ts`. Validate it with:

```bash
pnpm validate:api
```

For client code generation (e.g. `openapi-typescript`), save a snapshot:

```bash
pnpm --filter @stroybazaar/api openapi:export openapi.yaml
```

Example requests:

```bash
# Request an OTP
curl -X POST http://localhost:4000/v1/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+992925550101"}'

# List products (Russian labels)
curl http://localhost:4000/v1/products?categoryId=cement \
  -H 'Accept-Language: ru'

# Confirm receipt (requires token)
curl -X POST http://localhost:4000/v1/orders/A7X2/confirm-receipt \
  -H 'Authorization: Bearer <JWT>'
```

---

## 8. Backend implementation notes

The backend is `apps/api` (Express 5 + Prisma + PostgreSQL). The data model is
in `packages/db/prisma/schema.prisma`. Decisions behind the rules in section 5:

- **Prices:** order lines use the best wholesale tier the quantity unlocks.
  Quote totals are the supplier's own offer, since negotiating that price is
  the point of an RFQ.
- **One supplier per order:** `POST /orders` with lines from several
  suppliers returns `422 MULTIPLE_SUPPLIERS`; the app should split the cart.
- **Stock** is checked (`409 INSUFFICIENT_STOCK`) but not decremented.
  Suppliers own their stock figures (business model section 1).
- **Receipt confirmation** is allowed once the supplier has accepted the order
  (`confirmed`, `out_for_delivery` or `delivered`), so a supplier cannot block
  commission by never marking an order delivered. Commission rate is
  `COMMISSION_RATE` (default `0.02`).
- **Supplier accounts:** users sign up as buyers; an admin links them to a
  supplier with `PATCH /v1/users/{userId}` on `admin-api`. Only `verified`
  suppliers can quote. Suspended suppliers vanish from the catalog.
- **OTP:** 6-digit codes, 5-minute expiry, 5 attempts, at most 3 SMS per phone
  per 10 minutes (silently), plus a per-IP limit (`OTP_RATE_LIMIT`, default 10
  per 15 minutes, `429`). Plug a real SMS provider into `apps/api/src/sms.ts`.
- **Demo endpoint:** `POST /rfqs/{rfqId}/quotes/simulate` exists only when
  `DEMO_ENDPOINTS=true` or `NODE_ENV` is not `production`.
