argument-hint: [query string or task filename]
description: Search internal knowledge base and create temp summary
allowed-tools: [Glob, Grep, Read, Bash, Write, Task]
model: claude-opus-4-6
---

# Search Internal Knowledge Base

You are searching the internal knowledge base (configured
`[references_dir]` directory) to understand what is ALREADY KNOWN
about a research topic.

## Context

Read FLOW.md Sections 1, 3, 10 before starting.

## Context Discovery

Before performing an internal search:

1. Read `FLOW.md` sections 1, 3, and 10 to understand the project
   scope and research objectives and to resolve
   `[references_dir]` (Internal Knowledge Base; default
   `references/`). Always use this resolved path instead of
   hardcoded defaults.
2. Check whether `[references_dir]/index.md` exists; if it does,
   prefer the v3 `/research:index-query` pipeline for candidate
   selection.
3. When available, skim `[references_dir]/tags.md` to understand key
   topics and terminology used across the knowledge base.

## Input

Receive: Query string OR task filename

Examples:
- "AI agent frameworks"
- "tasks/001-research-ai-agents.md"

## Your Task (v3)

1. **Normalise the query**
   - If a task filename is provided, read it and extract the core
     research question plus 3–7 key keywords.
   - Otherwise, treat `$ARGUMENTS` as the query string and derive
     keywords directly from it.

2. **Stage 1 – Candidate selection via `/research:index-query`**
   - Prefer using the v3 index-first search pipeline:
     - Run `/research:index-query "<query>" --limit 20`.
     - Parse the resulting `RELEVANT_FILES` list from its output.
   - If `/research:index-query` fails because
     `[references_dir]/index.md` is missing or unreadable, fall back
     to a simple ripgrep-based discovery over `[references_dir]`
     using the derived keywords.

3. **Stage 2 – Deep internal triage over candidate files**
   - From the `RELEVANT_FILES` list produced by `/research:index-query`,
     select the top subset (typically 10–20 files).
   - For each selected file under `[references_dir]/`:
     - Read the YAML frontmatter and the first ~150–200 lines of
       content.
     - Extract the most important findings relevant to the query.
     - Note any clear gaps or contradictions across files.

4. **Stage 3 – Internal summary creation**
   - Synthesize a single markdown summary capturing:
     - What is already known (grouped by subtopic).
     - Open questions and knowledge gaps.
     - The list of source files reviewed.
   - Record search start/end timestamps in the summary for basic
     performance tracking.

## Output Format

Create temporary summary file:
**Location**: `/tmp/internal-summary-[TIMESTAMP]-[topic-slug].md`

**Content**:
```markdown
# Internal Knowledge Summary: [Topic]

**Search Date**: YYYY-MM-DD
**Search Duration**: [ms]
**Files Reviewed**: [N] files in [references_dir]
**Search Keywords**: [keyword1, keyword2, keyword3]

---

## What We Already Know

[Synthesized summary of existing knowledge from [references_dir]]

### [Subtopic 1]
- [Finding from file X]
- [Finding from file Y]

### [Subtopic 2]
- [Finding from file Z]

---

## Knowledge Gaps

[Areas NOT covered in existing [references_dir]]
- [Gap 1 requiring web research]
- [Gap 2 requiring web research]

---

## Source Files Reviewed

- references/web-topic1-2025-01-15.md
- references/web-topic2-2025-01-10.md
- references/pdf-document-2025-01-05.md
```

## Critical Requirements

- Output to `/tmp/` directory (NOT references/)
- Filename: `internal-summary-[UNIX_TIMESTAMP]-[topic-slug].md`
- Line length: ≤80 characters
- Summarize existing knowledge (don't duplicate files)
- Identify gaps for web research

## Assistant Output (Minimal)

**CRITICAL**: Your response to the user must be MINIMAL. Only output:

```
INTERNAL_SUMMARY: /tmp/internal-summary-[timestamp]-[topic].md
```

Do NOT include:
- Detailed analysis or findings in your response
- Long explanations
- Summary of what you found
- Knowledge gaps discussion

All analysis and findings stay IN THE FILE. Only return the filename
marker.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
