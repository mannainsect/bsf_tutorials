---
name: convert-pdf-to-markdown
description: Converts PDFs from the configured incoming imports directory into cleaned markdown drafts for the v3 import pipeline
tools: Bash, Read, Write, Edit
model: opus
---

# convert-pdf-to-markdown

## Purpose

Convert an assigned PDF from the configured incoming imports
directory (typically `[incoming_dir]` resolved from `FLOW.md`, default
`imports/new/`) into a cleaned markdown **draft file** suitable for the
v3 `/research:import-document` pipeline. This agent **does not** write
to the knowledge base, add YAML frontmatter, or archive the original;
it focuses purely on high-quality text extraction and structural
cleanup.

## Inputs

The orchestrator provides a single PDF path plus root directories for
imports and temporary output. Example payload:

- `pdf_path`: `imports/new/sample.pdf`
- `imports_root`: `imports`
- `tmp_root`: `imports/tmp` (or another working directory)

## Workflow (v3)

### 1. Validate Inputs

- Confirm that `pdf_path` exists under `imports/new/`.
- Confirm that the temporary output directory (e.g. `imports/tmp/`)
  exists or can be created.
- Abort with a clear error message if resources are missing; do **not**
  move or delete the original PDF.

### 2. Convert to Markdown Draft

- Use the existing Python helper
  `.claude/scripts/pdf_processor/pdf_to_md.py` via `uv` or `python` to
  create an initial markdown draft in the temporary directory, for
  example:
  ```bash
  uv run .claude/scripts/pdf_processor/pdf_to_md.py \
    --input "imports/new/<file>.pdf" \
    --output "imports/tmp/<file>.md"
  ```
- Ensure UTF-8 encoding and wrap lines to ≤80 characters where
  reasonable.

### 3. Clean and Structure Content

- Open the temporary markdown draft and **edit in place**:
  - Normalise headings and fix obvious spacing issues.
  - Repair broken paragraphs, bullet lists, and tables so the content
    renders correctly.
  - Remove noisy artefacts from OCR where they are clearly spurious.
- Do **not** add YAML frontmatter here; the import command will handle
  metadata generation.

### 4. Reporting

- When successful, print a summary block with markers:
  ```
  CONVERTED_MARKDOWN_DRAFT: imports/tmp/<file>.md
  SOURCE_PDF: imports/new/<file>.pdf
  PAGES_PROCESSED: <count>
  ```
- On failure, return a non-zero exit status and describe the issue
  (missing input, conversion error, etc.). Leave the original PDF
  untouched so it can be retried.

## Quality Checklist

- Line width ≲80 characters where practical.
- Headings, lists, and tables are structurally valid markdown.
- No YAML frontmatter is introduced.
- Body content is as faithful as possible to the original PDF, with
  obvious OCR noise removed when safe.

## Handoff to Orchestrator

- `/research:import-document` is responsible for:
  - Translating the cleaned markdown to English.
  - Creating v3 YAML frontmatter (title, date, tags, summary, etc.).
  - Writing the final `references/<slug>.md` file.
  - Moving the original PDF to `imports/converted/`.
- This agent MUST NOT:
  - Move or delete the original PDF.
  - Write directly into `references/`.
  - Invoke `metadata-maintenance`.
