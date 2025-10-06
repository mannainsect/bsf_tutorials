# BSF App Developer Guide

## 1. Executive Summary

### Core Technology Stack

| Layer      | Technology          | Purpose                         |
| ---------- | ------------------- | ------------------------------- |
| Framework  | Nuxt 4              | SSR/SSG with auto-imports       |
| UI         | Vue 3 + Ionic       | Cross-platform components       |
| Types      | TypeScript          | Strict type safety              |
| State      | Pinia               | Reactive state management       |
| Validation | Vee-Validate + Zod  | Schema-based validation         |
| Testing    | Vitest + Playwright | Unit and E2E testing            |
| i18n       | Nuxt I18n           | Multi-language (EN/ES/FR/PT/DE) |
| Mobile     | Capacitor           | Native packaging readiness      |

### Architecture Philosophy

- Single-responsibility modules
- Type-safe data flows end-to-end
- Repository and service layers for clean separation
- Composable-first reactive logic
- Mobile-friendly Ionic component system

## 2. Project Structure

```
app/
  components/
    auth/            # Authentication forms and flows
    layout/          # Headers, menus, navigation
    ui/              # Shared Ionic building blocks
    help/            # Help modal and triggers
  composables/       # Stateful logic (auth, help, profile, metrics)
    api/             # Repository + service layers
  middleware/        # Guarded routing (auth, guest)
  pages/             # File-based routes
  stores/            # Pinia stores (auth, metrics, etc.)
shared/types/        # API + domain type definitions
  api/               # API request/response types
    content.types.ts # Content & Products API types
tests/               # Vitest + Playwright suites
i18n/locales/        # Translation JSON
docs/                # Documentation
  CONTENT_GUIDANCE.md # Content & Products API reference
  PRD.md             # This file
```

### Naming Conventions

| Type           | Pattern           | Example               |
| -------------- | ----------------- | --------------------- |
| Component      | PascalCase        | `AccountOverview.vue` |
| Composable     | use prefix        | `useHelp.ts`          |
| Store          | use prefix        | `useAuthStore.ts`     |
| Repository     | Repository suffix | `UserRepository.ts`   |
| Service        | Service suffix    | `AuthService.ts`      |
| Type/Interface | PascalCase        | `User`, `ApiResponse` |

## 3. Development Rules

### Layout System

- Layout is assigned automatically via middleware based on auth state.
- Do **not** add headers/footers inside pages; layouts handle the shell.
- Pages should render Ionic components inside a simple `<div>` wrapper.

### Navigation & i18n

- Always use `localePath()` for navigation.
- Example: `router.push(localePath('/account'))`.
- Use `$t()` for every user-facing string.

### Component & State Patterns

- Emit events from components; business logic lives in
  composables/stores.
- Use `useIcons()` for all Ionicons.
- Stores should expose readonly state, derived computed values, and
  cache timestamps.
- Authentication store controls profile hydration and automatic
  company selection.

### Validation & Error Handling

- Form schemas live in `app/utils/validation` using Zod.
- Vee-Validate manages form state and error presentation.
- API errors funnel through repository helpers; handle 401/422/500 explicitly.

## 4. Help System

- Topics defined in `useHelpTopic` mapping routes → topic keys.
- Active topics: getting started, profile settings, account security.
- `useHelp` handles modal lifecycle, performance logging, and
  accessibility.
- Help content lives in translation files under `help.topics.*`.

## 5. Testing Guidelines

- `npm run lint` – ESLint (fails on legacy warnings; fix as touched).
- `npm run test` – Vitest suites for auth, help, stores, validation,
  and utilities.
- `npm run build` – Verify Nuxt production output.
- `npm run test:e2e` – Playwright specs (start `npm run dev` first).

### Unit Test Focus Areas

- Auth store bootstrap and caching
- Help modal behavior and topic resolution
- Validation schemas for account flows
- Utility composables (`useUserRole`, `useCurrencyExchange`,
  etc.)

## 6. Content & Products API

The application integrates with a backend Content & Products API for
learning materials, playlists, and tools. See
`docs/CONTENT_GUIDANCE.md` for complete endpoint documentation.

### Key Features

- Public content catalogue for anonymous users
- Authenticated content with ownership tracking
- Playlists with embedded content and tools
- Credit-based purchasing system
- Video content with Vimeo player URLs

### TypeScript Integration

- Type definitions in `shared/types/api/content.types.ts`
- Exported via `shared/types/index.ts` for application-wide use
- Includes request/response types for all CRUD operations

### API Endpoints (configured in `nuxt.config.ts`)

- `/products/content` – Video and document content
- `/products/playlists` – Curated learning paths
- `/products/tools` – Premium tools and features
- `/products/purchase` – Credit-based purchasing

## 7. Deployment Notes

- Static generation via `npm run build` outputs to `dist/`.
- PWA service worker generated automatically (workbox warnings
  expected when payload files are absent).
- Environment configuration handled by `.env` variables prefixed with
  `NUXT_PUBLIC_`.

---

Use this guide as the authoritative reference when extending
authentication or account-related features. Remove or refactor any
legacy marketplace references encountered during future development.
