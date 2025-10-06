# BSF App Starter Template

A production-ready Nuxt 4 + Ionic starter focused on authentication,
account management, and multi-language support.

## Installation

### Requirements

- Node.js 18+
- npm

### Setup Steps

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `NUXT_PUBLIC_API_BASE_URL`.
4. Run the development server with `npm run dev` (http://localhost:3000).

## Core Features

### Authentication & Session Handling

- Email/password and passwordless login flows.
- Email verification with automatic and manual token entry.
- Centralized profile bootstrap to ensure session state before rendering.
- Automatic company selection when no active company is set.

### Account Management

- Edit personal information, password, and preferences.
- Company management for administrators and managers (name, address,
  timezone, business ID).
- Credits and metrics overview with cached profile data.

### Help System

- Contextual help icon accessible across pages.
- Modal topics: getting started overview, profile settings, account
  security.
- Fully localized content across English, Spanish, French, Portuguese,
  and German.

### Infrastructure Highlights

- Ionic components with automatic public/private layout switching.
- Metrics, logging, and credit systems preserved.
- Comprehensive validation utilities for account flows.
- PWA support and static generation ready for deployment.

## Testing & Quality

- `npm run lint` – ESLint checks (fails on existing legacy warnings).
- `npm run test` – Vitest unit suite.
- `npm run build` – Production build validation.
- `npm run test:e2e` – Playwright specs (requires running `npm run dev`
  in a separate terminal first).

## Architecture Notes

- Auth store (`app/stores/auth.ts`) manages profile caching,
  concurrency control, and permission hydration.
- `useUserRole` exposes synchronous permission helpers sourced from
  cached profile state.
- `useHelp` and `useHelpTopic` coordinate contextual help topics
  across routes.
- Localization managed through `@nuxtjs/i18n` with translations stored
  in `i18n/locales`.

## Directory Overview

```
app/               # Nuxt application source
  components/      # Shared Ionic components
  composables/     # Authentication, profile, help, and utility hooks
  pages/           # Public and private Vue pages
  stores/          # Pinia stores (auth, metrics, etc.)
docs/              # Reference material and internal plans
  CONTENT_GUIDANCE.md  # Content & Products API documentation
  PRD.md              # Product requirements and architecture guide
shared/types/      # TypeScript type definitions
  api/             # API request/response types
tests/             # Unit and E2E tests (Vitest + Playwright)
```

## API Documentation

For detailed API endpoint specifications and usage examples:

- `docs/CONTENT_GUIDANCE.md` – Complete Content & Products API reference
  including content, playlists, tools, and purchasing workflows.
- TypeScript types available in `shared/types/api/content.types.ts`.

## Development Tips

- Run `npm run lint -- --fix` to auto-fix simple lint issues.
- Use `npm run typecheck` for vue-tsc validation.
- Start the Nuxt dev server before launching Playwright tests.
- Build artifacts are generated in `dist/` for static hosting.
