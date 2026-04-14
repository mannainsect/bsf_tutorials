---
argument-hint: []
description: Rebuild v3 text-first index.md and tags.md from YAML metadata
allowed-tools: [Execute, Task]
model: claude-opus-4-6
---

# /research:index-build

## Purpose
Rebuild the human-readable v3 indexes (`index.md` and `tags.md`) for
the internal knowledge base and analysis workspace using only YAML
frontmatter, dropping any dependency on `index/index.json` or vector
indexes.

**When to use:**
- Initial index creation for a new project
- Recovery from corrupted or out-of-sync indexes
- After bulk operations that bypassed normal indexing
- Periodic verification (monthly recommended for large repos)

**DO NOT use for normal operations.** Commands like `/research:search-web`
and `/research:import-document` use incremental `add` operations that
scale to 1000+ files. Full rebuild scans every file and is slow at scale.

## Context Discovery

Before rebuilding indexes:

1. Read `FLOW.md` Section 1: Critical Directories to resolve:
   - `[references_dir]` (Internal Knowledge Base; default
     `references/`)
   - `[analysis_dir]` (Analysis workspace; default `analysis/`)
   Only use these resolved paths when probing for folders.
2. Check whether `[references_dir]` and `[analysis_dir]` directories
   exist so you know which folders to process.
3. Ensure the validation script
   `.claude/scripts/indexing/validate_metadata.py` is available so you
   can optionally validate metadata before rebuilding.
4. Skim existing `[references_dir]/index.md` and
   `[references_dir]/tags.md` (when present) to understand the current
   index layout and tag usage.

## Steps

1. **Determine target folders**
   - From the repository root, check whether `[references_dir]` and
     `[analysis_dir]` directories exist.
   - Build a list of existing folders to process (zero, one, or two
     entries).

2. **Validate metadata before rebuilding**
   - For each target folder, you SHOULD first run:
     ```bash
     uv run .claude/scripts/indexing/validate_metadata.py <folder>
     ```
   - Surface any reported `ERROR_FILE` entries as warnings.
   - Continue with the rebuild even if validation finds issues so that
     valid files still appear in the refreshed indexes.

3. **Rebuild text indexes via metadata-maintenance**
   - For each target folder, invoke the `metadata-maintenance` agent
     using `Task`, passing:
     - `folder`: the resolved folder path (e.g. `[references_dir]`),
       not a hardcoded default.
     - `operation`: `"rebuild"`
     - `filepath`: omit or use an empty string when rebuilding
       everything.
   - Rely on the agent to:
     - Scan all `*.md` files in the folder (excluding `index.md` and
       `tags.md`).
     - Rebuild `<folder>/index.md` as a v3 manifest (one bullet per
       file, newest first).
     - Rebuild `<folder>/tags.md` as a tag registry derived from actual
       `tags` usage.

4. **Summarise results**
   - After all folders are processed, aggregate the markers emitted by
     `metadata-maintenance` and present a concise summary including:
     - Number of files scanned per folder.
     - Paths of updated index/tag files.
     - Any folders that were skipped because they do not exist.

## Output Markers

At minimum, ensure the following markers appear in the final output:

- `INDEX_UPDATED: [references_dir]/index.md` (when `[references_dir]`
  exists)
- `TAGS_UPDATED: [references_dir]/tags.md` (when `[references_dir]`
  exists)
- `ANALYSIS_INDEX_UPDATED: [analysis_dir]/index.md` (when
  `[analysis_dir]` exists)
- `ANALYSIS_TAGS_UPDATED: [analysis_dir]/tags.md` (when
  `[analysis_dir]` exists)

These supplement the underlying `metadata-maintenance` status markers
(`INDEX_UPDATED`, `TAGS_UPDATED`, `FILES_SCANNED`, `OPERATION`).

## Post-Conditions

- `[references_dir]/index.md` and `[references_dir]/tags.md` (and
  `[analysis_dir]` equivalents when present) reflect the latest
  on-disk metadata.
- No JSON or vector indexes are required for subsequent search
  commands.
- Exit code reflects overall success (`0`) or failure (`1`) of the
  rebuild process.
