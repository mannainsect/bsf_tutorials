# Repository Guidelines

## Project Structure & Module Organization
Nuxt + Ionic code resides in `app/` with feature folders (`components/`, `pages/`, `stores/`, `composables/`). Shared contracts live in `shared/types/`; static assets in `public/`; docs in `docs/`. Tests sit in `tests/` (`unit/`, `e2e/`, `fixtures/`, `setup/`). Generated directories (`dist/`, `.output/`, `playwright-report/`) are disposable and must stay untouched.

## Build, Test, and Development Commands
- `npm run dev`: Serve at `http://localhost:3000` with hot reload.
- `npm run build`: Compile production output to `.output/`.
- `npm run generate`: Create a static export for previews.
- `npm run lint` / `lint:fix`: Check or auto-fix ESLint across `.vue`/`.ts`.
- `npm run format:check` → `format`: Enforce Prettier before commits.
- `npm run typecheck`: Run `vue-tsc` for typings.
- `npm run test`, `test:coverage`: Execute Vitest suites.
- `npm run test:e2e` (`:headed`, `:ui`) for Playwright.

## Coding Style & Naming Conventions
Prettier (2-space indent, single quotes, 100-char wrap, no semicolons) and ESLint gate merges. Vue components use PascalCase (`UserMenu.vue`); composables use `useThing`; Pinia stores use `useThingStore.ts`. Favor `<script setup>`, declare props/types first, and order imports framework → shared → local.

## Testing Guidelines
Keep unit specs in `tests/unit/` or `app/tests/` for component logic. Model flows in `tests/e2e/`, sharing helpers from `tests/setup/`. Run `npm run test:coverage` before PRs and add Playwright evidence when UI changes.

## Commit & Pull Request Guidelines
Commits stay short and imperative ("Update commands"). Keep subjects under 60 characters, add bodies for behavior changes, and reference issues with `Fixes #id`. PRs summarize intent, note validation commands, include visuals for UI updates, ping relevant reviewers, and confirm `lint`, `test`, `test:e2e` all pass.

## Git & GitHub CLI Workflow
- Sync: `git fetch origin main && git rebase origin/main` or `gh repo sync` before branching.
- Branch: `git switch -c feature/slug`, then `git push -u origin feature/slug`.
- Issues: `gh issue list --label auth`, inspect with `gh issue view <id>`, create via `gh issue create --title "..."`.
- Pull requests: `gh pr create --base main --fill`, adjust metadata with `gh pr edit <id>`, track via `gh pr status`.
- Feedback: use `gh pr review --approve|--request-changes`, follow up through `gh pr comment <id> --body "..."`, and fetch work with `gh pr checkout <id>`.

## Environment & Configuration
Copy `.env.example` to `.env` for local secrets. Maintain translations in `i18n/` and confirm builds with `npm run generate`. Capacitor settings live in `capacitor.config.ts`; keep mobile assets synced under `app/assets/`.
