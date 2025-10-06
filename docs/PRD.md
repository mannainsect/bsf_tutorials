# BSF Tutorials Product Guide

## 1. Executive Summary

### Product Overview
- Deliver Black Soldier Fly (BSF) tutorials and multi-step courses through a Nuxt 4 + Ionic application targeting web and Capacitor builds.
- Serve three audiences: public visitors consume highlighted videos, registered-but-logged-out users receive onboarding prompts, and authenticated members unlock full catalogues, company-aware credits, and progress tracking.
- REST integration is powered by the Content & Products API; request plumbing lives in `useApi`, contracts in `shared/types/api`, and endpoint roots in `nuxt.config.ts`.

### Core Stack

| Layer      | Technology          | Purpose                                               |
| ---------- | ------------------- | ----------------------------------------------------- |
| Framework  | Nuxt 4 (SPA)        | Routing, auto-imports, SSR-ready hydration            |
| UI         | Vue 3 + Ionic       | Cross-platform components & responsive layouts        |
| Language   | TypeScript          | Static typing across composables, stores, and routes  |
| State      | Pinia               | Auth store, profile cache, reactive feature state     |
| Testing    | Vitest + Playwright | Unit/regression coverage for logic and UI flows       |
| i18n       | Nuxt I18n           | Five-locale translation support                       |
| Mobile     | Capacitor           | Native wrappers, splash handling, plugin access       |

### Architectural Principles
- Composable-first: business logic is packaged in `app/composables` and injected into pages.
- API abstraction: repositories/services separate fetch mechanics from Vue components.
- Accessibility: Ionic components, focus traps, and locale-aware routing baked in.
- Observability: metrics and log composables provide non-blocking telemetry hooks.

## 2. User Segments & Journeys

| Segment                   | Primary Routes                         | Key Capabilities                                                                 |
|---------------------------|----------------------------------------|----------------------------------------------------------------------------------|
| Public visitor            | `index.vue`                            | Marketing hero, feature carousel, CTA to register or sign in; consumes public videos via `/products/content/public`.
| Registered (logged out)   | `register.vue`, `verify-token.vue`     | Email/password registration, token verification, follow-up login prompt.         |
| Authenticated member      | `main.vue`, `account.vue`              | Navigation hub, profile & company editors, credit snapshot, password reset, contextual help, content logging hooks. |

`definePageMeta` guards keep `main` and `account` behind `auth` middleware while `guest` middleware protects login/registration routes from logged-in users.

## 3. Project Structure

```
app/
  components/
    auth/          # Login + registration forms
    help/          # Help modal implementation
    layout/        # Public/private Ionic shells
    ui/            # Shared Ionic primitives
  composables/
    api/           # Repositories & services (auth, profile, metrics, logs)
    auth/          # Form validation and registration helpers
    errors/        # Centralised error formatting
    useHelp*.ts    # Contextual help logic
    useLog.ts      # Content + credit logging helpers
    useMetrics.ts  # Client-side metrics collector
    useProfile.ts  # Profile bootstrap + company switching
  pages/           # File-based routes listed above
  stores/          # `useAuthStore` with caching + company hydration
shared/types/      # DTOs for auth, content, metrics, logs, utilities
docs/              # Product (this file) and ancillary documentation
tests/             # Vitest unit suites and Playwright E2E specs
```

## 4. Content & Products API

### Base Configuration
- Base path: `/api/v1` (prepend deployment host, e.g. `https://api.example.com/api/v1`).
- Responses: JSON bodies with FastAPI-style `{"detail": "..."}` error payloads; timestamps are ISO 8601 with trailing `Z`.
- Authentication: Bearer tokens from `POST /api/v1/auth/login/token` in the `Authorization` header. Only `GET /products/content/public` is anonymous.
- Superadmin guard: `POST`/`PUT`/`DELETE` endpoints across content, playlists, and tools require `superadmin` role.

### Domain Models (see `shared/types/api/content.types.ts`)
- **Content / ContentPublic**: Metadata for videos, documents, and courses with category (`video`, `document`, `course`, `podcast`, `webinar`, `tech_support`), level (`basic`, `intermediate`, `advanced`), credit cost, Vimeo `url`, ownership flags, and availability windows.
- **Playlist / PopulatedPlaylist**: Course-like bundles referencing content/tools (`includes`) with category (`course`, `support_mind`, `tech_support`), level, credits, and owned/watched flags.
- **Tool**: Premium utilities with category (`learn`, `farming`, `business`, `analytics`) and optional `expiry_days`.
- **PurchasedProduct**: Records `product`, `product_type`, `product_name`, and `expires_at` for ownership checks.
- Allowed `profile_tags`: `newbie`, `business`, `insect_farmer`, `ngo`, `startup`, `animal_grower`, `other`.
- Allowed `category_tags`: `pre_processing`, `post_processing`, `breeding`, `rearing`, `nursing`, `sales`, `substrate`, `business`, `financing`, `metrics`, `tech`, `frass`, `sustainability`, `animal_growing`, `insect_farm_hub`, `manna_mind`, `technical_guidance`, `other`.

### Video URL Contract
- Backend returns ready-to-embed Vimeo player URLs: `https://player.vimeo.com/video/{VIDEO_ID}?badge=0&autopause=0&player_id=0&app_id=58479`.
- Use links directly in `<iframe src>`, no extra parsing or `@vimeo/player` dependency needed.

### Endpoint Reference

| Endpoint | Audience | Notes |
| -------- | -------- | ----- |
| `GET /products/content/public` | Anonymous | Filters by `category_tags` or `profile_tags`; premium items mask `url` to `null`.
| `GET /products/content` | Authenticated | Returns `Content[]` with `owned`/`watched`. `filter` query defaults to `video`.
| `GET /products/content/{id}` | Authenticated | Single content item with ownership metadata. Returns `404` if not found.
| `POST /products/content` | Superadmin | Requires `ContentCreate` payload; returns `201` + location header.
| `PUT /products/content/{id}` | Superadmin | Partial updates with `ContentUpdate`; ensure timezone-aware datetimes.
| `DELETE /products/content/{id}` | Superadmin | Soft-deletes (`active = false`).
| `GET /products/playlists` | Authenticated | Optional `filter` (`course`, `support_mind`, `tech_support`, `all`).
| `GET /products/playlists/{id}` | Authenticated | Returns `PopulatedPlaylist` with embedded content/tools.
| `POST/PUT/DELETE /products/playlists` | Superadmin | Mirror content endpoints; payloads `PlaylistCreate`/`PlaylistUpdate`.
| `GET /products/tools` | Authenticated | Lists tool catalogue with `owned` flag.
| `GET /products/tools/{id}` | Authenticated | Single tool detail.
| `POST/PUT/DELETE /products/tools` | Superadmin | Manage tool definitions.
| `POST /products/purchase/{product_id}?product_type={type}` | Authenticated | Debits credits and appends `PurchasedProduct`. Guards: `400 Product already purchased`, `404 Product not found`.

### Error Handling Patterns
- `400` for validation, duplicate purchase, or missing timezone.
- `401` triggers `useApi` interceptor logout + redirect.
- `403` indicates missing `superadmin` role.
- `500` surfaces persistence or undefined title errors; log them via `useMetrics.trackError` and `useLog`.

## 5. Front-End Modules & Features

### Landing (`app/pages/index.vue`)
- Swiper-powered feature carousel using Ionic cards.
- CTA buttons route via Nuxt i18n helpers to register/login or account when authenticated.

### Authentication (`app/pages/login.vue`, `register.vue`, `verify-token.vue`, `auth/verify-email.vue`)
- `useLoginForm` validates credentials and formats API errors.
- `useRegistration` orchestrates registration, token delivery, and navigation to verification.
- Guest middleware prevents logged-in users from re-accessing login/registration.

### Dashboard (`app/pages/main.vue`)
- Protected route with quick navigation buttons (`useSafeLocalePath`) and debounced routing to prevent double taps.
- Pulls profile state from `useProfile`, capturing API errors and providing retry flows.

### Account Management (`app/pages/account.vue`)
- Profile editing with validation, unsaved-changes warnings, and toast-driven feedback.
- Company metadata editor gated by `canEditCompany`; uses `useCountries` and `useTimezones` for select options.
- Password reset posts to `usersResetPassword` endpoint and clears form state on success.
- Credit overview chip displays `account_type` with Ionic chips, aligning with `user.balance`.

### Help System (`useHelp` + `components/help/HelpModal.vue`)
- Singleton modal creation with focus/scroll restoration.
- Topic validation via `useHelpTopic`; localized content pulled from `i18n/locales`.

### Analytics & Logging
- `useMetrics` enriches events with user/company context and throttles network usage.
- `useLog` supports process logs, credit history, and dedicated `logContentAction` for tutorial events.
- Repositories under `app/composables/api` share `$fetch` instances with retry and 401 interception.

## 6. Development Workflow

### Environment
```
cp .env.example .env
# Set NUXT_PUBLIC_API_BASE_URL, API tokens, feature flags
```

### Commands
- `npm run dev` — hot reload at http://localhost:3000.
- `npm run lint` / `npm run lint -- --fix` — ESLint checks.
- `npm run format` — Prettier formatting.
- `npm run typecheck` — Vue TSC validation.
- `npm run test` / `npm run test:coverage` — Vitest unit suites.
- `npm run test:e2e` — Playwright tests (requires dev server).
- `npm run generate` — Static export for previews.

### Testing Focus
- Authentication flows: login, registration, email verification.
- Profile and company editors: validation, unsaved change warnings, API error handling.
- Help modal accessibility: focus management and topic fallbacks.
- Metrics/log instrumentation: ensure non-blocking behaviour and correct payload enrichment.

## 7. Future Extensions
- Build dedicated catalogue pages that consume the typed Content & Products endpoints for public and authenticated views.
- Surface credit-based purchase flows on tutorial detail pages using `useLog.logContentAction` to bridge purchases and watch tracking.
- Expand localization copy (currently English placeholders in non-English locales) before production release.

