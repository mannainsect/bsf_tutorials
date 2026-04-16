---
argument-hint: [folder (default: references)]
description: Validate v3 YAML metadata schema for markdown files in a folder
allowed-tools: [Execute]
model: opus
---

# /research:validate-metadata

## Purpose
Run the v3 metadata validation script over a folder of markdown files
and surface any structural errors in their YAML frontmatter.

Validation is **schema-only** and does **not** enforce any external
taxonomy file. New tags are always allowed.

## Expected YAML Schema (v3)

Each reference or analysis markdown file should begin with YAML
frontmatter matching this minimal schema:

```yaml
---
title: "Short descriptive title"           # required, non-empty
date: "YYYY-MM-DD"                        # required
language: "en"                            # required for new imports
source_language: "fi"                     # optional, original language
source: "web"                             # required: free string such as
                                           # web|import|analysis|report|internal
tags:                                      # required: 1–5 tags
  - workflow-orchestration
  - claude-code
summary: >-                                 # required: non-empty
  One or two sentences capturing the essence of the document.
related:                                    # optional, file paths
  - references/2025-01-01-example.md
---
```

Script semantics (see `docs/UPGRADE_v3.md` §6.2):

- Required fields: `title`, `date`, `tags`, `source`, `summary`.
- `date` must match `YYYY-MM-DD`.
- `tags` may be a string or list; they are normalised to lowercase
  kebab-case for validation. After normalisation there must be **1–5**
  tags. Any tag vocabulary is allowed.
- `related` entries (when present) must point to existing files on disk.

## Context Discovery

Before running validation:

1. Read `FLOW.md` Section 1: Critical Directories to resolve
   `[references_dir]` (default `references/`) and
   `[analysis_dir]` (default `analysis/`). Use these when the folder
   argument is omitted or when the user passes logical names like
   `references` or `analysis`.
2. Verify that the target folder (default `[references_dir]`) exists
   and contains markdown files with YAML frontmatter.
3. Ensure the validation script
   `.claude/scripts/indexing/validate_metadata.py` is present and
   executable from the repository root.
4. Optionally review `docs/UPGRADE_v3.md` §3.1 and §6.2 so that any
   reported errors can be interpreted against the current v3 schema.

## Inputs
- `folder` (string, default logical `references`): target directory
  containing markdown files with YAML frontmatter. When omitted,
  treat this as `[references_dir]` resolved from FLOW.md.

## Steps
1. Accept the folder argument; when empty, default to the resolved
   `[references_dir]` path. If the user passes logical names
   `references` or `analysis`, map them to `[references_dir]` or
   `[analysis_dir]` respectively.
2. Execute `uv run .claude/scripts/indexing/validate_metadata.py <folder>`
   from the repository root.
3. If the script exits non-zero, display the reported `ERRORS` section,
   including all `ERROR_FILE` markers grouped by file path.
4. When validation succeeds, surface the `VALID_METADATA` marker and a
   brief note that the folder is compliant.
5. Always include return code and runtime in the summary block.

## Output Markers
- `VALID_METADATA: <folder>`
- `VALIDATION_ERRORS: <count>`
- `ERROR_FILE: path/to/file.md`

## Post-Conditions
- No files are modified; the command only reports validation status.
- Exit code mirrors the script result (0 on success, 1 on failure).
