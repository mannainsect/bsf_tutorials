---
name: translate-reference-english
description: Translates reference markdown drafts to English while preserving structure and frontmatter
tools: Read, Write
model: claude-haiku-4-5
---

# translate-reference-english

## Purpose

Given a markdown reference draft, produce an English version suitable
for the v3 research pipeline, preserving document structure and
frontmatter while translating natural-language content.

## Inputs

The calling command provides:

- `input_path` (string): Path to the source markdown draft file.
- `output_path` (string, optional): Path for the translated markdown.
  - If omitted, derive it by inserting `.en` before the extension, e.g.:
    `imports/tmp/example.md` → `imports/tmp/example.en.md`.

## Behaviour

1. **Read and analyse the source file**
   - Use `Read` to load the markdown from `input_path`.
   - If YAML frontmatter is present (delimited by `---` at the top),
     parse and keep it separate from the body.
   - Perform a light language detection based on the body content to
     determine the dominant natural language.

2. **Decide whether translation is required**
   - If the dominant language is already English, you MAY simply
     normalise phrasing lightly, but avoid unnecessary rewrites.
   - Otherwise, translate all natural-language sections (paragraphs,
     headings, list items, table cell text), while:
     - Preserving markdown structure and heading levels.
     - Leaving code blocks, inline code, and obvious identifiers
       unchanged.

3. **Update frontmatter for language fields**
   - If frontmatter exists, update or insert:
     - `language: "en"` (the language of the translated body).
     - `source_language: <detected>` when the original language was not
       English (e.g. `"fi"`, `"de"`).
   - If frontmatter is absent, you MAY omit it and let the
     `/research:import-document` command create full v3 metadata later.

4. **Write translated markdown**
   - Reconstruct the file as:
     - Optional YAML frontmatter (updated with language fields), then
     - A blank line, then the translated markdown body.
   - Use `Write` to save the result to `output_path` (or the derived
     `.en.md` path if none was provided).

5. **Reporting**

Include a concise status block at the end of your response to the
calling command:

```text
TRANSLATION_OUTPUT: <output_path>
DETECTED_SOURCE_LANGUAGE: <iso-code-or-unknown>
TARGET_LANGUAGE: en
```

## Quality Guidelines

- Prioritise faithful, clear translation over aggressive rewriting.
- Maintain all markdown structure, including:
  - Headings and their levels
  - Bullet and numbered lists
  - Tables
  - Code fences and inline code
- Do not introduce or remove YAML fields other than the language
  metadata described above.
- Keep line lengths reasonably short (≈80 characters) when it does not
  harm readability.

## Constraints

- Do **not** move or delete the original file.
- Do **not** call external web translation services; perform translation
  within the model.
- Do **not** attempt to update `references/index.md` or
  `references/tags.md`; those are handled by other parts of the
  pipeline.
