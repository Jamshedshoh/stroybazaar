# StroyBazaar — Construction Materials Marketplace (Khujand)

A React Native (Expo + TypeScript) MVP scaffold based on `docs/business-model.md`.
It implements the platform's core loops with **mock data** so the flows can be
tested before a backend exists.

## What is implemented

| Business-model feature | Where in the app |
|---|---|
| Retail flow (browse → cart → checkout) | Catalog → Product detail → Cart → Checkout (COD / bank transfer) |
| Wholesale RFQ flow (the key differentiator) | **RFQ** tab → post a materials list → suppliers reply with quotes → accept a quote |
| Low-touch commission model | Orders are only counted/confirmed when the buyer confirms receipt in-app |
| Supplier verification, ratings & reviews | Supplier list/detail with `verified` badge, rating and review screen |
| Multilingual (Tajik / Russian / English) | Language selector in **Profile**; categories, units and UI translated via i18next |
| Order tracking | **Orders** tab with status timeline and "Confirm receipt" action |
| Metrics hooks | Data layer exposes orders, RFQs, response times (ready for analytics) |

## Tech stack (from section 11 of the model)

- React Native with Expo + TypeScript
- React Navigation (bottom tabs + native stack)
- TanStack Query for server state (mock async API)
- Zustand for client state (cart, language) with AsyncStorage persistence
- i18next / react-i18next for Tajik, Russian, English
- Expo Vector Icons

## Project structure

```
src/
├── api/          mock async API used by TanStack Query
├── components/   reusable UI (ProductCard, SupplierRow, etc.)
├── data/         seed catalog, suppliers, categories
├── i18n/         translations and i18next setup
├── navigation/   navigators and param types
├── screens/      app screens
├── store/        Zustand stores
├── theme/        colors and shared styles
└── types/        domain models
```

## Run it

This app is a member of the StroyBazaar pnpm/Turbo workspace. From the repo root:

```bash
pnpm install
pnpm dev --filter=@stroybazaar/mobile-app                 # Expo/Metro
pnpm build --filter=@stroybazaar/mobile-app               # export to apps/mobile-app/dist
pnpm typecheck --filter=@stroybazaar/mobile-app
```

Running `pnpm dev`, `pnpm build` or `pnpm typecheck` without a filter includes this
app alongside the other apps. You can also run Expo directly from this folder with
`pnpm start` (or `pnpm android`, `pnpm ios`, `pnpm web`).

Then open with Expo Go (Android/iOS) or press `w` for web. Expo reads
`apps/mobile-app/.env`, so set `EXPO_PUBLIC_API_URL` there (or export it in your
shell) to point at a backend. Turbo hashes `EXPO_PUBLIC_*` variables.

## Workspace notes

- `index.js` is the app entry instead of `expo/AppEntry.js`: pnpm's symlinked
  `node_modules` breaks Metro's resolution of Expo's relative entry import.
- `metro.config.js` adds the workspace root to `watchFolders`/`nodeModulesPaths`
  so Metro can find packages in pnpm's virtual store.
- `tsconfig.typecheck.json` pins React 18 types for `tsc` only. The React 19 types
  used by the Next.js apps otherwise leak into this app's `.d.ts` resolution in a
  pnpm workspace. Metro keeps reading the plain `tsconfig.json`.

## Backend API

- [`docs/openapi.yaml`](docs/openapi.yaml) — OpenAPI 3.0 contract (18 paths, 24 schemas)
- [`docs/api-integration.md`](docs/api-integration.md) — endpoint mapping, auth, client code, server rules

Validate the spec with `pnpm --filter @stroybazaar/mobile-app validate:api`. To connect
a backend, set `EXPO_PUBLIC_API_URL` and replace `src/api/client.ts`; no screen changes needed.

## Notes / next steps

- Replace `src/api/client.ts` with real Express calls (see `docs/api-integration.md`).
- The supplier dashboard and admin console already exist as `apps/admin-app` (model §11).
- Add local wallet/card payments (Alif) and contractor credit in later phases
  (model §5).
- Translate supplier-written listing text with machine translation later
  (model §7); today only categories, units and UI are translated.
