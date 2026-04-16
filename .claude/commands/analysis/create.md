---
argument-hint: [topic] [--toc]
description: Generate metadata-compliant analysis from indexed knowledge
allowed-tools: [Glob, Grep, Read, Execute, Write, Task]
model: opus
---

# /analysis:create

## Purpose
Generate a metadata-compliant analysis markdown file by synthesising
findings from the indexed knowledge base and current references.

## Context Discovery

Before creating an analysis document, always:

1. Read `FLOW.md` sections 1, 3, and 10 to understand the project
   domain, research goals, and to resolve key directories:
   - `[references_dir]` (Internal Knowledge Base; default
     `references/`)
   - `[analysis_dir]` (Analysis workspace; default `analysis/`)
2. Read `[references_dir]/tags.md` (when present) to reuse existing
   tag vocabulary where possible.
3. Refer to `docs/UPGRADE_v3.md` §3.1 for the v3 YAML frontmatter
   schema so the generated analysis files remain consistent with
   references.

## Inputs
- `topic` (string): Analysis subject or brief provided by the operator.
- `--toc` (flag, optional): Insert a generated Table of Contents after
  the YAML frontmatter using `toc_helper.py`.

## Steps
1. Prompt for topic when argument empty; normalise to kebab-case slug.
2. Run `/research:index-query "<topic>" --limit 8` to shortlist
   relevant reference files.
3. Read shortlisted documents plus any explicitly related analyses to
   extract key insights, quantitative data, and contradictions.
4. Draft analysis structure:
   - Executive summary (2-3 paragraphs)
   - Insights grouped by themes
   - Data tables (if numerical comparisons present)
   - Implications and recommended follow-ups
5. Build v3 YAML frontmatter following the minimal schema:
   ```yaml
   ---
   title: "<Analysis topic>"
   date: "{{ today YYYY-MM-DD }}"
   language: "en"
   source: "analysis"
   tags:
     - <tag-from-sources>
     - <tag-from-sources>
     - analysis
   summary: >-
     2-3 sentence synthesis of key findings, insights, and
     implications derived from the reviewed reference materials.
   related:
     - [references_dir]/source-file-1.md
     - [references_dir]/source-file-2.md
   ```
   Tag selection rules:
   - Reuse 2–3 tags from the shortlisted reference files when
     possible.
   - Always include the `analysis` tag.
   - Keep the total number of tags between 1 and 5, normalised to
     lowercase kebab-case.
6. Write the analysis to `[analysis_dir]/<slug>.md` with YAML
   frontmatter.
   When the `--toc` flag is present, execute:
   ```bash
   python .claude/scripts/indexing/toc_helper.py \
     [analysis_dir]/<slug>.md --insert
   ```
   to refresh the Table of Contents before continuing.
7. Call metadata-maintenance with `folder` set to the resolved
   `[analysis_dir]` folder name (default `"analysis"`),
   `operation="add"`, and the new filename to refresh indexes and tag
   catalogues.
8. Return markers:
   ```
   ANALYSIS_COMPLETE: [analysis_dir]/<slug>.md
   TOPICS_IDENTIFIED: ["topic1", "topic2"]
   TAGS_ADDED: ["tag-one", "analysis"]
   INDEX_UPDATED: analysis/index.md
   ```

## Output Markers
- `ANALYSIS_COMPLETE: [analysis_dir]/<slug>.md`
- `TOPICS_IDENTIFIED: [...]`
- `TAGS_ADDED: [...]`
- `INDEX_UPDATED: analysis/index.md`

## Post-Conditions
- New analysis markdown stored in `[analysis_dir]/` with valid
  metadata.
- Analysis index/tag files updated via metadata-maintenance.
- Related references captured for traceability.
