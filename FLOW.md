# FLOW.md - Project Workflow Configuration

This file provides guidance to Claude Code (claude.ai/code) when
working with code in this repository.

---

## 1. Project Description

**Project Name**: BSF Tutorials

**Purpose**: Easy-to-use PWA and mobile application that lets users
register, log in, and consume tutorial videos to learn the Black
Soldier Fly (BSF) business and production. Backed by Manna's cloud
REST API platform. Public landing pages must be SEO-friendly and
SSG-rendered.

**Tech Stack**:

- Stack Type: frontend
- Primary Language: TypeScript
- Framework: Nuxt 4 (Vue 3) + Ionic + Capacitor
- Database: None (frontend only; external REST API at
  `https://manna-cloud-api.onrender.com`)
- Key Dependencies: Vue 3, Ionic, Pinia, Vee-Validate, Zod, Vitest,
  Playwright, Nuxt I18n, Capacitor, VueUse

**Repository Structure**:

```
bsf_tutorials/
├── app/                # Application source
│   ├── components/    # Vue components (PascalCase, feature-based)
│   ├── composables/   # Shared business logic & state hooks
│   ├── features/      # Feature-specific modules (preferred for
│   │                  #   non-shared logic; create as needed)
│   ├── layouts/       # Public/private layout shells
│   ├── middleware/    # Route guards (auth, guest)
│   ├── pages/         # File-based routing (entry points only)
│   ├── plugins/       # Nuxt plugins
│   ├── stores/        # Pinia stores (useXStore.ts)
│   ├── tests/         # Co-located component tests (optional)
│   └── utils/         # Helper utilities
├── server/             # Nitro server routes (minimal use)
├── shared/types/       # TypeScript contracts (incl. API types)
├── i18n/               # Locale files
├── tests/              # Test infrastructure
│   ├── unit/          # Vitest specs (mirrors app/ structure)
│   ├── e2e/           # Playwright specs
│   ├── fixtures/      # Test data
│   ├── mocks/         # Test mocks
│   └── setup/         # Test setup files
├── docs/               # Project documentation (PRD.md, etc.)
├── public/             # Static assets
├── scripts/            # Project scripts
├── dist/               # Static build output (Netlify publish)
└── .output/            # Nuxt build artefacts (gitignored)
```

### Critical Directories

**Project Documentation**:

- **Location**: `docs/`
- **Purpose**: PRD, architecture docs, feature specs
- **Used by**: `/sw:analyse-issue`, `/sw:implement-issue`, all
  coding commands
- **Contains**: `PRD.md` (product guide, architecture, API surface)

**Test Directory**:

- **Location**: `tests/`
- **Purpose**: Test files and test infrastructure
- **Used by**: All implementation and review commands
- **Structure**: Organized by type
  - `unit/` mirrors `app/` structure
    (composables, components, stores, api, utils, types)
  - `e2e/` contains Playwright end-to-end specs
  - `fixtures/`, `mocks/`, `setup/` for shared test infra
  - Focus on business logic, not UI implementation details
- **Naming**: `*.test.ts` for unit, `*.spec.ts` for e2e

**Application/Code Directory**:

- **Location**: `app/`
- **Purpose**: Main application source code
- **Used by**: All coding commands
- **Structure**: Standard Nuxt 4 layout (components, composables,
  layouts, middleware, pages, plugins, stores, utils). Feature-
  specific code that is not globally shared belongs in
  `app/features/<feature>/` (create directory when adopting first
  feature module).
- **Important**: `app/pages/` contains route entry points only.
  Pages must not own feature logic, fetching, or `$fetch` calls.
  See CLAUDE.md for full architecture rules.

**Temporary Files**:

- **Location**: `/tmp/` (system temp)
- **Purpose**: Temporary downloads, attachments, intermediate
  processing
- **Used by**: `/sw:analyse-issue` (for attachments), various
  commands
- **Cleanup**: Automatically cleared by system, not committed

**Build/Generated Files**:

- **Location**: `dist/` (Netlify static publish), `.output/`
  (Nuxt build), `.nuxt/` (dev cache), `playwright-report/`,
  `test-results/`, `coverage/`
- **Purpose**: Compiled artifacts and reports (gitignored)
- **Used by**: Build, deploy, and test reporting workflows
- **Note**: Never modify generated files manually

## 2. General Guidance for Commands and Agents

### Workflow Execution Principles

- **Read First**: Always read this FLOW.md before executing tasks
- **Consult Golden Reference**: When unsure about a pattern,
  consult `~/dev/bsf_market/main/` first — same stack, further
  along, established conventions for auth, repositories, layouts,
  and modularity
- **Context Chaining**: Each command receives output from previous
  step only
- **Stateless Operations**: Commands should not assume shared
  context
- **Structured Output**: Produce clear, parseable output for next
  step
- **Error Handling**: Fail gracefully with informative messages

### Command Execution Guidelines

1. **Understand the Task**: Parse the input from previous step
2. **Gather Context**: Read relevant reference documents
3. **Check Architecture Boundaries**: Identify the page entry
   point, feature module boundary, and API boundary before coding
   (see CLAUDE.md)
4. **Execute Atomically**: Complete one well-defined task
5. **Report Results**: Provide structured output with file:line
   references
6. **Track Costs**: Report token usage when applicable

### Sub-Agent Delegation

When delegating to sub-agents:

- **Filter Information**: Share only relevant sections from this
  file
- **Specify Scope**: Clearly define the sub-task boundaries
- **Provide Context**: Include necessary tech stack details
- **Set Constraints**: Pass along relevant rules and standards

## 3. Rules to Adhere

### Code Quality Standards

**From CLAUDE.md (full ruleset is authoritative there):**

- **Line Length**: 100 characters for code (TS/Vue/HTML/JS),
  80 for markdown
- **Indentation**: 2 spaces
- **Quotes**: single quotes
- **Semicolons**: none (Prettier-enforced)
- **Naming Conventions**:
  - Components: PascalCase (e.g., `AuthLoginForm.vue`)
  - Composables: `use` prefix, camelCase (e.g., `useAuth.ts`)
  - Stores: `use` prefix, camelCase
    (e.g., `useAuthStore.ts`)
  - Repositories: `Repository` suffix
    (e.g., `UserRepository.ts`)
  - Services: `Service` suffix (e.g., `AuthService.ts`)
- **Documentation**: No comments unless explicitly requested
- **Type Safety**: TypeScript strict mode required

**Critical Constraints (from CLAUDE.md):**

- Never create headers or footers inside pages (handled by
  layouts)
- Never use `ion-page` or `ion-content` in pages
- Pages are route entry points, not feature buckets
- Do not instantiate repositories or use `$fetch` in pages
- Guard browser APIs with `import.meta.client` in shared code
- Always use Ionic components for UI elements
- All text must use i18n translations (`$t()`)
- Always use `localePath()` for navigation
- Never hardcode paths without locale prefix
- Public pages must remain SSR/SSG safe; authenticated routes
  are client-hydrated

See CLAUDE.md for the complete rule set including page size
guidance, data access rules, and Nuxt client/server rules.

### Testing Requirements

- **Test Framework**: Vitest (unit), Playwright (e2e)
- **Coverage Target**: Not enforced globally; aim for meaningful
  coverage on composables, stores, repositories, and utils.
  Critical user flows covered by Playwright e2e.
- **Test Location**: `tests/` directory
  - Unit: `tests/unit/` (mirrors `app/` structure)
  - E2E: `tests/e2e/`
- **Test Naming**: `*.test.ts` for unit, `*.spec.ts` for e2e
- **Run Commands**:
  - Unit: `npm test` (or `./safe-test-runner.sh unit`)
  - Coverage: `npm run test:coverage`
  - E2E: `npm run test:e2e`
    (or `./safe-test-runner.sh e2e`)
- **Philosophy**: Test business logic and behavior, not UI
  implementation details. Focus on composables, repositories,
  stores, and utilities.

### Testing Strategy for Agents

**Local Agent Testing (targeted only)**:
Agents run ONLY targeted tests for changed/new files locally.
The GitHub PR CI/CD pipeline is the authoritative gate for full
test suite execution.

- **Targeted unit test**:
  `npx vitest run path/to/file.test.ts --pool=forks
--maxWorkers=1`
- **Targeted e2e test**:
  `npx playwright test path/to/file.spec.ts`
- **Resource-safe flags**:
  `--pool=forks --maxWorkers=1` (Vitest);
  default workers for Playwright
- **Format check command**:
  `npm run format:check`
  (or `npx prettier --check <file>`)
- **Lint check command**:
  `npm run lint`
  (or `npx eslint <file>`)
- **Type check command**:
  `npm run typecheck` (`vue-tsc --noEmit`)
- **Build command**:
  `npm run build`
  (or `npm run generate` for static export)

**CI/CD Full Suite (authoritative gate)**:
CI/CD runs the full unit suite plus lint and format on every PR.
Agents do NOT duplicate this locally.

- **CI platform**: GitHub Actions
- **CI commands**:
  - Lint: `npm run lint -- --max-warnings 153`
  - Format: `npm run format:check`
  - Typecheck: `npm run typecheck`
  - Tests: `npx vitest run --no-coverage`
- **CI workflow file**: `.github/workflows/ci.yml`
- **Required CI checks**: `lint`, `format`, `typecheck`, `test`
- **Note**: Playwright e2e tests do NOT run in CI; they are
  manual/local only.

**Test file discovery pattern**:
How to find the test file for a given source file:

- `app/composables/useFoo.ts` ->
  `tests/unit/composables/useFoo.test.ts`
- `app/stores/useFooStore.ts` ->
  `tests/unit/stores/useFooStore.test.ts`
- `app/utils/bar.ts` -> `tests/unit/utils/bar.test.ts`
- `app/components/Foo.vue` ->
  `tests/unit/components/Foo.test.ts`
- Page or user flow -> `tests/e2e/<flow>.spec.ts`

**What agents should NOT run**:

- Full test suite (CI/CD handles unit; e2e is manual)
- Playwright e2e (local/manual only, not in CI)
- Performance/load tests
- Tests requiring external services not available locally

### Version Control Practices

- **Branch Naming**: `feature/*`, `fix/*`, `chore/*`, `docs/*`
- **Commit Messages**: Conventional Commits format
- **PR Requirements**: No direct commits to main; PR required;
  all CI checks must pass before merge
- **Default Branch**: `main`
- **Pre-commit**: Husky runs linting and formatting on staged
  files

### Project-Specific Constraints

See CLAUDE.md for the comprehensive rule set. Key constraints:

- Never modify generated files in `dist/`, `.output/`, `.nuxt/`
- Never create duplicate files or backup copies
- All markdown files must have max 80 characters per line
- Always prefer refactoring existing files over creating new
  ones — but extract into a feature module when a page or file
  is already too large
- No rollback features or backward compatibility unless
  explicitly required
- Public pages must remain SSR/SSG safe
  (`npm run generate` build); authenticated routes are
  client-hydrated
- Commits cannot be made until linting and formatting pass
  (Husky)
- Merge cannot be completed until all CI checks pass

## 4. Reference Documents

### Required Reading (Always Consult)

1. **FLOW.md** (this file)
   - Location: `./FLOW.md`
   - Purpose: Central workflow and project configuration
   - When to read: Before every command execution

2. **CLAUDE.md** (mirrored to `AGENTS.md`)
   - Location: `./CLAUDE.md`
   - Purpose: Core development rules, architecture constraints,
     code style, and git workflow
   - When to read: For all implementation tasks

3. **docs/PRD.md**
   - Location: `./docs/PRD.md`
   - Purpose: Product guide with audiences, journeys,
     architecture, API surface, and component conventions
   - When to read: For feature development, architecture
     decisions, and understanding project structure

4. **Golden Reference Project**
   - Location: `~/dev/bsf_market/main/`
   - Purpose: Same stack (Nuxt 4 + Vue 3 + Ionic + Capacitor +
     TS), further along; canonical source for established
     patterns (auth, repositories, services, layouts, feature
     modularity, test structure)
   - When to read: Before inventing a new pattern; when unsure
     how to structure auth, API access, modules, or tests
   - Key files in golden:
     - `CLAUDE.md` — full architecture rules
     - `FLOW.md` — workflow reference
     - `docs/PRD.md` — comprehensive developer guide
     - `app/features/` — feature module layout
     - `app/composables/`, `app/stores/` — naming patterns

### Optional Reading (Context-Dependent)

- **README.md**: User-facing documentation and setup
- **package.json**: Scripts and dependencies
- **nuxt.config.ts**: Module configuration and endpoint roots
- **vitest.config.mjs**, **playwright.config.ts**: Test config
- **netlify.toml**: Deployment configuration

### How to Read Documents

When sub-agents need guidance:

1. Read FLOW.md sections relevant to the task
2. Extract applicable rules and tech stack info
3. Include in sub-agent prompt with clear scope
4. Avoid passing entire documents unless necessary
5. If pattern is unclear, point sub-agent at golden reference
   path with the specific file to consult

### Command Reading Requirements

**Software Development Commands** (need Section 3 + 5 + 6):

- `/sw:analyse-issue`: Read Sections 3, 6 (Issue Template)
- `/sw:implement-issue`: Read Sections 1, 3, 5, 6
- `/sw:continue-implementation`: Read Sections 1, 3, 5, 6
- `/sw:coder-simple`: Read Sections 1, 3, 5
- `/sw:pull-request-review`: Read Sections 3, 5, 6
- `/sw:create-issue`: Read Sections 1, 3, 6

**Utility Commands**:

- `/utils:init-flow`: Reads FLOW.md template itself
- `/utils:update-flow`: No FLOW.md reading needed

**Status Commands** (no FLOW.md needed):

- `/sw:pull-request-check`: Uses GitHub API only
- `/sw:pull-request-merge`: Uses git/gh CLI only

## 5. Installed Tools and Capabilities

### Version Control

**Git** (Required)

- Purpose: Source control operations
- Common commands:
  ```bash
  git status              # Check repository state
  git branch              # List/manage branches
  git log --oneline       # View commit history
  git diff                # View changes
  ```

**GitHub CLI** (gh)

- Purpose: GitHub API interactions
- Authentication: Assumes `gh auth login` completed
- Common commands:
  ```bash
  gh issue view <num>     # View issue details
  gh pr create            # Create pull request
  gh pr view <num>        # View PR details
  gh repo view            # View repository info
  ```

### Language-Specific Tools

**JavaScript/TypeScript Tooling**:

- npm: Package management
- eslint (`@nuxt/eslint-config`,
  `@typescript-eslint/*`): Linting
- prettier: Code formatting (printWidth 100, single quotes,
  no semicolons)
- vue-tsc: TypeScript compiler for `.vue` files
- vitest: Unit testing framework
- playwright: E2E testing framework
- husky: Git hooks (pre-commit lint + format)

### CI/CD Integration

- **Platform**: GitHub Actions
- **Workflow**: `.github/workflows/ci.yml`
- **Required Checks**: lint, format, typecheck, vitest unit tests
- **Enforcement**: Pre-commit hooks via Husky; all checks must
  pass before merge
- **Deploy**: Netlify (`netlify.toml`); build command
  `npm run generate`; publish dir `dist/`

## 6. Workflow-Specific Guidance

This section provides detailed guidance for slash commands.
Commands should read these subsections to find templates,
validation rules, and workflow patterns.

### Issue Documentation Template

**Required for**: `/sw:analyse-issue`

When creating or updating GitHub issues, use this structure:

**Issue Title Format:**

```
[TYPE]: Concise summary (READY)
```

**Required Sections:**

1. **🎯 Objective**
   - Outcome: What the user gains and where it appears
   - Success metric: Observable behaviour proving success
   - Scope boundaries: Explicitly list what is in/out

2. **🧠 Implementation Philosophy**
   - Scope discipline (no feature creep)
   - Documentation posture (what to update/preserve)
   - Testing focus (appropriate coverage)
   - Pattern consistency (files/components to mimic;
     reference golden project when relevant)
   - When to ask questions vs guess

3. **📋 Prerequisites**
   - Confirm upstream APIs/dependencies exist
   - Design assets or specs to review
   - Tooling/runtime version requirements

4. **✅ Before You Start**
   - First 3-5 concrete actions implementer must take
   - Commands to run, routes to test, files to review

5. **🚫 Out of Scope — DO NOT**
   - Forbidden changes or files to avoid
   - Excluded locales, platforms, or flows
   - "Stop and ask" guidance for unclear cases

6. **⚠️ Common Pitfalls**
   - Frequent mistakes with brief context
   - Translation requirements, error handling issues

7. **🔍 Current State**
   - Summary of current behaviour
   - **file:line references**
     (e.g., `app/composables/useAuth.ts:142-158`)
   - Known pain points

8. **🗺️ Impact Map**

   ```
   | Area | Change | Notes |
   |------|--------|-------|
   | file/subsystem | Create/Modify/Remove | Why + linkage |
   ```

9. **🛠️ Implementation Tasks**
   - Break into milestone-sized blocks
   - Each task specifies:
     - **Files**: `path/to/file.ts`
     - **Implementation**: Step-by-step with patterns
     - **Validation**: How to prove success (tests/screenshots)

10. **📏 Acceptance Criteria**
    - Pass/fail language (Given/When/Then or bullets)
    - Measurable outcomes, no ambiguity

11. **🧪 Validation Strategy**
    - **Automated**: Test examples with file:line refs
    - **Coverage targets**: Realistic per layer (composables /
      stores / repositories higher; UI lower)
    - **Manual**: Step-by-step scenarios with expected results
    - **Test data**: Concrete fixtures/payloads implementer can
      use

12. **🧰 Commands to Run Before PR**

    ```bash
    npm run lint
    npm run format:check
    npm run typecheck
    npm test
    npm run build
    ```

13. **🔍 Code Review Expectations**
    - What reviewers focus on (scope, patterns, quality)
    - Non-negotiables causing rejection

14. **✅ Completion Checklist**
    - Mirrors definition of done
    - Copy/paste into PR for self-certification

15. **📚 Why These Choices?**
    - Architectural rationale and trade-offs
    - Why specific patterns/components required
    - Reference golden project precedent if applicable

16. **📚 Reference Material**
    - Design/API links with versions
    - Comparable implementations with file:line refs (incl.
      `~/dev/bsf_market/main/` paths when reused)
    - Data samples or dashboards

17. **❓ Questions**
    - Who to ask + preferred channel
    - Clarification etiquette and response SLA

**Optional Section (if API integration involved):** 18. **🔌 Backend Integration**: Manna Cloud API endpoints, data
models, auth requirements (Bearer token)

**Quality Requirements:**

- Character budget: ≤15k (ideal ≤12k)
- **Precise file:line references** for all code mentions
- **Concrete test code examples** (not vague descriptions)
- **Realistic coverage targets** (no aggressive 95%+ without
  justification)
- **No content repetition** between sections
- **Test data provided** (mock objects, API payloads)
- **Explicit i18n keys** if applicable
- **Focus on implementation playbook** (not PM overhead)

**Quality Rubric (Pass/Needs Work):**

- ✓ Clarity: Mid-level dev can start without extra context
- ✓ Completeness: All sections filled with actionable info
- ✓ Decisions: Architecture/product decisions documented
- ✓ Verifiability: Objective pass/fail checks in criteria
- ✓ Concrete Examples: Actual test code (not descriptions)
- ✓ Precise References: file:line format used consistently
- ✓ Realistic Targets: Achievable coverage goals
- ✓ Test Data Provided: Copy-pasteable fixtures
- ✓ No Repetition: Each section adds unique value
- ✓ Implementation Focus: Support contacts without excessive
  meetings

### Issue Analysis Workflow

**Required for**: `/sw:analyse-issue`, `/sw:create-issue`

When analyzing issues:

1. Read issue description and all comments
2. Check for attachments (download if needed)
3. Reference related issues/PRs if mentioned
4. Verify against project constraints in Section 3
5. Extract code quality standards and testing requirements
6. Apply issue template structure from above
7. Output structured analysis with file:line references

**Multi-Perspective Analysis** (for `/sw:analyse-issue`):

- Collect three Spec Cards in parallel:
  - **Quick Win** (minimal path, reuse, effort estimate)
  - **Quality** (patterns, cleanup, abstractions; cite golden
    project precedents)
  - **Risk** (breakage points, edge cases, tests)
- Synthesize balanced approach
- Add validation strategy from test-driven-engineer
- Check API integration needs (Manna Cloud)
- Check frontend integration needs (Ionic, layouts, i18n)
- Evaluate with codex-issue-evaluator
- Refine based on feedback if needed

### Implementation Workflow

**Required for**: `/sw:implement-issue`,
`/sw:continue-implementation`, `/sw:coder-simple`

When implementing features:

1. Read issue documentation completely
2. Extract code quality standards (Section 3 + CLAUDE.md)
3. Extract testing strategy (Section 3: Testing Strategy for
   Agents) — this tells agents which commands to use, how to
   find test files, and what NOT to run
4. Consult golden project for established pattern when adding
   auth, repositories, services, layouts, or new feature
   modules
5. Create feature branch following naming convention
6. Implement following all coding rules:
   - Line length (100 code / 80 markdown)
   - Naming conventions (Section 3)
   - Type safety (TypeScript strict)
   - No comments unless requested
   - All architecture rules from CLAUDE.md
7. Write tests according to testing requirements (Section 3)
8. Run ONLY targeted validation locally:
   - Format check (changed files)
   - Lint check (changed files)
   - Type check
   - Build validation
   - **Targeted tests only** (changed/new files; NOT full suite)
9. Verify targeted quality gates pass
10. Create PR — CI/CD runs the full test suite automatically

**Quality Gates Before PR (targeted only):**

- [ ] Code formatted (changed files)
      — `npx prettier --check <files>`
- [ ] No lint errors (changed files) — `npx eslint <files>`
- [ ] Type checks pass — `npm run typecheck`
- [ ] Build succeeds — `npm run build` or `npm run generate`
- [ ] Targeted unit tests pass — `npx vitest run <file> --pool=forks --maxWorkers=1`
- [ ] Manual e2e check if user-facing flow changed —
      `npx playwright test <file>`
- NOTE: Full unit suite runs in CI/CD on PR creation;
  e2e is local/manual only

**Implementation State Recovery:**
For `/sw:continue-implementation`, assess:

- What was completed vs attempted
- Which quality gates failed
- Which tests are failing and why
- Continue from last successful step

### Review Workflow

**Required for**: `/sw:pull-request-review`

When reviewing PRs:

1. Check all PR comments and requested changes
2. Verify code follows quality standards (Section 3 + CLAUDE.md)
3. Verify architecture rules from CLAUDE.md
   (no `$fetch` in pages, no `ion-page` in pages, etc.)
4. Run tests locally if applicable
5. Address each comment individually:
   - Quote the review comment
   - Explain your fix
   - Reference file:line of changes
6. Re-run all pre-PR quality gates (see Implementation Workflow)
7. Push fixes to same branch
8. Reply to review comments on GitHub

## 7. Cost and Performance Considerations

### Token Budget Awareness

- **Prefer Targeted Reads**: Use grep/search before full file
  reads
- **Avoid Redundant Operations**: Cache context when possible
- **Batch Operations**: Combine related tasks in single
  execution
- **Report Costs**: Always report token usage for LLM operations

### Performance Optimization

- Lazy-load route-level components where possible
- Use `v-memo` and `KeepAlive` for expensive renders
- Cache API responses in stores/composables when appropriate
- Public pages must remain prerender-friendly
- Bundle splitting handled by Nuxt; avoid blocking imports
  in critical paths

## 8. Emergency Procedures

### When Things Go Wrong

**Workflow Interruption** (Ctrl+C):

- State is saved in FlowState
- Resume using continuation commands if available
- Check last output in terminal for context

**Command Failures**:

- Review error output carefully
- Check if reference documents changed
- Verify tool availability and authentication
- Report issue with full context if bug suspected

**Merge Conflicts**:

- Each change goes to a new issue branch, then to a pull
  request
- Resolve conflicts during PR merge process
- Test locally before pushing resolution
- All CI checks must pass after conflict resolution

**Failed CI Checks**:

- Commits cannot be made until linting passes (Husky
  pre-commit)
- Merge cannot be completed until all CI checks pass
- Fix issues locally, verify with local commands, then push
- Review CI logs to identify root cause

## 9. Custom Workflow Extensions

### Adding New Workflows

To add project-specific workflows:

1. Define workflow in `flow.py` or custom script
2. Create corresponding slash commands in `.claude/commands/`
3. Document the workflow here
4. Update reference documents if needed

## 10. Project-Specific Context

### Domain Knowledge

- **Business Logic**: Tutorial platform for Black Soldier Fly
  business and production. Three audiences:
  - **Public visitors**: Browse highlighted videos and the
    public catalogue (`/products/content/public`)
  - **Registered (logged out)**: Email/password registration,
    token verification, follow-up login prompts
  - **Authenticated members**: Full catalogue, company-aware
    credits, profile/company editors, progress tracking
- **Page guards**: `definePageMeta` with `auth` middleware for
  member areas, `guest` middleware for login/registration
- **Architectural Principles** (from `docs/PRD.md`):
  - Composable-first business logic
  - API abstraction via repositories/services
  - Accessibility via Ionic + locale-aware routing
  - Non-blocking telemetry hooks via metrics/log composables

### External Dependencies

- **Third-Party API**: Manna Cloud REST API at
  `https://manna-cloud-api.onrender.com`
  - Authentication: Bearer token in `Authorization` header
  - Documentation: Available at `/docs` endpoint of the API
  - Request plumbing: `useApi` composable
  - Contracts: `shared/types/api`
  - Endpoint roots: `nuxt.config.ts`
- **Infrastructure**:
  - Web: Netlify static deploy (`npm run generate` -> `dist/`)
  - Mobile: Capacitor wrappers for iOS/Android
  - PWA: `@vite-pwa/nuxt` with service worker

### Compliance and Security

- Bearer tokens stored client-side; guard with
  `import.meta.client`
- Security headers configured in `netlify.toml`
  (X-Frame-Options, X-Content-Type-Options, etc.)
- Sanitize any HTML rendered from external sources
  (`dompurify` / `isomorphic-dompurify` available)

---

## Maintenance Notes

**Last Updated**: 2026-04-14

**Maintained By**: Project Team

**Review Frequency**: Update when significant architecture
changes occur, when patterns diverge from the golden reference,
or when new workflows are added

---

## Usage Instructions for Commands

When a custom command is executed, it should:

1. **Read this file** using the Read tool
2. **Extract relevant sections** based on task type
3. **Apply constraints** from Section 3 (and CLAUDE.md)
4. **Use tools** documented in Section 5
5. **Follow workflow** guidelines from Section 6
6. **Consult golden reference** (`~/dev/bsf_market/main/`)
   when uncertain about an established pattern
7. **Relay to sub-agents** only necessary filtered information

This ensures consistent, project-aware execution across all
workflow steps while maintaining command agnosticism.
