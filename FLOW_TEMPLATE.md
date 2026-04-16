# FLOW.md - Project Workflow Configuration

> **Template Notice**: This is a template file. When using flow.py
> in your project, copy this file and customize it with your
> project-specific details.

---

## INITIALIZATION METADATA

<!-- This section guides the /init-flow command. DO NOT DELETE. -->

### Template Structure

This file contains **10 numbered sections** that define project
configuration. Each section has:

- **Required fields**: Must be filled (marked with `[...]`)
- **Optional fields**: Can be removed if not applicable (in `<!--`)
- **Examples**: Show format (marked with `e.g.,`)

### Question Generation Rules

The init-flow command should:

1. **Parse this file** to extract all `[...]` placeholders
2. **Identify section context** from headings and comments
3. **Generate questions** based on placeholder names and examples
4. **Skip optional sections** if user indicates not applicable
5. **Validate answers** against examples provided
6. **Uncomment sections** when user confirms they apply
7. **Remove sections** that user confirms don't apply

### Field Dependencies

Some fields depend on others:

- **Stack Type**: Required for all software projects.
  Determines which quality agents run:
  - `backend`: evaluate-code-quality, evaluate-quality-codex,
    implement-backend-docs
  - `frontend`: evaluate-code-quality, evaluate-frontend-quality,
    implement-frontend-docs
  - `fullstack`: all of the above
- **Tech Stack fields**: Only ask if software project
- **Code Quality**: Only ask if software project
- **Testing Requirements**: Only ask if project has tests
- **Testing Strategy for Agents**: Only ask if project has tests
  AND uses CI/CD. This section is critical for agents to know
  which tests to run locally vs in CI/CD.
- **Language Tools**: Depends on primary language
- **CI/CD**: Only if user confirms CI/CD exists

### Project Type Detection

Based on "Purpose" field, infer project type:

- **Software**: Mentions "application", "API", "library", "tool"
- **Documentation**: Mentions "documentation", "knowledge base"
- **Research**: Mentions "research", "analysis", "consultancy"
- **Mixed**: Determine which sections apply through questions

### Completion Criteria

A properly initialized FLOW.md has:

- ✓ No `[...]` placeholders in sections 1, 3, 4, 5
- ✓ All HTML comments either uncommented or removed
- ✓ "Last Updated" filled with current date
- ✓ At least one reference document identified
- ✓ Tools section matches actual project tools
- ✓ Repository structure reflects actual directories
- ✓ Critical Directories section filled with actual paths
- ✓ Research directories uncommented if applicable
- ✓ Testing Strategy for Agents filled (if project has tests):
  targeted test commands, CI/CD details, test file discovery
  pattern

### Default Values (if user unsure)

- Stack Type: Infer from Framework field.
  FastAPI/Django/Flask/Express/Hono → backend.
  React/Vue/Svelte (without SSR framework) → frontend.
  Next.js/Nuxt/SvelteKit/Remix → fullstack.
  If both backend AND frontend framework → fullstack.
  If unclear, ask the user explicitly.
- Line Length: 79 for Python, 80 for others
- Indentation: 4 spaces for Python, 2 for JS/TS, language default
- Branch Naming: feature/_, fix/_, chore/\*
- Commit Messages: Conventional Commits
- Default Branch: main
- Test Framework: pytest (Python), Jest (JS/TS), None

**Directory Defaults**:

- Documentation: `docs/`
- Tests: `tests/` (Python), `test/` or `__tests__/` (JS/TS)
- Source Code: `src/` (most projects), `lib/` (libraries), root (simple
  projects)
- Research Tasks: `tasks/` (if research project)
- Completed Tasks: `tasks/completed/` (archived completed tasks)
- Knowledge Base: `references/` (web research results, converted PDFs)
- Reports: `reports/` (customer-facing synthesis)
- Import Pipeline: `imports/new/` and `imports/converted/`
  (automated conversion + archiving)
- Temporary: `/tmp/` (system default, never change)

---

## 1. Project Description

<!-- Replace with your project details -->

**Project Name**: [Your Project Name]

**Purpose**: [Brief description of what this project does]

**Tech Stack**:

- Stack Type: [backend, frontend, or fullstack]
- Primary Language: [e.g., Python, TypeScript, Rust]
- Framework: [e.g., FastAPI, React, None]
- Database: [e.g., PostgreSQL, None]
- Key Dependencies: [List major dependencies]

**Repository Structure**:

```
project/
├── .claude/           # Commands and agents
├── docs/              # Documentation, PRDs, taxonomy
├── flow.py            # Orchestration CLI
├── FLOW.md            # Project-specific workflow config
├── imports/
│   ├── new/           # Incoming PDFs or markdown awaiting import
│   └── converted/     # Archived originals after processing
├── references/        # Knowledge base with YAML metadata
│   ├── index.md       # Auto-generated topic index
│   └── tags.md        # Auto-generated tag taxonomy
├── analysis/          # AI-generated analyses with metadata
├── reports/           # Client-facing deliverables
├── index/             # Search index artefacts
└── tasks/
    └── completed/     # Archived research tasks
```

**Metadata Requirements Overview**:

- All reference, analysis, and report markdown files must include YAML
  frontmatter that satisfies `docs/metadata-taxonomy.yaml`.
- Required fields: `title`, `date`, `topics`, `tags`, `source` with
  values drawn from the controlled vocabulary.
- Maintain vocab updates via pull requests; regenerate indexes after
  edits using `./flow.py index-build`.

**Quick Start Commands**:

- `./flow.py import-document <path>` – ingest files from `imports/new/`
  and generate compliant references with metadata.
- `./flow.py validate-metadata [folder]` – verify metadata against the
  taxonomy (`references` or `analysis`).
- `./flow.py index-build` and `./flow.py index-query <terms>` – rebuild
  and interrogate the structured search index.

### Critical Directories

<!-- Define all standard directories used by slash commands -->

**Project Documentation**:

- **Location**: `docs/` (default)
- **Purpose**: Project-related documents, PRDs, architecture docs,
  templates
- **Used by**: `/sw:analyse-issue`, `/sw:implement-issue`, all coding
  commands
- **Contains**: CLAUDE.md, PRD.md, TASK_TEMPLATE.md (project-specific
  files)

**Test Directory**:

- **Location**: [e.g., `tests/`, `test/`, `__tests__/`, `src/test/`]
- **Purpose**: Test files and test fixtures
- **Used by**: All implementation and review commands
- **Structure**: [e.g., mirrors src/ structure, organized by test type]

**Application/Code Directory**:

- **Location**: [e.g., `src/`, `app/`, `lib/`, project root]
- **Purpose**: Main application source code
- **Used by**: All coding commands
- **Structure**: [Describe module organization]

**Research Tasks**:

- **Location**: `[tasks_dir]` (default `tasks/`)
- **Purpose**: Research task definitions and lifecycle tracking
- **Used by**:
  - `/research:create-task` - Creates new tasks
  - `/research:analyze-report-gaps` - Generates tasks from gaps
  - `/research:archive-task` - Moves tasks to completed/
- **File naming**: `NNN-task-title.md` (numbered sequentially)
- **Subdirectories**: `[tasks_dir]/completed/` - Archived tasks

**Internal Knowledge Base**:

- **Location**: `[references_dir]` (default `references/`)
- **Purpose**: Metadata-compliant research corpus
- **Used by**:
  - `/research:search-internal` - Reads existing knowledge
  - `/research:search-web` - Writes `web-*.md` references
  - `/analysis:create` - Pulls baseline insights
  - `/research:maintain-report` - Cross-checks sources
- **File types**: `import-*.md`, `web-*.md`, taxonomy indexes
- **Metadata**: Must satisfy `docs/metadata-taxonomy.yaml`

**Analysis Workspace**:

- **Location**: `[analysis_dir]` (default `analysis/`)
- **Purpose**: AI-generated analyses with YAML metadata
- **Used by**: `/analysis:create`, `/research:maintain-report`
- **File naming**: `analysis-[topic]-[YYYY-MM-DD].md`

**Import Pipeline Root**:

- **Location**: `[imports_root]` (default `imports/`)
- **Purpose**: Stage raw files, convert, and archive originals
- **Used by**: `/utils:convert-pdf`, `/research:import-document`
- **Structure**:
  ```
  [imports_root]/
  ├── [incoming_dir]/     # Files awaiting ingestion
  ├── [converted_dir]/    # Originals stored after import
  └── [archived_dir]/     # Optional long-term storage
  ```
- **Defaults**: incoming=`imports/new/`, converted=`imports/converted/`,
  archived=`imports/archived/`
- **Ignore files**: `.gitkeep`, `.placeholder`, `placeholder`,
  `.gitignore` (directory placeholder files for git tracking)

**Report Synthesis**:

- **Location**: `[report_dir]` (default `reports/`)
- **Topic Index**: `[report_index]` (default `000-topic-reference.md`)
- **Purpose**: Client-facing deliverables with YAML metadata
- **Used by**: `/research:update-report`, `/research:maintain-report`
- **Structure**:
  ```
  [report_dir]/
  ├── 000-topic-reference.md  # Chapter index and topic mapping
  ├── 01-chapter-one.md
  ├── 02-chapter-two.md
  └── ...
  ```
- **File naming**: `NN-chapter-title.md`

**Search Index Artefacts**:

- **Location**: `[index_dir]` (default `index/`)
- **Purpose**: Structured search outputs built from metadata
- **Used by**: `/research:index-build`, `/research:index-query`
- **Maintenance**: Rebuild after imports or taxonomy changes

**Temporary Files**:

- **Location**: `/tmp/` (system temp, default)
- **Purpose**: Temporary downloads, attachments, intermediate processing
- **Used by**: `/sw:analyse-issue` (for attachments), various commands
- **Cleanup**: Automatically cleared by system, not committed to git

**Build/Generated Files**:

- **Location**: [e.g., `dist/`, `build/`, `.next/`, `target/`]
- **Purpose**: Compiled artifacts, build output (gitignored)
- **Used by**: Build and deployment workflows
- **Note**: [e.g., "Never modify generated files manually"]

## 2. General Guidance for Commands and Agents

### Workflow Execution Principles

- **Read First**: Always read this FLOW.md before executing tasks
- **Context Chaining**: Each command receives output from previous
  step only
- **Stateless Operations**: Commands should not assume shared context
- **Structured Output**: Produce clear, parseable output for next
  step
- **Error Handling**: Fail gracefully with informative messages

### Command Execution Guidelines

1. **Understand the Task**: Parse the input from previous step
2. **Gather Context**: Read relevant reference documents
3. **Execute Atomically**: Complete one well-defined task
4. **Report Results**: Provide structured output with references
5. **Track Costs**: Report token usage when applicable

### Sub-Agent Delegation

When delegating to sub-agents:

- **Filter Information**: Share only relevant sections from this file
- **Specify Scope**: Clearly define the sub-task boundaries
- **Provide Context**: Include necessary tech stack details
- **Set Constraints**: Pass along relevant rules and standards

## 3. Rules to Adhere

### Code Quality Standards

<!-- Customize these for your project -->

- **Line Length**: [e.g., 79 characters for Python, 80 for others]
- **Indentation**: [e.g., 4 spaces, 2 spaces, tabs]
- **Naming Conventions**: [e.g., snake_case, camelCase]
- **Documentation**: [e.g., docstrings required, JSDoc, None]
- **Metadata**: [e.g., All references/analysis/reports require YAML frontmatter]
- **Type Safety**: [e.g., type hints required, TypeScript strict]

### Testing Requirements

<!-- Customize based on your testing strategy -->

- **Test Framework**: [e.g., pytest, Jest, Vitest, None]
- **Coverage Target**: [e.g., 80%, Not enforced]
- **Test Location**: [e.g., tests/ directory, alongside source]
- **Test Naming**: [e.g., test_*.py, *.test.ts, *_test.go]
- **Run Command**: [e.g., `pytest`, `npm test`, `go test ./...`]

### Testing Strategy for Agents

<!-- IMPORTANT: This section is read by implement-test-engineer,
     implement-test-driven, implement-feature, and all orchestrator
     commands. Fill it in completely so agents know how to run
     tests for your project. -->

**Local Agent Testing (targeted only)**:
Agents run ONLY targeted tests for changed/new files locally.
The GitHub PR CI/CD pipeline is the authoritative gate for
full test suite execution.

- **Targeted test command**:
  [e.g., `pytest path/to/test_file.py`,
  `npx vitest run path/to/test.spec.ts --pool=forks
  --maxWorkers=1`, `go test ./pkg/...`]
- **Resource-safe flags**:
  [e.g., `--maxWorkers=1` for Jest/Vitest,
  `-count=1 -parallel=1` for Go, `-x` for pytest]
- **Format check command**:
  [e.g., `ruff format --check`, `npx prettier --check`]
- **Lint check command**:
  [e.g., `ruff check`, `npx eslint`]
- **Type check command**:
  [e.g., `mypy`, `tsc --noEmit`, None]
- **Build command**:
  [e.g., `npm run build`, `go build ./...`, None]

**CI/CD Full Suite (authoritative gate)**:
CI/CD runs the complete test suite on every PR push.
Agents do NOT duplicate this locally.

- **CI platform**: [e.g., GitHub Actions, GitLab CI]
- **CI test command**: [e.g., `pytest --cov`, `npm test`]
- **CI workflow file**:
  [e.g., `.github/workflows/test.yml`]
- **Required CI checks**:
  [e.g., lint, format, types, build, unit tests]

**Test file discovery pattern**:
How to find the test file for a given source file:

- [e.g., `src/foo.py` → `tests/test_foo.py`]
- [e.g., `src/components/Foo.tsx` → `src/components/Foo.test.tsx`]
- [e.g., `pkg/foo/bar.go` → `pkg/foo/bar_test.go`]

**What agents should NOT run**:

- Full test suite (CI/CD handles this)
- E2E tests (manual or CI/CD only)
- Performance/load tests
- Tests requiring external services not available locally

### Version Control Practices

<!-- Customize based on your Git workflow -->

- **Branch Naming**: [e.g., feature/*, fix/*, chore/*]
- **Commit Messages**: [e.g., Conventional Commits, Free-form]
- **PR Requirements**: [e.g., Reviews required, CI must pass]
- **Default Branch**: [e.g., main, master, develop]

### Project-Specific Constraints

<!-- Add any special rules for your project -->

- [e.g., "Never modify generated files in dist/"]
- [e.g., "Always update CHANGELOG.md for features"]
- [e.g., "UI changes require screenshot in PR"]
- [e.g., "Database migrations must be reversible"]
- [e.g., "Rebuild index/ after adding knowledge base material"]

## 4. Reference Documents

### Required Reading (Always Consult)

1. **FLOW.md** (this file)
   - Location: `./FLOW.md`
   - Purpose: Central workflow and project configuration
   - When to read: Before every command execution

<!-- Uncomment and customize based on your project -->

<!--
2. **CLAUDE.md**
   - Location: `./CLAUDE.md`
   - Purpose: Development instructions and architecture
   - When to read: For implementation tasks

3. **AGENTS.md**
   - Location: `./.claude/AGENTS.md`
   - Purpose: Agent-specific configurations and guidelines
   - When to read: When creating or modifying agents

4. **docs/PRD.md**
   - Location: `./docs/PRD.md`
   - Purpose: Product requirements and specifications
   - When to read: For feature development and analysis
-->

### Optional Reading (Context-Dependent)

<!-- Add project-specific documentation -->

<!--
- **API.md**: API design and endpoints
- **ARCHITECTURE.md**: System architecture diagrams
- **SECURITY.md**: Security practices and requirements
- **CONTRIBUTING.md**: Contribution guidelines
-->

### Template Files

<!-- Reference files for workflow commands -->

<!--
**For Issue Documentation** (used by `/sw:analyse-issue`):
- Issue template guidance is provided in Section 6 of this FLOW.md
- Projects can optionally create custom issue templates if needed

**For Research Tasks** (used by `/research:create-task`,
`/research:complete-task`):
- **docs/TASK_TEMPLATE.md**: Research task definition template
  - Task metadata structure
  - Research question format
  - Agent assignment guidelines
  - Keyword generation patterns

**For Report Writing** (used by `/write:update-report`):
- **reports/000-topic-reference.md**: Topic mapping and chapter index
  - Maps topics to chapters
  - Tracks chapter organization
  - Guides where to add new content
-->

### How to Read Documents

```markdown
When sub-agents need guidance:

1. Read FLOW.md sections relevant to the task
2. Extract applicable rules and tech stack info
3. Include in sub-agent prompt with clear scope
4. Avoid passing entire documents unless necessary
```

### Command Reading Requirements

**Software Development Commands** (need Section 3 + 5 + 6):

- `/sw:analyse-issue`: Read Sections 3, 6 (Issue Template)
- `/sw:implement-issue`: Read Sections 1, 3, 5, 6 (Implementation)
- `/sw:continue-implementation`: Read Sections 1, 3, 5, 6
  (Implementation)
- `/sw:coder-simple`: Read Sections 1, 3, 5
- `/sw:pull-request-review`: Read Sections 3, 5, 6 (Review)
- `/sw:create-issue`: Read Sections 1, 3, 6 (Issue Template)

**Research Commands**:

- `/research:import-document`: Sections 1 (Import Pipeline,
  Knowledge Base), 3, 6, 10
- `/research:validate-metadata`: Sections 1 (Import Pipeline,
  Knowledge Base), 3, 7, 10
- `/research:create-task`: Sections 1 (Research Tasks), 3, 6, 10
- `/research:analyze-report-gaps`: Sections 1 (Reports, Tasks), 3, 6,
  10
- `/analysis:create`: Sections 1 (Analysis Workspace, Knowledge Base),
  3, 6, 10
- `/research:search-internal`: Sections 1 (Knowledge Base), 3, 6, 10
- `/research:search-web`: Sections 1 (Knowledge Base), 3, 6, 10
- `/research:update-report`: Sections 1 (Report Synthesis), 3, 6, 10
- `/research:maintain-report`: Sections 1 (Report Synthesis, Analysis),
  3, 6, 10
- `/research:index-build`: Sections 1 (Search Index), 3, 7, 10
- `/research:index-query`: Sections 1 (Search Index), 3, 7, 10
- `/research:archive-task`: Sections 1 (Research Tasks), 3, 6, 10

**Utility Commands**:

- `/utils:init-flow`: Reads FLOW.md template itself
- `/utils:convert-pdf`: Sections 1 (Import Pipeline), 3
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

<!-- Customize based on your tech stack -->

<!--
**Python Projects**:
- uv: Package management (`uv run`, `uv pip`)
- pytest: Testing framework
- ruff: Linting and formatting
- mypy: Static type checking

**JavaScript/TypeScript Projects**:
- npm/pnpm/yarn: Package management
- eslint: Linting
- prettier: Code formatting
- tsc: TypeScript compiler

**Other Languages**:
- [List your language-specific tools]
-->

### Quality Assurance Tools

<!-- Add if applicable -->

<!--
**Codex CLI** (Optional):
- Purpose: Code quality evaluation
- Usage: `codex evaluate --language python src/`
-->

### CI/CD Integration

<!-- Document your CI/CD setup -->

<!--
- **Platform**: [e.g., GitHub Actions, GitLab CI]
- **Workflows**: [e.g., .github/workflows/test.yml]
- **Required Checks**: [e.g., Tests, Linting, Build]
- **Deployment**: [e.g., Automatic on merge to main]
-->

## 6. Workflow-Specific Guidance

This section provides detailed guidance for slash commands. Commands
should read these subsections to find templates, validation rules,
and workflow patterns.

### Issue Documentation Template

**Required for**: `/sw:analyse-issue`

<!-- Customize issue template structure for your project -->

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
   - Pattern consistency (files/components to mimic)
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
   - **file:line references** (e.g., `src/auth.ts:142-158`)
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
    - **Coverage targets**: 80-85% unit, 75-80% integration
      (realistic, not aggressive)
    - **Manual**: Step-by-step scenarios with expected results
    - **Test data**: Concrete fixtures/payloads implementer can
      use

12. **🧰 Commands to Run Before PR**

    ```bash
    npm run lint
    npm test
    # Add others as required
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

16. **📚 Reference Material**
    - Design/API links with versions
    - Comparable implementations with file:line refs
    - Data samples or dashboards

17. **❓ Questions**
    - Who to ask + preferred channel
    - Clarification etiquette and response SLA

**Optional Section (if backend involved):**

18. **🔌 Backend Integration**
    - API endpoints
    - data models
    - auth

**Quality Requirements:**

- Character budget: ≤15k (ideal ≤12k)
- **Precise file:line references** for all code mentions
- **Concrete test code examples** (not vague descriptions)
- **Realistic coverage targets** (no aggressive 95%+ without
  justification)
- **No content repetition** between sections (each adds new info)
- **Test data provided** (mock objects, API payloads)
- **Explicit i18n keys** if applicable (not "~30 keys")
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
  - **Quality** (patterns, cleanup, abstractions)
  - **Risk** (breakage points, edge cases, tests)
- Synthesize balanced approach
- Add validation strategy from test-driven-engineer
- Check backend integration needs (if Stack Type is
  backend or fullstack)
- Check frontend integration needs (if Stack Type is
  frontend or fullstack)
- Evaluate with codex-issue-evaluator
- Refine based on feedback if needed

### Implementation Workflow

**Required for**: `/sw:implement-issue`, `/sw:continue-implementation`,
`/sw:coder-simple`

When implementing features:

1. Read issue documentation completely
2. Extract code quality standards (Section 3)
3. Extract testing strategy (Section 3: Testing Strategy for
   Agents) — this tells agents which commands to use, how to
   find test files, and what NOT to run
4. Create feature branch following naming convention
5. Implement following all coding rules
6. Run ONLY targeted validation (see Testing Strategy):
   - Format check (changed files only)
   - Lint check (changed files only)
   - Type check
   - Build validation
   - **Targeted tests only** (changed/new files, NOT full suite)
7. Verify targeted quality gates pass
8. Create PR — CI/CD runs the full test suite automatically

**Quality Gates Before PR (targeted only):**

<!--
Customize using commands from Testing Strategy for Agents:
- [ ] Code formatted (changed files)
- [ ] No lint errors (changed files)
- [ ] Type checks pass
- [ ] Build succeeds
- [ ] Targeted tests pass (changed/new files only)
- NOTE: Full test suite runs in CI/CD on PR creation
-->

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
2. Verify code follows quality standards (Section 3)
3. Run tests locally if applicable
4. Address each comment individually:
   - Quote the review comment
   - Explain your fix
   - Reference file:line of changes
5. Re-run all pre-PR quality gates (see Implementation Workflow)
6. Push fixes to same branch
7. Reply to review comments on GitHub

### Research Task Workflow

**Applies to**: `/research:import-document`, `/research:validate-metadata`,
`/research:create-task`, `/research:analyze-report-gaps`,
`/analysis:create`, `/research:search-internal`, `/research:search-web`,
`/research:update-report`, `/research:maintain-report`,
`/research:index-build`, `/research:index-query`,
`/research:archive-task`

**Directory Structure:**
See Section 1 for resolved paths. Defaults: `[imports_root]/`,
`[references_dir]/`, `[analysis_dir]/`, `[report_dir]/`, `[tasks_dir]/`,
`[tasks_dir]/completed/`, `[index_dir]/`.

**Workflow Overview:**

```
0. Import Documents     → [references_dir]/import-*.md
   (/research:import-document)
   Reads: [imports_root]/new/, writes: [references_dir]/,
          [imports_root]/converted/

1. Create Task          → [tasks_dir]/NNN-title.md
   (/research:create-task OR /research:analyze-report-gaps)

2. Search Internal      → /tmp/internal-summary-*.md
   (/research:search-internal)
   Reads: [references_dir]/

3. Draft Analysis       → [analysis_dir]/analysis-topic-DATE.md
   (/analysis:create)
   Reads: [references_dir]/, internal summaries

4. Search Web           → [references_dir]/web-topic-DATE.md
   (/research:search-web)
   Uses: analysis insights, internal summary gaps

5. Update Reports       → [report_dir]/NN-chapter.md and
                           [report_dir]/000-topic-reference.md
   (/research:update-report, /research:maintain-report)

6. Validate Metadata    → [references_dir]/, [analysis_dir]/, [report_dir]/
   (/research:validate-metadata)

7. Rebuild Index        → [index_dir]/*
   (/research:index-build, /research:index-query for QA)

8. Archive Task         → [tasks_dir]/completed/NNN-title.md
   (/research:archive-task)
```

**Command Purposes:**

- **`/research:import-document [path]`**
  - Ingests files from `[imports_root]/new/` into metadata-compliant
    references
  - Archives originals in `[imports_root]/converted/` for traceability

- **`/research:validate-metadata [target]`**
  - Verifies YAML frontmatter in `[references_dir]/`, `[analysis_dir]/`,
    or `[report_dir]/`
  - Run after imports or manual edits to confirm taxonomy alignment

- **`/research:create-task [description]`**
  - Generates numbered task files with research scope and keywords
  - Seeds agent assignments using FLOW.md context

- **`/research:analyze-report-gaps`**
  - Audits reports for missing coverage against project goals
  - Emits new tasks per gap while avoiding duplicates

- **`/analysis:create [summary]`**
  - Produces structured analyses in `[analysis_dir]/` with YAML metadata
  - Summarizes internal and external findings for downstream agents

- **`/research:search-internal [query|task]`**
  - Reviews knowledge in `[references_dir]/` and `[analysis_dir]/`
  - Produces `/tmp/internal-summary-*.md` highlighting known facts

- **`/research:search-web [query|task]`**
  - Launches multi-agent web research focused on identified gaps
  - Writes `web-*.md` files to `[references_dir]/` with citations

- **`/research:update-report [references...]`**
  - Transforms references into client-ready chapters in `[report_dir]/`
  - Keeps `[report_dir]/000-topic-reference.md` synchronized

- **`/research:maintain-report [threshold]`**
  - Splits large report files, updates the index, and maintains hierarchy
  - Ensures chapters remain within manageable size limits

- **`/research:index-build [scope]`**
  - Regenerates structured search artefacts under `[index_dir]/`
  - Run after metadata changes or new content ingestion

- **`/research:index-query [terms]`**
  - Validates the active index by running scoped queries
  - Use to confirm taxonomy coverage before closing tasks

- **`/research:archive-task [task file]`**
  - Moves completed tasks into `[tasks_dir]/completed/`
  - Maintains original numbering for traceability

**Task Template Structure:**

<!--
See: docs/TASK_TEMPLATE.md (if exists)

Default structure:
```markdown
# Task NNN: [Task Title]
- **Status**: pending
- **Created**: YYYY-MM-DD
- **Research Question**: [What to investigate]
- **Success Criteria**: [What constitutes complete]
- **Keywords**: [Search terms, comma-separated]
- **Agent Assignments**: [Which agents to use]
```
-->

**Agent Selection:**

- `perplexity-web-research`: Complex reasoning, strategic analysis
- `tavily-web-research`: Real-time data extraction, site mapping
- `brave-web-research`: Broad web/news/video search (quota-aware)
- `firecrawl-web-research`: Deep site crawling
- `reference-search`: Fast internal reference lookup

**Research Quality Standards:**

- All claims cited with [Source](url) links
- Markdown line length ≤80 characters
- Clear section headers and structure
- Avoid duplication with existing research
- Include confidence levels for findings

### Report Writing and Maintenance Workflow

**Required for**: `/research:update-report`, `/research:maintain-report`

**Report Structure:**
See Section 1: Critical Directories → Report Synthesis for resolved
paths.
Defaults: `[report_dir]/`, `[report_dir]/000-topic-reference.md`

**When Updating or Maintaining Reports:**

1. Read `000-topic-reference.md` to locate chapter ownership and tags
2. Identify chapters requiring updates or new subsections
3. Decide whether to extend an existing file or create a new numbered
   chapter
4. Align terminology with project context (Section 10)
5. Ensure YAML metadata (title, date, topics, tags, source) remains
   valid
6. Maintain consistent voice, heading hierarchy, and ≤80 character
   lines
7. Cite all claims with [Source](url) format
8. Run `/research:maintain-report` when files exceed the size threshold
   to split content cleanly
9. Execute `/research:index-build` after structural changes to refresh
   `[index_dir]/`

**Report Quality Standards:**

- Markdown line length ≤80 characters
- YAML frontmatter present and taxonomy-compliant
- Consistent heading levels with no orphaned sections
- Clear transitions between sections
- Citations included for all non-obvious claims

### Import Pipeline Workflow

**Required for**: `/utils:convert-pdf`, `/research:import-document`,
`/research:validate-metadata`

**Directory Structure:**
See Section 1: Critical Directories → Import Pipeline for resolved
paths.
Defaults: `[imports_root]/new/`, `[imports_root]/converted/`,
`[imports_root]/archived/`, `[references_dir]/`

**When Ingesting Files:**

1. Stage raw PDFs or markdown inside `[imports_root]/new/`
2. Run `/utils:convert-pdf` for PDFs to generate intermediary markdown
   before import
3. Execute `/research:import-document <path>` to apply YAML metadata and
   place outputs in `[references_dir]/`
4. Review generated frontmatter and enrich topics or tags as needed
5. Run `/research:validate-metadata [references_dir]` to confirm schema
   compliance
6. Clean up `[imports_root]/converted/` or archive long-term assets in
   `[imports_root]/archived/`
7. Rebuild the search index with `/research:index-build` after bulk
   ingests

## 7. Cost and Performance Considerations

### Token Budget Awareness

- **Prefer Targeted Reads**: Use grep/search before full file reads
- **Avoid Redundant Operations**: Cache context when possible
- **Batch Operations**: Combine related tasks in single execution
- **Report Costs**: Always report token usage for LLM operations

### Performance Optimization

<!-- Add project-specific performance notes -->

- [e.g., "Large dataset operations should stream results"]
- [e.g., "Database migrations run with --dry-run first"]
- [e.g., "Build artifacts are cached in .build/"]

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

- [Your conflict resolution strategy]

**Failed CI Checks**:

- [Your CI failure handling process]

## 9. Custom Workflow Extensions

### Adding New Workflows

To add project-specific workflows:

1. Define workflow in `flow.py` or custom script
2. Create corresponding slash commands in `.claude/commands/`
3. Document the workflow here
4. Update reference documents if needed

### Example Custom Workflows

<!-- Document your custom workflows -->

<!--
**Database Migration Workflow**:
```bash
flow db-migrate "Add user preferences table"
```
Steps: Generate migration → Review → Apply → Test

**Release Workflow**:
```bash
flow release v1.2.0
```
Steps: Version bump → Changelog → Tag → Build → Publish
-->

## 10. Project-Specific Context

<!-- Add any other project-specific information -->

### Domain Knowledge

<!--
- **Business Logic**: [Key domain concepts]
- **User Personas**: [Primary users and use cases]
- **Data Models**: [Core entities and relationships]
-->

### External Dependencies

<!--
- **Third-Party APIs**: [List with auth requirements]
- **External Services**: [Database, cache, queue, etc.]
- **Infrastructure**: [Cloud provider, hosting details]
-->

### Compliance and Security

<!--
- **Data Privacy**: [GDPR, CCPA requirements]
- **Security Standards**: [Authentication, encryption]
- **License Compliance**: [Dependency license checks]
-->

---

## Maintenance Notes

**Last Updated**: [Date]

**Maintained By**: [Team/Person]

**Review Frequency**: [e.g., Monthly, Per major release]

---

## Usage Instructions for Commands

When a custom command is executed, it should:

1. **Read this file** using the Read tool
2. **Extract relevant sections** based on task type
3. **Apply constraints** from Section 3
4. **Use tools** documented in Section 5
5. **Follow workflow** guidelines from Section 6
6. **Relay to sub-agents** only necessary filtered information

This ensures consistent, project-aware execution across all
workflow steps while maintaining command agnosticism.
