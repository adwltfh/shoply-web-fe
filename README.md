# Shoply Mini

> Discover more. Shop simpler.

A curated, mobile-first **demo** storefront for web, iOS, and Android from one Expo codebase.
It reinterprets the [Shoply Marketplace](https://shoply-marketplace.vercel.app/) concept.
It does not take payments, place real orders, or collect payment details.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Bootstrap: Expo SDK 58, strict TypeScript, design tokens, dependencies | Done |
| 1 | Navigation shell: Home / Explore / Saved / Cart, stack routes, shared UI | Done |
| 2 | Catalog, search, filters, product details | Not started |
| 3 | Wishlist and cart with persistence | Not started |
| 4 | Demo checkout | Not started |
| 5 | Accessibility/responsive polish, tests, EAS config | Not started |

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 58 (`expo@~58.0.22`), React Native 0.88, React 19.3 |
| Language | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`) |
| Navigation | Expo Router (native tabs on iOS/Android, header nav on web) |
| Web | React Native for Web, static output (`web.output: "static"`) |
| Icons | `expo-symbols` (SF Symbols on iOS, Material Symbols on Android/web, bundled font) |
| State | Zustand (Phase 3), TanStack Query |
| Persistence | `@react-native-async-storage/async-storage` (Phase 3) |
| Lint | ESLint 9 + `eslint-config-expo` |

## Requirements

- Node.js `^22.13.0`, `^24.3.0`, or newer (developed with Node 24.22)
- [Bun](https://bun.sh) 1.4+ as package manager (this repo uses `bun.lock`; do not mix package managers). Windows: `winget install Oven-sh.Bun`
- Android: Android Studio + emulator, or a physical device with Expo Go / a dev build
- iOS: macOS with Xcode for the Simulator. On Windows/Linux, use a physical iPhone with Expo Go or an EAS build.

## Run

```bash
bun install
bun run web        # browser
bun start          # dev server; press a (Android) or i (iOS, macOS only), or scan the QR code with Expo Go
```

Run one dev server at a time.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `expo lint` |
| `bun run doctor` | `expo-doctor` dependency/config checks |
| `bun run export:web` | Static web build to `dist/` |

Add Expo/React Native packages with `bun x expo install <pkg>` so versions match the SDK.

Preview a web build locally: `bun run export:web`, then `bun x expo serve`.

## Project layout

```text
src/
  app/                    Expo Router routes (the only route root)
    _layout.tsx           Providers + root Stack
    (tabs)/               Home, Explore, Saved, Cart
    products/[slug].tsx   Product detail (placeholder)
    checkout/             Demo checkout + success (placeholders)
    +not-found.tsx
  components/
    layout/               AppTabs (.tsx native, .web.tsx web), ScreenContainer, Wordmark
    ui/                   Text, Button, IconButton, Card, EmptyState
  design-system/          Color, spacing, radius, typography tokens
  lib/metadata.ts         Static-render page metadata (title, description, robots)
  providers/              AppProviders (TanStack Query)
  types/                  React Native for Web type augmentations
```

Route files stay thin. Domain logic goes in `src/features/` (added from Phase 2).

## Known limitations

- **Native platforms not verified yet.** The machine that built Phases 0–1 had no Android SDK, and Windows has no iOS Simulator. Web was verified; iOS and Android were not run.
- **Product deep links on static hosting:** `/products/<slug>` only works on refresh once Phase 2 adds `generateStaticParams` for known slugs. The dev server handles any slug.
- **Web product and checkout pages have no site header yet.** They use the stack header with a back button.
- **`bun audit`:** 2 moderate advisories (`glob` <14.0.2, `minimatch` <11.0.1). They come in through Expo CLI/config tooling and ESLint, and run only at build time. They are not part of the app bundle. Forcing the fix would downgrade Expo packages, so it is not applied. Update when Expo ships patched releases (`bun x expo install --fix`).
- **Dependency install scripts:** Bun runs lifecycle scripts only for packages in `trustedDependencies`. None are needed today; add a package there only after reviewing its script.
- Data stays on the current device/browser; there is no account sync.
