---
description: Update flow_ai files from upstream repository
tags: [maintenance, update, sync]
model: opus
---

# Update Flow AI

Update the current project's flow_ai orchestration files
from the official upstream repository, migrate FLOW.md,
merge changes, and return to a clean main branch.

This is a fully automated end-to-end update. No user
interaction required during execution.

## Prerequisites

You have access to `git` and `gh` CLI tools. Before
proceeding:

- Use `git remote -v` to get repository URL
- Extract owner/repo name from URL

1. **Verify clean state**: Check that you're on the main
   branch with no uncommitted changes
   - If NOT on main -> STOP and instruct user to switch
   - If uncommitted changes -> STOP and instruct user
     to commit/stash
   - Only proceed if clean working tree on main branch

## Upstream Repository

- **Repository url (ssh)**:
  git@github.com:mannainsect/flow_ai.git
- **Files to sync**:
  - `.claude/` directory (all subdirectories)
  - `flow.py` script
- **Used for migration only** (not copied to project):
  - `FLOW_TEMPLATE.md` (read from `/tmp/flow_ai/`
    to detect missing FLOW.md fields)

## Update Process

### Phase 0: Pre-check (is update needed?)

Quick check to avoid unnecessary work. Compares the
upstream HEAD against the last synced commit hash.

1. **Clone upstream**: Clone flow_ai repo to `/tmp`
   ```bash
   rm -rf /tmp/flow_ai
   git clone git@github.com:mannainsect/flow_ai.git \
     /tmp/flow_ai
   ```

2. **Get upstream HEAD hash**:
   ```bash
   UPSTREAM_HEAD=$(cd /tmp/flow_ai && \
     git rev-parse --short HEAD)
   ```

3. **Get last synced hash** from project git log:
   ```bash
   LAST_MSG=$(git log --oneline \
     --grep="flow_ai upstream" --format="%s" | head -1)
   ```
   Extract hash from pattern `up to <hash>`.

4. **Compare hashes**:
   - If last synced hash equals `$UPSTREAM_HEAD`:
     upstream has no new commits since last sync.
     Clean up `/tmp/flow_ai`, report to user:
     ```
     ## flow_ai update: already up to date

     Upstream HEAD (<hash>) matches last sync.
     No update needed.
     ```
     **STOP here** — do not proceed to Phase 1.
   - If no previous hash found (first update) or
     hashes differ: **proceed to Phase 1**.

### Phase 1: Sync upstream files

The upstream clone from Phase 0 is already available
at `/tmp/flow_ai`. No need to clone again.

1. **Capture changelog**: Capture what changed upstream
   since the project's last update.

   Using the last synced hash from Phase 0:
   ```bash
   # If previous hash found:
   cd /tmp/flow_ai && git log --oneline <hash>..HEAD

   # If no previous hash (first update):
   cd /tmp/flow_ai && git log --oneline -20
   ```
   Save this output for the final summary.

2. **Copy files**: Merge into current project:
   - `.claude/` -> Recursively merge directory structure
     - Use `cp -r` to merge, NOT `rm` + copy
     - Upstream files OVERWRITE same-named project files
     - Project-specific files NOT in upstream PRESERVED
     - New upstream files/directories ADDED
   - `flow.py` -> Overwrite root level file

   **Merge behavior example**:

   ```
   Project has:        Upstream has:       Result:
   .claude/            .claude/            .claude/
   ├── commands/       ├── commands/       ├── commands/
   ├── agents/         ├── agents/         ├── agents/
   └── my-custom/      └── scripts/        ├── scripts/
                                           └── my-custom/
   ```

3. **Important exclusions**: NEVER modify:
   - `FLOW.md` (handled separately in Phase 2)
   - `CLAUDE.md` (project-specific instructions)
   - `docs/PRD.md` (project requirements)
   - Any project files outside sync scope

4. **Copy implementation**:

   ```bash
   # Correct (merge/overlay):
   cp -r /tmp/flow_ai/.claude/* ./.claude/
   cp /tmp/flow_ai/flow.py ./flow.py

   # WRONG (deletes project files):
   # rm -rf .claude && cp -r /tmp/flow_ai/.claude .
   ```

   **FLOW_TEMPLATE.md**: Do NOT copy to the project.
   Many projects delete it after init. Phase 2 reads
   it directly from `/tmp/flow_ai/` for migrations.

### Phase 2: Migrate FLOW.md schema

After syncing files, check if the project's FLOW.md
has all required fields from FLOW_TEMPLATE.md. Add
missing fields with placeholder values.

**Required field checks:**

1. **Read upstream FLOW_TEMPLATE.md** from
   `/tmp/flow_ai/FLOW_TEMPLATE.md` (always available
   from the clone, even if project deleted its copy).
   Parse `INITIALIZATION METADATA` section for required
   fields and defaults.

2. **Read project's FLOW.md** Tech Stack section.

3. **Check for missing fields** by comparing. Current
   required migrations:

   | Field | Location | Placeholder |
   |-------|----------|-------------|
   | `Stack Type` | Tech Stack | `[backend, frontend, or fullstack]` |

4. **For each missing field**:
   - Insert it into the correct section of FLOW.md
   - Use the placeholder value from FLOW_TEMPLATE.md
   - Preserve existing content and formatting

5. **Track migrations** for the final summary.

**Migration implementation example:**

If FLOW.md has:
```
**Tech Stack**:
- Primary Language: Python 3.10+
```

Add Stack Type before Primary Language:
```
**Tech Stack**:
- Stack Type: [backend, frontend, or fullstack]
- Primary Language: Python 3.10+
```

### Phase 3: Commit, merge, and cleanup

This phase is fully automated. No user review needed.

**Check for actual changes first:**
```bash
git status --porcelain
```
If no changes, skip to Phase 4 (summary only).

**Get upstream HEAD hash** for the commit message:
```bash
UPSTREAM_HASH=$(cd /tmp/flow_ai && \
  git rev-parse --short HEAD)
```

#### If project has a remote:

1. **Create branch**:
   ```bash
   git checkout -b flow-update-YYYYMMDD-HHMMSS
   ```

2. **Stage and commit**:
   ```bash
   git add .
   git commit -m "Sync flow_ai upstream up to $HASH

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

3. **Push branch**:
   ```bash
   git push -u origin flow-update-YYYYMMDD-HHMMSS
   ```

4. **Create PR**:
   ```bash
   gh pr create --title "Sync flow_ai upstream" \
     --body "Automated sync from flow_ai upstream.

   ## Changes
   <list key upstream changes from changelog>

   ## FLOW.md migrations
   <list migrations or 'None needed'>"
   ```

5. **Merge PR immediately**:
   ```bash
   PR_NUM=$(gh pr view --json number -q .number)
   gh pr merge $PR_NUM --merge --delete-branch
   ```

6. **Return to main and pull**:
   ```bash
   git checkout main
   git pull origin main
   ```

7. **Clean up local branch** (if still exists):
   ```bash
   git branch -D flow-update-YYYYMMDD-HHMMSS 2>/dev/null
   ```

#### If no remote:

1. **Commit directly to main**:
   ```bash
   git add .
   git commit -m "Sync flow_ai upstream up to $HASH

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

### Phase 4: Cleanup and summary

1. **Remove temp clone**:
   ```bash
   rm -rf /tmp/flow_ai
   ```

2. **Verify final state**:
   - Confirm on main branch
   - Confirm clean working tree
   - Confirm branch deleted (if applicable)

3. **Report summary** to user:

   ```
   ## flow_ai update complete

   **Upstream changes since last sync:**
   - <commit message 1>
   - <commit message 2>
   - ...

   **Files synced:**
   - .claude/ directory (N files updated)
   - flow.py

   **FLOW.md migrations:**
   - <migration details or "Up to date">

   **Status:** Merged to main, branch cleaned up.
   ```

   If FLOW.md migrations added placeholder values:
   ```
   ACTION REQUIRED: Edit FLOW.md and set Stack Type
   to one of: backend, frontend, fullstack
   ```

   If no changes detected:
   ```
   ## flow_ai update: already up to date

   No changes detected between upstream and project.
   ```

## Decision Logic

```
On main with clean tree?
├─ NO  -> STOP, instruct user
└─ YES -> Clone upstream
          ├─ Upstream HEAD == last synced hash?
          │   └─ Report "already up to date", STOP
          └─ New commits available?
              → Copy files, migrate FLOW.md
              ├─ No file changes? -> Report "up to date"
              └─ Changes detected?
                  ├─ Has remote?
                  │   └─ Branch → Commit → Push → PR
                  │      → Merge → Checkout main → Pull
                  │      → Delete local branch → Summary
                  └─ No remote?
                      └─ Commit to main → Summary
```

## Expected Behavior

You are smart enough to:

- Use appropriate git/gh commands
- Handle file copying and directory structure
- Detect if changes actually occurred (skip if current)
- Parse FLOW.md to find insertion points for new fields
- Create proper commit messages with co-author
- Merge PRs without waiting for user review
- Clean up branches after merge
- Generate changelog from upstream git log
- Clean up temporary files
- Handle errors gracefully
- Always end on main branch with clean working tree

Focus on workflow logic, not implementation details.
