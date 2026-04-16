---
argument-hint: [folder_path (default:report)] [guidance]
description: Create final distilled report from directory of reports
allowed-tools: [Glob, Read, TodoWrite, Task, Write]
model: opus
---

# Create Final Report

You are coordinating the creation of a final distilled report from a
directory of source reports. You orchestrate the work but DO NOT write
content yourself - delegate to the write-report sub-agent. ultrathink.

## Context

Read FLOW.md to understand project context, goals and description.

## Input

Arguments (space or comma separated):

- folder_path: Directory containing source reports (default: reports/,
  customizable via FLOW.md)
- guidance: Instructions for final report (length, style, focus), which
  improve and override the FLOW.md and default guidance when in conflict.

Examples:

- "reports/ Create 10-page executive summary focusing on key findings"
- "reports/ Condense to 5 pages, technical audience, emphasize data"
- "reports/" (uses default guidance: comprehensive distillation)

## Understanding Folder Hierarchy

The source directory follows a hierarchical content organization:

**Structure:**
```
report/                          <- folder_path root
├── introduction.md              <- H1 level: Main topic
├── methodology/                 <- H1 level: Main topic folder
│   ├── overview.md              <- H2 level: Sub-topic
│   ├── data-collection.md       <- H2 level: Sub-topic
│   └── analysis/                <- H2 level: Sub-topic folder
│       ├── statistical.md       <- H3 level: Detailed content
│       └── qualitative.md       <- H3 level: Detailed content
└── results/                     <- H1 level: Main topic folder
    ├── findings.md              <- H2 level: Sub-topic
    └── validation/              <- H2 level: Sub-topic folder
        └── testing.md           <- H3 level: Detailed content
```

**Topic Levels:**
- **H1 (Depth 1)**: Root folder files or top-level folders represent
  main report sections
- **H2 (Depth 2)**: First sub-folder files break H1 topics into
  sub-sections
- **H3 (Depth 3)**: Second sub-folder files provide detailed content
  for H2 topics

**Why This Matters:**
- Context limits require processing ONE file at a time
- Each file needs hierarchical context (where it belongs: H1 > H2 > H3)
- Audience guidance affects detail extraction differently by depth:
  - CEO/Executive + H3 file = extract 2-3 key sentences only
  - Technical + H3 file = preserve full detail
  - CEO/Executive + H1 file = full section appropriate to audience

## Your Task

### Step 1: Parse Input

Extract from arguments:

- `folder_path`: Directory to process (default: reports/, read from
  FLOW.md if available). Can include sub folders with files.
- `guidance`: Report creation guidance (default: "Create comprehensive
  distilled report preserving key findings and insights")

Handle various input formats:

- Single argument: treat as folder_path, use default guidance
- Two+ arguments: first is folder_path, rest is guidance

### Step 2: Read FLOW.md Context

Extract comprehensive context for sub-agent:

- Section 1: Project name and purpose
- Section 10 (if exists): Project scope, goals, target audience
- Any section mentioning: Report requirements, audience, stakeholders
- Writing standards or preferences (tone, style, formality)
- Project priorities and key objectives
- Determine project root directory

Parse audience from guidance (USER GUIDANCE OVERRIDES FLOW.MD):

- PRIORITY 1: User guidance - parse keywords from provided guidance
- PRIORITY 2: FLOW.md defaults - use if guidance is vague/generic
- Look for keywords: "technical", "executive", "CEO", "engineers",
  "funding", "stakeholders", "comprehensive", "summary", "brief"
- Determine audience type: Technical, Executive, Funding, or General
- Extract detail level: High-level summary, Detailed analysis,
  Comprehensive coverage
- Note any specific focus areas mentioned
- If guidance is specific, it OVERRIDES any FLOW.md defaults
- FLOW.md provides baseline; user guidance is the override/refinement

### Step 3: Inventory Source Files and Parse Hierarchy

Use Glob to discover all markdown files:

- Pattern: `{folder_path}/**/*.md`
- Recursive search through all subdirectories
- Sort files by path for systematic processing
- Skip index files (000-*.md, *index.md) if present

Parse hierarchical structure and map each file to its topic levels:

**Hierarchy rules:**
- Root folder files/folders = Heading 1 (H1) main topics
- First-level sub-folders = H1 topic containing H2-level files
- Second-level sub-folders = H2 topic containing H3-level files

For each file, extract:
- **H1 Topic**: Root folder or top-level folder name
- **H2 Topic**: First sub-folder name (if applicable)
- **H3 Level**: Second sub-folder name (if applicable)
- **Hierarchy Depth**: 1 (root), 2 (sub-folder), or 3 (nested)

Example mappings:
```
report/introduction.md
  -> H1: "introduction", H2: None, H3: None, Depth: 1

report/methodology/data-collection.md
  -> H1: "methodology", H2: "data-collection", H3: None, Depth: 2

report/methodology/analysis/statistical-methods.md
  -> H1: "methodology", H2: "analysis", H3: "statistical-methods",
     Depth: 3
```

Create inventory summary:
- Total files found
- Files by hierarchy depth (H1: X, H2: Y, H3: Z)
- H1 topics identified (unique root folders/files)
- Directory structure overview

### Step 4: Create Task List

Use TodoWrite to create task list with ONE task per individual file:

- **CRITICAL**: Each task handles EXACTLY ONE file, never a directory
- Task format: "Distill {filename} (H1: {topic}, H2: {topic}, Depth:
  {N})"
- Process files sequentially, one at a time
- Each sub-agent invocation reads and processes only ONE file
- Even with 20+ files, each gets its own task and sub-agent call
- Final task: "Validate final report quality"

Example tasks:
```
1. Distill report/intro.md (H1: intro, Depth: 1)
2. Distill report/methods/overview.md (H1: methods, H2: overview,
   Depth: 2)
3. Distill report/methods/stats/regression.md (H1: methods, H2: stats,
   H3: regression, Depth: 3)
...
21. Validate final report quality
```

### Step 5: Determine Final Report Name

Generate filename based on project, audience, and timestamp:

- Pattern: `final-report-{project-name}-{audience-type}-YYYY-MM-DD-
HHMMSS.md`
- Extract project name from FLOW.md Section 1
- Use audience type parsed in Step 2 (e.g., "technical", "executive",
  "funding", "general")
- Use today's date and current time for uniqueness
- Place at project root
- NO ERROR if similar files exist - allows multiple versions
- Examples:
  - `final-report-myproject-executive-2025-01-15-143022.md`
  - `final-report-myproject-technical-2025-01-15-150133.md`
  - `final-report-myproject-funding-2025-01-16-091544.md`

### Step 6: Initialize Final Report

Create initial structure with Write tool including YAML frontmatter,
metadata, and table of contents:

```markdown
---
title: "Final Report: {Project Name}"
generated: YYYY-MM-DD HH:MM:SS
source_directory: {folder_path}
source_documents: {N}
target_audience: {parsed_audience}
detail_level: {detail_level}
report_type: {type - e.g., "executive", "technical", "funding",
"comprehensive"}
project:
  name: {project_name}
  purpose: {project_purpose}
  goals: {project_goals if available}
  scope: {project_scope if available}
metadata:
  tone: {tone}
  focus_areas: {specific_focus from guidance}
  user_guidance: {full guidance provided by user}
  style_guidelines: {audience-specific guidelines}
version: 1.0
---

# Final Report: {Project Name}

## Table of Contents

<!-- AI Navigation: Use section headings below to jump to specific
content -->

1. [Executive Summary](#executive-summary)
2. [Overview](#overview)
3. [Key Findings](#key-findings)
4. [Detailed Analysis](#detailed-analysis)
   - [Subsections will be added by write-report agent]
5. [Conclusions](#conclusions)
6. [Appendix](#appendix)

---

## Report Metadata

**Quick Reference for AI Agents and Readers**

| Attribute | Value |
|-----------|-------|
| **Generated** | YYYY-MM-DD HH:MM:SS |
| **Source Directory** | {folder_path} |
| **Source Documents** | {N} files |
| **Target Audience** | {parsed_audience} |
| **Detail Level** | {detail_level} |
| **Report Type** | {report_type} |
| **Tone** | {tone} |
| **Focus Areas** | {specific_focus from guidance} |

**Project Context:**

- **Project**: {project_name}
- **Purpose**: {project_purpose}
- **Goals**: {project_goals if available}
- **Scope**: {project_scope if available}

**User Guidance Provided:**
> {full guidance provided by user}

**Style Guidelines Applied:**
{audience-specific guidelines that were provided to sub-agent}

---

## Executive Summary

<!-- AI Agent: High-level overview of entire report, 1-2 paragraphs -->

[Content will be synthesized by write-report agent]

---

## Overview

<!-- AI Agent: Context and background, establishes foundation -->

[Content will be integrated by write-report agent]

---

## Key Findings

<!-- AI Agent: Primary discoveries and insights, bulleted or
     numbered -->

[Content will be integrated by write-report agent]

---

## Detailed Analysis

<!-- AI Agent: In-depth examination organized by topic hierarchy -->

[Content will be integrated by write-report agent]

---

## Conclusions

<!-- AI Agent: Summary of implications and recommendations -->

[Content will be integrated by write-report agent]

---

## Appendix

<!-- AI Agent: Supporting materials, references, additional data -->

### Source Documents

This report was synthesized from {N} source documents located in
`{folder_path}`.

### Generation Information

- **Generated by**: Claude Code write-report workflow
- **Timestamp**: YYYY-MM-DD HH:MM:SS
- **Source files processed**: {N}
- **Processing method**: Hierarchical distillation with
  audience-specific detail adjustment

---

_End of Report_
```

### Step 7: Process Each Source File Individually

**CRITICAL**: Process ONE file per sub-agent invocation. Never batch
files.

For each source file in task list:

1. Mark task as in_progress using TodoWrite
2. Extract hierarchical context for this specific file from Step 3
   mapping
3. Invoke write-report sub-agent using Task tool with prompt:

```
You are updating a final distilled report. Read and process ONLY the
single file specified below.

REFERENCE FILE: {source_file_path}
FINAL REPORT: {final_report_path}

TOPIC HIERARCHY CONTEXT:
This file's position in the content hierarchy:
- **H1 Topic** (Main topic): {h1_topic_name}
- **H2 Topic** (Sub-topic): {h2_topic_name or "N/A"}
- **H3 Level** (Detail level): {h3_level_name or "N/A"}
- **Hierarchy Depth**: {depth - 1, 2, or 3}

Where to place this content in the final report:
{Provide specific guidance based on depth and audience:

  Depth 1 (H1 level file):
    "This is a main topic. Create or enhance the H1 section '{h1_topic}'
    in the final report."

  Depth 2 (H2 level file):
    "This is a sub-topic under '{h1_topic}'. Integrate into the H2
    subsection '{h2_topic}' within the '{h1_topic}' section."

  Depth 3 (H3 level file):
    "This is detailed content under '{h1_topic}' > '{h2_topic}'.

    For Executive/CEO audience: Extract only key insights (2-3
    sentences) to enhance the parent H2 section '{h2_topic}'.

    For Technical/Comprehensive audience: Create H3 subsection
    '{h3_level}' under '{h1_topic}' > '{h2_topic}' with appropriate
    detail.

    For Funding audience: Preserve methodology and evidence, integrate
    into '{h2_topic}' section."}

PROJECT CONTEXT:
Project: {project_name}
Purpose: {project_purpose from FLOW.md}
Goals: {project_goals from FLOW.md Section 10 or relevant sections}
Scope: {project_scope summary}

AUDIENCE & STYLE:
Target Audience: {parsed_audience - e.g., "Technical engineers",
"Executive leadership (CEO level)", "Funding agency reviewers",
"General stakeholders"}
Detail Level: {detail_level - e.g., "High-level summary (5 pages)",
"Detailed technical analysis", "Comprehensive coverage"}
Tone: {tone - e.g., "Technical and precise", "Executive-friendly
with minimal jargon", "Formal and comprehensive"}
Focus Areas: {specific_focus from guidance}

WRITING GUIDELINES FOR THIS AUDIENCE:
{Provide audience-specific instructions, e.g.:
  For Technical: "Use technical terminology, include implementation
  details, emphasize architecture and data. Preserve technical depth."
  For Executive: "Minimize jargon, focus on business impact and ROI,
  emphasize key findings and recommendations. Be concise. For H3 files,
  extract only 2-3 key sentences."
  For Funding: "Comprehensive coverage, emphasize methodology,
  outcomes, and impact. Include all supporting evidence."
  For General: "Balance technical accuracy with accessibility,
  explain concepts clearly, focus on insights and implications."}

DETAIL LEVEL ADJUSTMENT BY HIERARCHY:
{Provide depth-specific guidance:
  "H1 files: Full section treatment appropriate to audience
  H2 files: Subsection treatment, balanced detail
  H3 files:
    - For Executive/CEO: 2-3 sentence summary only
    - For Technical: Full subsection with details
    - For Funding: Preserve evidence, integrate appropriately"}

DISTILLATION GUIDANCE:
{guidance provided by user}

INSTRUCTIONS:
- Read ONLY the single reference file specified above
- Extract content relevant to audience and focus areas
- Apply detail level based on BOTH audience and hierarchy depth
- Read the current final report to understand structure
- Identify the section based on topic hierarchy (H1/H2/H3)
- Create section structure if it doesn't exist
- Update Table of Contents when adding new sections/subsections
- Add AI navigation comments (<!-- AI Agent: ... -->) to new sections
- Distill and integrate maintaining narrative flow and audience tone
- For H3 files with Executive audience: extract minimal key insights
- For H3 files with Technical audience: preserve appropriate detail
- Preserve critical data, citations, and evidence
- Avoid duplication with existing content
- Use language and style appropriate for target audience
- Follow 80-character line limit strictly
- Update content using Edit tool for targeted changes

TABLE OF CONTENTS UPDATES:
- When adding new H2 sections under "Detailed Analysis", update the
  TOC
- Format: "   - [Section Name](#section-name)" under item 4
- Maintain alphabetical or logical order
- Keep TOC synchronized with actual report structure

Return brief summary confirming completion.
```

4. Wait for sub-agent completion
5. Mark task as completed using TodoWrite
6. Continue to next file (do NOT batch multiple files)

### Step 8: Final Validation

Mark validation task as in_progress.

Read final report and verify:

- YAML frontmatter present and complete
- Table of Contents accurate and up-to-date
- All TOC links functional (match actual section headings)
- AI navigation comments present in major sections
- 80-character line limit maintained
- Proper markdown formatting
- All sections populated (no placeholder text)
- Content flows logically
- Metadata table accurate and complete
- Appendix contains generation information

If issues found:

- Invoke write-report agent once more with specific fix instructions
- Common fixes needed:
  - Update TOC to match actual sections
  - Add missing AI navigation comments
  - Fix line length violations
  - Complete placeholder sections

Mark validation task as completed.

### Step 9: Output Result

Return ONLY the marker line:

```
FINAL_REPORT_CREATED: {final-report-filename.md}
```

No additional explanation or summary.

## Critical Requirements

- DO NOT write report content yourself - delegate to sub-agent
- Use TodoWrite to track all tasks
- Process files ONE AT A TIME - never batch multiple files
- Each sub-agent call processes EXACTLY ONE file, never a directory
- Parse and track folder hierarchy (H1/H2/H3 topic structure)
- Include hierarchical context (H1 topic, H2 topic, depth) in each
  sub-agent prompt
- Provide complete self-contained context to sub-agent in each
  invocation
- Adjust detail extraction based on hierarchy depth + audience (e.g.,
  H3 files with CEO audience = 2-3 sentences only)
- Keep your own context minimal (coordination only)
- Final report must be at project root
- 80-character line limit mandatory
- YAML frontmatter required for structured metadata
- Table of Contents required and must stay synchronized
- AI navigation comments required in major sections
- Output marker required for workflow integration
- ALWAYS create new file (unique timestamp) - allows multiple versions
- User guidance OVERRIDES FLOW.md defaults for audience/style
- Include rich metadata header in created report for future updates

## Error Handling

- Missing folder_path: Default to report/
- Empty folder: Error with clear message
- Sub-agent failure: Report which file failed, exit gracefully

## Multiple Report Versions

This command supports creating multiple report versions from the same
source directory:

- Each invocation creates a unique timestamped file
- Different guidance creates different audience-targeted versions
- Examples:
  - `create-final-report report/ "5-page executive summary for CEO"`
  - `create-final-report report/ "Technical specification for
engineers"`
  - `create-final-report report/ "Comprehensive grant proposal for
funding agency"`
- All three commands can run on same source directory
- Each produces appropriately styled report for its audience

**How hierarchy affects different audiences:**

Same H3 file (report/methodology/analysis/statistical.md) processed
differently:

- CEO audience: "Statistical analysis validated findings with p<0.05
  significance, confirming initial hypotheses."
- Technical audience: Full subsection with formulas, test procedures,
  assumptions, limitations
- Funding audience: Methodology details with evidence of rigor and
  validity

## Output Marker

First and only line of output:

```
FINAL_REPORT_CREATED: final-report-{project}-YYYY-MM-DD.md
```

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
