# Important additional project rules

## Layout rules

- Never create header or footer inside a page.
- Public and private layouts own header, footer, and menu.
- Never create `ion-page` or `ion-content` inside a page.
- Use the public/private layouts as the app shell.

## Page rules (for new work)

- Pages are route entry points, not feature implementations.
- Pages should compose feature composables and components,
  then render them.
- Do not keep adding logic to a page once it mixes fetching,
  permissions, submission, formatting, modal control, and
  navigation.
- If a page is growing large, extract feature code before
  adding more behavior.
- Keep new pages under roughly 300-400 lines. Existing large
  pages are tech debt, not a template for new work.

## Data access rules

- Do not instantiate repositories inside pages.
- Do not call `$fetch` directly from pages or UI components.
- Route network access through the API layer:
  `useApi()` -> repository -> composable/service ->
  page/component.
- Repositories own transport details and endpoint wiring.
- Composables and services own feature logic, orchestration,
  caching, permission checks, and error mapping.

## Feature organization

- `app/features/<feature>/` is the standard for feature-
  specific modules. New feature-specific logic that is not
  globally shared should be placed here.
- Keep `app/composables/` for shared cross-feature utilities
  and established shared composables.
- Do not create new flat top-level files that hide feature
  ownership when the code clearly belongs to a specific
  feature area.

## Nuxt client/server rules

- Public pages must stay safe for SSR/SSG/prerendering
  (`npm run generate` is the production build for Netlify).
- Authenticated app behavior is client-hydrated.
- Any use of `window`, `document`, `localStorage`, or
  `navigator` must be guarded with `import.meta.client` or
  isolated to explicit client-only code paths.
- Do not introduce server-side auth assumptions into private
  route code unless the architecture is intentionally changed.

## General implementation rules

- Use Ionic components for UI elements.
- All user-facing text must use i18n via `$t()`.
- Always use `localePath()` for navigation.
- Do not hardcode locale-less paths.
- Prefer extending existing modules over creating duplicates.
- If a composable needs `onMounted` or `onUnmounted`, it must
  be intended for use inside component setup. Pure business
  logic composables should prefer explicit methods over hidden
  lifecycle coupling.

## Code style

- Line length: 100 characters for code, 80 for markdown.
- Indentation: 2 spaces.
- Quotes: single quotes.
- Semicolons: none (Prettier-enforced).
- Components: PascalCase (e.g., `UserMenu.vue`).
- Composables: `useThing` (e.g., `useAuth.ts`).
- Stores: `useThingStore.ts` (e.g., `useAuthStore.ts`).
- Repositories: `XRepository.ts` suffix.
- Services: `XService.ts` suffix.
- Prefer `<script setup>`; declare props/types first; order
  imports framework -> shared -> local.
- TypeScript strict mode; avoid `any` without justification.

## Reference projects

- `~/dev/bsf_market/main/` is the **golden reference**: same
  stack (Nuxt 4 + Vue 3 + Ionic + Capacitor + TS), further
  along, used as the canonical pattern source for auth,
  modularity, tests, layouts, repositories, and architecture
  decisions.
- When unsure how to structure something, consult that
  project first before inventing a new pattern.
- See its `CLAUDE.md`, `docs/PRD.md`, and `app/features/`
  layout for established patterns.

## External backend

- Manna Cloud REST API at `https://manna-cloud-api.onrender.com`.
- Bearer token in `Authorization` header.
- Endpoint roots configured in `nuxt.config.ts`.
- Request plumbing in `useApi`; contracts in `shared/types/`.

## Git and GitHub CLI Workflow

Use git and gh CLI tools for all GitHub operations:

### Getting repository information

```bash
git remote -v  # Get repo URL, extract owner/repo name
gh repo view   # View current repository details
gh auth status # Check authentication status
```

### Working with issues

```bash
gh issue view <number>              # Read issue details
gh issue view <number> --comments   # Read with all comments
gh issue list                       # List all issues
gh issue create --title "..." --body "..."  # Create new issue
gh issue edit <number> --title "..." --body "..."  # Update
gh issue comment <number> --body "..."  # Add comment to issue
gh issue close <number>             # Close issue
```

### Working with pull requests

```bash
gh pr create --title "..." --body "..."  # Create PR
gh pr view <number>                 # View PR details
gh pr view <number> --comments      # View PR with comments
gh pr list                          # List all PRs
gh pr comment <number> --body "..." # Add comment to PR
gh pr review <number>               # Review PR
gh pr checks                        # View PR check status
gh pr merge <number>                # Merge PR
```

### Common git operations

```bash
git status                          # Check working tree status
git branch                          # List branches
git branch --show-current           # Show current branch name
git checkout -b <branch-name>       # Create and switch to branch
git add .                           # Stage all changes
git commit -m "message"             # Commit with message
git push -u origin <branch>         # Push branch to remote
git log --oneline --grep="keyword"  # Search commit history
```
