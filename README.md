# Shoply

A personal e-commerce demo project built with Next.js 15, React Query, Zustand, Axios, and Tailwind CSS. This document explains how every piece of the stack is used so the project is easy to understand, extend, and present.

**Tech stack:** Next.js 15 · TypeScript · Tailwind CSS · Axios · React Query v5 · Zustand v5 · DummyJSON API

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/               # Next.js App Router pages & layouts
├── components/        # Reusable UI components
├── hooks/             # Custom React Query hooks
├── lib/
│   ├── axios.ts       # Axios instance with interceptors
│   └── react-query.tsx # QueryClient provider + devtools
├── services/          # API service functions (productApi, authApi, etc.)
├── store/             # Zustand stores (authStore, useCartStore, useWishlistStore)
└── types/             # Shared TypeScript types
```

---

## Architecture Overview

Data flows in one direction across all layers:

```
DummyJSON API  (https://dummyjson.com)
      ↓
Axios  ·  lib/axios.ts
      ↓
Service Layer  ·  services/api.ts
      ↓
React Query  ←——————————→  Zustand
(server state / cache)     (client state)
      ↓                         ↓
              Components
                  ↓
              Next.js
                  ↓
            Tailwind CSS
```

**React Query** owns anything that comes from the server — products, categories, search results.  
**Zustand** owns anything that lives on the client — who is logged in, what is in the cart, the wishlist.

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://dummyjson.com
```

---

## 1. The API — DummyJSON

**What it is:** A free fake REST API that provides realistic e-commerce data — products, categories, and authentication — without needing a real backend.

**Key endpoints used:**

| Endpoint                       | Used for                                    |
| ------------------------------ | ------------------------------------------- |
| `GET /products`                | List products, paginated via `skip`/`limit` |
| `GET /products/:id`            | Single product detail page                  |
| `GET /products/category/:slug` | Products filtered by category               |
| `GET /products/search?q=`      | Search results                              |
| `GET /products/categories`     | Full category list                          |
| `POST /auth/login`             | Login — returns user object + JWT           |

---

## 2. Axios — HTTP Client

**File:** `src/lib/axios.ts`

Axios is configured once and reused everywhere. Components never import Axios directly — they use the service layer (see below).

```ts
const api = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
```

**Interceptors** are middleware that run automatically on every request or response:

- **Request interceptor** — runs _before_ every request. The ideal place to attach an auth token (scaffolded and commented out, ready to enable).
- **Response interceptor** — runs _after_ every response. Handles `401 Unauthorized` errors globally so every component doesn't need to check for them individually.

> **Why not just use `fetch`?** Axios provides interceptors, automatic JSON parsing, configurable timeouts, and better error objects with no extra work.

---

## 3. Service Layer — `services/api.ts`

**File:** `src/services/api.ts`

A set of typed async functions that wrap Axios calls. Components never call Axios directly — they call these service functions. This separates _what data you want_ from _how it's fetched_, so changing the API URL or response shape only requires updating one file.

Three groups of functions are exported:

```ts
productApi.getAll();
productApi.getById(id);
productApi.search(q, skip, limit);
productApi.getByCategorySlug(slug, skip, limit);
productApi.getBrands();
productApi.getByBrand(brand, skip, limit); // custom — DummyJSON has no brand endpoint,
// so this fetches all and filters in memory

categoryApi.getAll();
categoryApi.getCountBySlug(slug);

authApi.login(username, password); // POST /auth/login
```

---

## 4. React Query — Server State

**Files:** `src/lib/react-query.tsx` · used via `useQuery` across all pages

React Query manages _server state_ — data fetched from an API. It acts as a smart cache between the API and the UI: fetch once, cache the result, serve it instantly on repeat visits, and revalidate in the background when data goes stale.

### QueryClient Configuration

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 hour — don't refetch if data is fresh
      gcTime: 60 * 60 * 1000, // 1 hour — keep unused data in memory
      retry: 1, // retry a failed request once before erroring
    },
  },
});
```

`ReactQueryProvider` wraps the entire app in `layout.tsx`, making the shared cache available to every page. **ReactQueryDevtools** is also included — a browser panel to inspect every cached query during development.

### Usage in Components

```ts
// Basic query
const { data: product, isLoading } = useQuery({
  queryKey: ["product", id], // unique cache key
  queryFn: () => productApi.getById(Number(id)), // the fetch function
  enabled: !!id, // only run when id exists
});

// Dependent query — only runs after the first query resolves
const { data: related } = useQuery({
  queryKey: ["related-products", product?.category],
  queryFn: () => productApi.getByCategorySlug(product!.category, 0, 5),
  enabled: !!product?.category,
});
```

### Key Concepts

| Concept     | What it means                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `queryKey`  | Unique identifier for a cached result. `["product", 5]` and `["product", 6]` are separate entries.                      |
| `staleTime` | How long data is considered fresh. Within this window, React Query returns the cache instantly with no network request. |
| `gcTime`    | How long unused (unmounted) data stays in memory before being discarded.                                                |
| `enabled`   | When `false`, the query does not run. Used for queries that depend on earlier data.                                     |
| `isLoading` | `true` only during the very first fetch. Used to show skeleton screens.                                                 |

---

## 5. Zustand — Client State

**Files:** `src/store/authStore.ts` · `src/store/useCartStore.ts` · `src/store/useWishlistStore.ts`

Zustand manages _client state_ — data that lives in the browser and doesn't come from the API. Think of it as a global, reactive `useState` that any component can read or update, with built-in persistence.

### `authStore` — Logged-in User

```ts
// State
{ user: AuthUser | null, accessToken: string | null, isAuthenticated: boolean }

// Actions
setAuth(user, accessToken)   // called after a successful login
logout()                     // clears all auth state
```

Saved to `localStorage` under the key `"shoply-auth"` via the `persist` middleware. The user stays logged in after a page refresh or browser restart.

### `useCartStore` — Shopping Cart

```ts
// State
{ cart: CartItem[] }

// Actions
addToCart(item)              // adds item, or increments quantity if already in cart
removeFromCart(id)
updateQuantity(id, qty)      // removes the item automatically if qty drops to 0
clearCart()
```

Saved to `localStorage` under `"shoply-cart"`. Cart contents survive page refresh.

### `useWishlistStore` — Wishlist (Per-User)

The wishlist is more complex because it must be isolated per user: User A's wishlist should not be visible to User B, but if User A logs back in, their items should reappear.

**Design:** A single persisted object `itemsByUser` maps each `userId` to their list of items. Only the active user's slice is loaded into memory.

```ts
// Persisted (saved to localStorage)
{ itemsByUser: { [userId: number]: WishlistItem[] } }

// In-memory only (not saved, rehydrated on login)
{ items: WishlistItem[], userId: number | null }

// Actions
setUser(userId)      // called on login — loads that user's items from itemsByUser
toggleItem(item)     // add or remove; updates both items[] and itemsByUser
removeItem(id)
clearWishlist()      // called on logout — clears items/userId in memory, keeps localStorage
```

```ts
// Only itemsByUser is persisted; items and userId are runtime-only
persist(..., {
  name: "shoply-wishlist",
  partialize: (state) => ({ itemsByUser: state.itemsByUser }),
})
```

**Lifecycle:**

1. User logs in → `setUser(userId)` is called → `items` is populated from `itemsByUser[userId]`
2. User toggles a heart → `items` and `itemsByUser[userId]` are updated → `localStorage` is written automatically
3. User logs out → `clearWishlist()` sets `items = []` and `userId = null` — but `itemsByUser` in `localStorage` is untouched
4. User logs in again → step 1 restores the same items

### Selectors — How to Read from a Store Correctly

Subscribing to more state than you need causes unnecessary re-renders.

```ts
// ✅ Single value selector — re-renders only when isAuthenticated changes
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

// ✅ useShallow — subscribe to multiple values efficiently
const { cart, clearCart } = useCartStore(
  useShallow((s) => ({ cart: s.cart, clearCart: s.clearCart })),
);

// ❌ Full store subscription — re-renders whenever ANY part of the store changes
const { cart, clearCart } = useCartStore();
```

### Middleware

| Middleware | What it does                                                                              |
| ---------- | ----------------------------------------------------------------------------------------- |
| `persist`  | Automatically saves and restores state from `localStorage`                                |
| `devtools` | Connects the store to the Redux DevTools browser extension for real-time state inspection |

---

## 6. Next.js 15 — Framework

Next.js handles routing, rendering, and the overall project structure using the **App Router**.

### Routing

Each `page.tsx` file inside `src/app/` maps directly to a URL:

```
src/app/page.tsx               →  /
src/app/products/page.tsx      →  /products
src/app/products/[id]/page.tsx →  /products/42
src/app/cart/page.tsx          →  /cart
src/app/checkout/page.tsx      →  /checkout
src/app/wishlist/page.tsx      →  /wishlist
src/app/login/page.tsx         →  /login
src/app/categories/[slug]/page.tsx  →  /categories/smartphones
src/app/brands/[brand]/page.tsx     →  /brands/apple
```

### `layout.tsx`

The root layout wraps every page in the app. `ReactQueryProvider`, `Navbar`, and `Footer` live here so they are rendered exactly once, on every page, without repetition.

### `"use client"`

Next.js renders pages on the server by default (faster initial load, SEO-friendly). Any component that uses browser-only APIs (`localStorage`, `useState`, event handlers) must declare `"use client"` at the top to opt into client-side rendering. All Zustand stores and React Query hooks require this.

---

## 7. TypeScript

TypeScript catches mistakes at compile time rather than at runtime.

Key types used across the project:

| Type                                      | Where                       | What it represents                                                        |
| ----------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `Product`                                 | `types/product.ts`          | Full product object from DummyJSON                                        |
| `CartItem`                                | `store/useCartStore.ts`     | Subset of Product + `quantity` field                                      |
| `WishlistItem`                            | `store/useWishlistStore.ts` | Subset of Product (display fields only)                                   |
| `AuthUser`                                | `store/authStore.ts`        | Logged-in user object                                                     |
| `Category`                                | `types/categories.ts`       | Category object from DummyJSON                                            |
| `CartState`, `AuthState`, `WishlistState` | store files                 | Typed store interfaces — components know exactly what each store contains |

---

## 8. Tailwind CSS

Utility-first CSS — styles are applied directly in JSX as class names instead of in separate CSS files.

**Consistent patterns used across this project:**

| Pattern               | Classes                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Card                  | `border rounded-2xl p-5 bg-white`                                                          |
| Primary button        | `bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-colors` |
| Page container        | `max-w-5xl mx-auto px-4` (set globally in `layout.tsx`)                                    |
| Responsive two-column | `flex flex-col lg:flex-row gap-6`                                                          |
| Sticky sidebar        | `lg:sticky lg:top-20`                                                                      |
| Input field           | `border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-300`               |

---

## End-to-End Flows

### Login Flow

1. User submits the form in `/login`
2. `authApi.login(username, password)` calls `POST /auth/login` via Axios
3. DummyJSON returns `{ id, username, firstName, lastName, accessToken, ... }`
4. `useAuthStore.setAuth(user, accessToken)` saves the user to memory and `localStorage`
5. `useWishlistStore.setUser(user.id)` loads that user's wishlist from `localStorage`
6. App redirects to the callback URL (e.g. `/checkout`)
7. `NavIcons` — mounted in the Navbar — re-renders automatically because it subscribes to `useAuthStore`, switching the login icon to the user's avatar + logout button

### Product Page Flow

1. User navigates to `/products/42`
2. Next.js renders the page; `useQuery(["product", "42"], ...)` fires
3. React Query checks its cache — if the entry exists and is under 1 hour old, it returns the cached result **instantly** with no network request
4. If stale or missing, `productApi.getById(42)` calls Axios → `GET /products/42` → DummyJSON responds → result is stored in the React Query cache for future visits
5. A second `useQuery` (dependent) waits for `product.category` and then fetches related products
6. `useWishlistStore` is read (local, no network) to determine if the heart icon should be filled
7. Clicking "Add to Cart" calls `useCartStore.addToCart()` — Zustand updates state and `persist` writes to `localStorage` synchronously
8. The cart badge in `NavIcons` updates instantly because it subscribes to `useCartStore`

### Checkout Flow

1. User navigates to `/checkout`
2. Page checks `useAuthStore` — if not authenticated, shows a sign-in gate
3. Page checks `useCartStore` — if cart is empty, shows an empty state
4. Otherwise renders the checkout form, pre-filling Full Name from `useAuthStore.user`
5. On submit, form is validated client-side; a mock 1.2 s delay simulates a network call
6. `useCartStore.clearCart()` empties the cart; the success screen is shown
7. Cart badge in the Navbar drops to 0 immediately
