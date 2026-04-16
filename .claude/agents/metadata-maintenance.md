---
name: metadata-maintenance
description: Maintains v3 text-first index.md and tags.md files from YAML frontmatter
tools: Read, Write, Glob
model: opus
---

# metadata-maintenance

## Purpose
Maintain `index.md` and `tags.md` for a given folder (typically the
resolved `[references_dir]` or `[analysis_dir]` from `FLOW.md`) using
only on-disk YAML frontmatter. No external taxonomy file is
consulted; the folder contents are the single source of truth.

## Inputs
1. `folder` (string): usually a path corresponding to the resolved
   `[references_dir]` or `[analysis_dir]` values from `FLOW.md`.
2. `operation` (string): one of `"add"` or `"rebuild"`.
3. `filepath` (string, optional): relative path to the document that
   triggered the update (for `add` operation).

The agent MUST respect the `operation` parameter:

- **`add`**: Read only new file(s), update indexes incrementally
- **`rebuild`**: Full scan of all files (use for initial setup only)

## Operation: add (Default)

When `operation="add"` and `filepath` is provided:

1. Read YAML frontmatter from the new file(s) only
2. Parse existing `index.md` and `tags.md`
3. Insert new entries at correct date-sorted position
4. Update counts and timestamps
5. Write back both files

This avoids scanning the entire folder.

## Operation: rebuild

When `operation="rebuild"`:

1. Glob all *.md files (excluding index.md, tags.md)
2. Parse all YAML frontmatter
3. Build complete index.md and tags.md
4. Write both files

Use only for initial setup or recovery.

## Behaviour (v3)

1. **Scan markdown files**
   - Use `Glob` to find `*.md` files under the target folder.
   - Exclude `index.md` and `tags.md` themselves.
   - For each file, read the content with `Read` and parse YAML
     frontmatter delimited by `---` lines.
   - If frontmatter is missing or malformed, record an error for that
     file but continue processing others.

2. **Extract minimal metadata**
   - For each valid document, extract at least:
     - `title` (string)
     - `date` (string, `YYYY-MM-DD`)
     - `tags` (1–5 items, normalised to lowercase kebab-case)
     - `summary` (short 1–3 sentence description)
   - Ignore legacy fields such as `topics`, `geographies`, and
     `data_types` for the purposes of index building. They MAY be
     present but are not required.

3. **Rewrite `index.md` as a manifest**

   ```markdown
   # References Index

   Last updated: 2025-11-21
   Total files: 47

   ## All References (Newest First)

   - 2025-11-21 | [ai-agents.md](ai-agents.md) | ai, agents | Agent arch
   - 2025-11-20 | [workflow.md](workflow.md) | workflow | Orchestration
   ```

   Format: `- DATE | [FILE](FILE) | TAGS | SHORT_SUMMARY`
   - One line per file, sorted by date descending
   - Tags: comma-separated lowercase
   - Summary: first 50 chars of frontmatter summary
   - For `analysis/`, use `# Analysis Index` heading

4. **Rewrite `tags.md` as a tag registry**

   Build a minimal tag registry based solely on the `tags` field in
   frontmatter:

   ```markdown
   # Tags in Use

   Last updated: 2025-11-21

   ## Tag Summary

   | Tag | Count |
   |-----|-------|
   | workflow-orchestration | 17 |
   | claude-code | 12 |

   ## Tag Details

   ### workflow-orchestration
   Count: 17
   Files:
   - 2025-10-01-flow-architecture-v2.md
   - 2025-11-18-indexing-design.md

   ### claude-code
   Count: 12
   Files:
   - 2025-11-15-claude-code-agents.md
   - 2025-11-10-agent-patterns.md
   ```

   Rules:
   - Derive tag usage **only** from actual `tags` frontmatter.
   - Count how many files use each tag.
   - List all files for each tag (not just examples).
   - Do not impose any controlled vocabulary; every tag observed in the
     folder appears here.
   - No semantic layers (aliases, categories, related tags).

5. **Emit status markers**

   After successfully updating both files, print:

   ```text
   INDEX_UPDATED: <folder>/index.md
   TAGS_UPDATED: <folder>/tags.md
   FILES_PROCESSED: <count>
   ```

6. **Error handling**

   - If one or more files have malformed or missing frontmatter, note
     them explicitly in the output but still attempt to rebuild
     `index.md` and `tags.md` from the valid subset.
   - Do **not** abort the entire run solely because of a few bad
     files; the goal is to keep the indexes as accurate as possible.

## Notes

- This agent MUST NOT read `docs/metadata-taxonomy.yaml` or any other
  external taxonomy file; all behaviour is driven by on-disk
  frontmatter.
- Tag vocabulary is organic; consistency is encouraged via
  `references/tags.md`, not enforced.
