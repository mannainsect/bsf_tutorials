argument-hint: [path or glob pattern] [--max N] [--toc] [--no-translate]
description: Import files into references/ as English markdown with v3 YAML metadata
allowed-tools: [Glob, Read, Edit, Execute, Write, Task]
model: opus
---

# /research:import-document

## Purpose

Import one or more files from the configured incoming imports
directory into the internal knowledge base as clean, English markdown
with v3 YAML frontmatter, then update the corresponding `index.md` and
`tags.md` files.

## Context Discovery

Before importing, gather minimal context:

1. Read `FLOW.md` Section 1: Critical Directories to resolve:
   - `[imports_root]` (default `imports/`)
   - `[incoming_dir]` (default `imports/new/`)
   - `[converted_dir]` (default `imports/converted/`)
   - `[references_dir]` (default `references/`)
   Use these resolved paths instead of hardcoded defaults.
2. Read `[references_dir]/tags.md` if it exists, so you can
   preferentially reuse existing tags when generating frontmatter.
3. Optionally skim `FLOW.md` sections 1 and 10 for project/domain
   hints that can influence tag and summary generation.

## Inputs

- `path` (string): Filename or glob pattern targeting files inside
  `[incoming_dir]` (from FLOW.md, default `imports/new/`). Use `*` to
  match all files.
- `--max N` (integer, optional): Maximum number of files to process in
  this batch. Files are sorted by name and the first N are selected.
  Recommended values: 3-5 for PDFs, 10-15 for markdown.
- `--toc` (flag, optional): When present, generate a Table of Contents
  after the YAML frontmatter using `toc_helper.py`.
- `--no-translate` (flag, optional): When present, skip translation and
  keep the source language; otherwise, translate to English.

## High-Level Behaviour (v3)

1. Resolve inputs and flags, expanding any globs in
   `[incoming_dir]` to a concrete file list.
2. Normalise each file into markdown (via
   `convert-pdf-to-markdown` for PDFs, or direct reading for
   existing `.md`).
3. Translate content to English unless `--no-translate` is
   given **or the content is already English** (detected by
   sampling the first ~500 characters). Uses a dedicated
   `translate-reference-english` sub-agent when needed.
4. Generate or adapt v3 YAML frontmatter, preferring existing
   tags from `[references_dir]/tags.md` and constraining total
   tags to 1-5.
4.5. Check for duplicates against `[references_dir]/index.md`
   (exact source match, then normalized title fallback). Skip
   duplicates without writing or archiving.
5. Write final markdown files into `[references_dir]/` using a
   `YYYY-MM-DD-title-slug.md` pattern.
6. Move originals into `[converted_dir]/`.
7. Call `metadata-maintenance` once per batch to refresh
   `[references_dir]/index.md` and `[references_dir]/tags.md`.
8. Emit `IMPORT_PROGRESS` after each file with running counts.

## Detailed Steps

1. **Resolve and validate inputs**
   - Parse `$ARGUMENTS` into:
     - A list of path/glob tokens.
     - Flags: `--toc`, `--no-translate`.
     - Option: `--max N` (integer, default unlimited).
   - Expand globs relative to `[incoming_dir]`. If no files are
     resolved, prompt the operator for a specific filename or glob.
   - **Exclude placeholder files** listed in FLOW.md Section 1 → Import
     Pipeline → "Ignore files" (e.g., `.gitkeep`, `.placeholder`).
   - **Apply --max limit**: If `--max N` is specified:
     - Sort resolved files alphabetically by filename.
     - Keep only the first N files.
     - Report: `BATCH_LIMITED: Processing N of M files found`.

2. **Normalise files to markdown**
   - For each resolved source file:
     - If it is a PDF, delegate to the `convert-pdf-to-markdown`
       sub-agent, instructing it to:
       - Read the PDF from `[incoming_dir]`.
       - Produce a temporary markdown draft in a working location
         under `[imports_root]` (for example `[imports_root]/tmp/`),
         **not** in `[references_dir]/`.
       - Leave the original PDF in place; `import-document` will handle
         archiving to `[converted_dir]/`.
     - If it is already a markdown file, read its contents directly.

3. **Translate to English (unless `--no-translate` or English)**
   - **English detection**: Before delegating to translation,
     sample the first ~500 characters of the markdown body
     (after any frontmatter). If the sample is clearly English
     (Latin script, common English stop-words, no dominant
     non-English patterns), skip translation entirely:
     - Set `language: "en"` in frontmatter.
     - Do **not** set `source_language`.
     - Log: `TRANSLATION_SKIPPED: English detected`.
     - Continue to Step 4.
   - If translation is enabled and the content is not English,
     delegate to a `translate-reference-english` sub-agent
     (Haiku or Opus 4.6) via `Task`:
     - Tools: `Read`, `Write`.
     - Responsibilities:
       - Detect the dominant language of the markdown draft.
       - Translate natural-language sections to English while
         preserving structure, code blocks, and headings.
       - Return or write an English markdown version and report
         both `language` (set to `"en"`) and `source_language`
         (if detected).
   - If `--no-translate` is set, keep the original language but
     still ensure the frontmatter includes a `language` field
     describing it.

4. **Generate v3 frontmatter**
   - If the markdown already has YAML frontmatter, parse it and adapt
     it to the v3 schema:
     - Ensure required fields exist: `title`, `date`, `tags`, `source`,
       `summary`.
     - Add `language: "en"` and `source_language: <detected>` when
       translation occurred.
     - Migrate any legacy `topics`/`tags`/`geographies`/`data_types`
       without enforcing a taxonomy.
   - Otherwise, construct new frontmatter:
     - `title`: first `#` heading if present, else a humanised
       filename.
     - `date`: parse from filename or content; fallback to today.
     - `source`: set to `"import"`.
     - `language`: `"en"` (or the detected language when
       `--no-translate` is used).
     - `summary`: generate a 2–3 sentence abstract capturing the
       document’s essence.
     - `tags`:
       - Read `[references_dir]/tags.md` if it exists to obtain the
         current tag vocabulary.
       - Prefer 3–4 tags from this list that best match the document.
       - Introduce at most 1–2 new tags when necessary.
       - Normalise all tags to lowercase kebab-case.
       - Enforce `1 <= len(tags) <= 5`.

4.5. **Duplicate Detection**
   - Before writing the reference file, check for duplicates
     in `[references_dir]/index.md`:
     - **Exact match**: If the source URL or file path already
       appears in the index, the document is a duplicate.
     - **Normalized title fallback**: If no exact source match,
       normalize the candidate title (lowercase, strip
       punctuation, collapse whitespace) and compare against
       existing index titles using the same normalization.
   - If a duplicate is found:
     - Log: `DUPLICATE_SKIPPED: <source> matches <existing>`.
     - Do **not** write the reference file.
     - Do **not** archive the original (leave it in
       `[incoming_dir]` for operator review).
     - Increment the `skipped` counter and continue to the
       next file.

5. **Write final reference file**
   - Compute a slug from `date` and a kebab-case version of the title
     (e.g. `2025-11-21-ai-indexing.md`).
   - Write the English markdown plus v3 frontmatter to
     `[references_dir]/<slug>.md`.
   - If `--toc` is present, run:
     ```bash
     python .claude/scripts/indexing/toc_helper.py \
       [references_dir]/<slug>.md --insert
     ```
     to insert or refresh the Table of Contents.

6. **Archive originals**
   - After successfully writing each reference file, move the original
     source into `[converted_dir]/`, preserving the basename to avoid
     re-processing.

7. **Update indexes**
   - Collect list of newly created filenames from step 5.
   - Call `metadata-maintenance` once using `Task` with:
     - `folder`: resolved `[references_dir]` (default `"references"`)
     - `operation`: `"add"`
     - `filepath`: comma-separated list of new filenames
   - Example prompt:
     ```
     Update index for imported files.
     folder: references
     operation: add
     filepath: 2025-12-18-doc1.md, 2025-12-18-doc2.md
     ```
   - Verify output contains `INDEX_UPDATED:`
   - If indexing fails, report the error but continue (files are
     imported; run `/research:index-build` manually to fix index).

8. **Reporting and errors**
   - Track per-file successes, skips, and failures.
   - **After each file** (imported, skipped, or failed), emit:
     - `IMPORT_PROGRESS: <processed>/<total> imported=<n>`
       `skipped=<n> errors=<n>`
     - where `processed` is files handled so far, `total` is
       the full batch count, `imported` counts successful
       writes, `skipped` counts duplicates and other skips,
       and `errors` counts failures.
   - For each successfully imported file, also emit:
     - `IMPORT_COMPLETE: [references_dir]/<slug>.md`
     - `ORIGINAL_ARCHIVED: [converted_dir]/<filename>`
   - After the batch, emit:
     - `INDEX_UPDATED: [references_dir]/index.md`
     - `TAGS_UPDATED: [references_dir]/tags.md`
     - `IMPORT_ERRORS: <count>` (only when failures occur).
   - If a file fails validation or cannot be processed, surface a clear
     error and leave the original in `[incoming_dir]` to avoid data
     loss.

## Output Markers

- `BATCH_LIMITED: Processing N of M files`
  (when --max limits selection)
- `TRANSLATION_SKIPPED: English detected`
  (when source is already English)
- `DUPLICATE_SKIPPED: <source> matches <existing>`
  (when duplicate detected in index)
- `IMPORT_PROGRESS: <processed>/<total> imported=<n>`
  `skipped=<n> errors=<n>` (after each file)
- `IMPORT_COMPLETE: [references_dir]/<slug>.md`
- `ORIGINAL_ARCHIVED: [converted_dir]/<name>`
- `INDEX_UPDATED: [references_dir]/index.md`
  (from metadata-maintenance)
- `TAGS_UPDATED: [references_dir]/tags.md`
- `IMPORT_ERRORS: <count>` (only when failures occur)

## Post-Conditions

- New references are English (unless `--no-translate`), include v3
  frontmatter, and are immediately discoverable via
  `[references_dir]/index.md` and `[references_dir]/tags.md`.
- Originals are safely archived in `[converted_dir]/`.
- `metadata-maintenance` is invoked once per import batch to refresh
  indexes.
