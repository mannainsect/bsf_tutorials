# BSF Tutorials

A Nuxt 4 + Ionic application that surfaces Black Soldier Fly (BSF) video
tutorials and courses from the REST Content & Products API. The experience
covers anonymous discovery, authenticated learning, and registered user
workflows on web and mobile using Capacitor.

## Installation

### Requirements

- Node.js 18+
- npm

### Setup Steps

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `NUXT_PUBLIC_API_BASE_URL`.
4. Run the development server with `npm run dev` (http://localhost:3000).

## Core Experience

### Learning Content Delivery

- Typed Content & Products API integration (`shared/types/api/content.types.ts`)
  ensures consistent data for public (`/products/content/public`) and
  authenticated (`/products/content`) catalogues.
- `useApi` hardens all REST requests with automatic auth headers, retry, and
  401 recovery; endpoints are centralized under `nuxt.config.ts` ➝
  `runtimeConfig.public.apiEndpoints`.
- `useLog.logContentAction` records views, completions, and purchases so course
  interactions stay in sync across devices.

### Authentication & Session Handling

- Email/password onboarding with token verification (`app/pages/register.vue`,
  `app/pages/verify-token.vue`).
- Guest middleware keeps public routes accessible while guarding `main` and
  `account` dashboards.
- `useAuthStore` centralizes profile bootstrap, token persistence, and company
  hydration with 10-minute caching.

### Account & Company Management

- `app/pages/account.vue` allows profile edits, company metadata updates, and
  password resets with toast feedback and unsaved-change guards.
- Country and timezone lookups come from `useCountries` and `useTimezones`,
  keeping validation consistent across forms.
- Credit balances and account tiers surface via Ionic cards for quick reads.

### Help & Accessibility

- `useHelp` provides an accessible modal with focus/scroll management and a
  single Ionic modal instance.
- Help topics are mapped in `useHelpTopic` and localized through
  `i18n/locales/*`.

### Observability & Insights

- `useMetrics` ships non-blocking event tracking for logins, page views, and
  feature usage.
- `useLog` exposes CRUD helpers for process, credit, and content logs—mirrored
  in `tests/unit` examples for instrumentation.

## Testing & Quality

- `npm run lint` – ESLint checks (fails on existing legacy warnings).
- `npm run test` – Vitest unit suite.
- `npm run build` – Production build validation.
- `npm run test:e2e` – Playwright specs (requires running `npm run dev`
  in a separate terminal first).

## Architecture Notes

- `app/stores/auth.ts` normalizes Mongo-style ids, caches profiles, and keeps
  company context in localStorage.
- `app/composables/api` wraps repositories/services for profile, metrics, logs,
  and users; swap base URLs using `.env` without touching call sites.
- `useSafeLocalePath` and Nuxt i18n guard navigation while preserving locale.
- Reusable Ionic layout shells live in `app/components/layout/*`, switching
  automatically between public and private experiences.

## Directory Overview

```
app/               # Nuxt application source
  components/      # Shared Ionic components
  composables/     # Authentication, profile, help, and utility hooks
  pages/           # Public and private Vue pages
  stores/          # Pinia stores (auth, metrics, etc.)
docs/              # Reference material and internal plans
  PRD.md              # Product requirements and architecture guide
shared/types/      # TypeScript type definitions
  api/             # API request/response types
tests/             # Unit and E2E tests (Vitest + Playwright)
```

## API Documentation

- `docs/PRD.md` – Strategy, audience flows, and the integrated Content &
  Products API reference (public, authenticated, playlists, tools, purchasing).
- TypeScript helpers live under `shared/types/api` and are re-exported via
  `shared/types/index.ts` for composables and stores.

## Development Tips

- Run `npm run lint -- --fix` to auto-fix simple lint issues.
- Use `npm run typecheck` for vue-tsc validation.
- Start the Nuxt dev server before launching Playwright tests.
- Build artifacts are generated in `dist/` for static hosting.
