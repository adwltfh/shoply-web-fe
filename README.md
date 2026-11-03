# Shoply Seller

Seller backoffice (Next.js 16, App Router) and the shared Supabase backend for
Shoply Mini. Runs in **DEMO mode** by default: nothing here collects real money.

- Spec: `docs/SHOPLY_SELLER_BACKOFFICE_IMPLEMENTATION_SPEC.md` (authoritative for
  backend, orders, inventory, payments, shipping) and
  `docs/SHOPLY_MINI_IMPLEMENTATION_BRIEF.md` (buyer UX).
- Decisions and deviations: [`docs/decisions.md`](docs/decisions.md)
- Buyer contract: [`docs/buyer-integration.md`](docs/buyer-integration.md)

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | Recon, decisions | Done |
| 1 | Migrations, RLS, seller auth, protected shell, demo seed | Done; login not yet verified against a live Supabase project |
| 2 | Product CRUD (draft/publish/schedule/pause/archive/duplicate), variants + stock, photos, physical specs, categories, pickup addresses | Seller side done; buyer app not built yet, so buyer sync is unverified |
| 3–6 | Shipping quotes, flash sales/pre-orders, checkout + payment proof, notifications, cart insights | Not started |

## Layout

```text
src/app/login, no-access        public auth pages
src/app/(seller)/…              protected pages (dashboard, products, categories, settings)
src/proxy.ts                    session refresh + sign-in redirect
src/lib/auth/dal.ts             session + store membership check used by every page/action
src/lib/catalog/queries.ts      RLS-scoped reads
src/contracts/                  Zod input schemas; storefront (buyer) row types
supabase/migrations/            SQL migrations (tenancy, catalog, storage)
supabase/seed.sql               synthetic demo store
supabase/tests/                 RLS/RPC tests on PGlite
scripts/provision-owner.ts      service-role owner provisioning
```

## Setup

Requires bun ≥ 1.4 and a **development** Supabase project (no Docker is needed).

```bash
bun install
cp .env.example .env.local      # fill in the dev project's URL, publishable key and secret key
```

Apply the database (pick one):

- **Supabase CLI:** `bunx supabase login`, `bunx supabase link --project-ref <ref>`,
  `bunx supabase db push`, then run `supabase/seed.sql` in the SQL editor.
- **Dashboard:** paste each file in `supabase/migrations/` (in filename order),
  then `supabase/seed.sql`, into the SQL editor.

In Supabase → Authentication → Sign In / Providers, **disable "Allow new users to sign up"**.

Provision the first owner (server-side, uses the secret key):

```bash
bun run provision:owner --email you@example.com --password 'choose-a-strong-one'
```

Run:

```bash
bun dev                           # http://localhost:3000
# Set NEXT_PUBLIC_SUPABASE_URL before `bun run build`: it configures next/image remote patterns.
```

## Checks

```bash
bun run typecheck   # next typegen + tsc
bun run lint
bun run test        # unit + database/RLS tests (PGlite, no network)
bun run build
```

## Manual smoke flow (Phase 1–2)

1. Sign in as the provisioned owner → Overview shows DEMO badge and banner.
2. Products → open “Everyday Cotton Tee” → upload a JPEG/PNG/WebP → **Save & publish**.
3. Confirm it appears as Active; Pause → it disappears from `storefront_products`.
4. New product without a photo → publish button lists missing requirements.
5. Sign in as a user with no membership → “no store access” page.
