---
argument-hint: []
description: Migrate legacy v1 research assets to v2 folder structure
allowed-tools: [Execute, Glob, Read, Write]
model: claude-opus-4-6
---

# /research:migrate-v2

## Purpose
Reorganise legacy v1 research assets into the v2 folder structure and
prepare placeholders for metadata-driven workflows.

## Steps
1. Create required directories if they do not exist:
   - `imports/new`, `imports/converted`, `analysis`, `index`,
     `tasks/completed`, `references`.
2. Move existing reference markdown and PDFs into staging:
   - `references/*.md` (except `index.md`/`tags.md`) → `imports/new/`.
   - `pdfs/new/*.pdf` → `imports/new/`.
   - Preserve filenames; log counts for markdown vs PDFs.
3. Ensure placeholder files exist:
   - Create `references/index.md` and `references/tags.md` if missing.
   - Touch `.gitkeep` in newly created empty directories.
4. Emit a summary with key markers:
   ```
   MIGRATION_MARKDOWN_MOVED: <count>
   MIGRATION_PDFS_MOVED: <count>
   NEXT_STEP: Run ./flow.py import-document imports/new/*
   ```
5. Do not overwrite files already in the v2 layout; skip and warn if a
   target file exists.

## Output Markers
- `MIGRATION_MARKDOWN_MOVED: <count>`
- `MIGRATION_PDFS_MOVED: <count>`
- `MIGRATION_SKIPPED: <path>` (for duplicates)
- `NEXT_STEP: <instruction>`

## Post-Conditions
- v2 directory skeleton present with `.gitkeep` placeholders.
- Legacy assets staged in `imports/new/` ready for import.
- References index/tag files exist for metadata-maintenance.
