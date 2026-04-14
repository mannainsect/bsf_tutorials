---
argument-hint: [reference filename(s) from references/]
description: Distill insights from research into report chapters
allowed-tools: [Read, Edit, Write, Glob, TodoWrite, Bash]
model: claude-opus-4-6
---

# Update Report from Research

You are distilling research insights into the customer-facing
report. This command does ALL synthesis and report integration
in one step.

**Handles first-time use**: Automatically initializes report
structure if reports/ directory doesn't exist yet.

## Context

Read FLOW.md Sections 1, 3, 6 (Report Writing), 10 before
starting.

## Report Hierarchy

Reports use a 3-level hierarchy based on content granularity:

```
reports/
├── 001-introduction.md           [H1: Flat file]
├── 002-background.md             [H1: Flat file]
├── 003-technical-architecture/   [H1: Directory]
│   ├── core-concepts.md          [H2: Sub-topic]
│   ├── design-patterns.md        [H2: Sub-topic]
│   └── integration/              [H2: Directory]
│       ├── api-design.md         [H3: Detail]
│       └── data-flow.md          [H3: Detail]
└── 004-implementation.md         [H1: Flat file]
```

- H1 = Main chapter topic
- H2 = Sub-topic under H1
- H3 = Detailed content under H2

Files start as flat H1 files. The maintain-report command
splits them into directories when they grow too large.

**Your responsibility:**
- Update existing files at any level (H1, H2, or H3)
- Create new H1 chapters as flat files only
- NEVER create directories or split files

## Input

Receive: Reference filename(s) from references/

Examples:
- "references/web-ai-agents-2025-01-30.md"
- "references/web-topic1.md,references/web-topic2.md"

## Step 0: Initialize Report Structure (First-Time Setup)

Check if report structure exists:

```bash
test -d reports && test -f reports/000-topic-reference.md \
  && echo "EXISTS" || echo "MISSING"
```

**If MISSING:**

1. Create reports/ directory: `mkdir -p reports`
2. Read FLOW.md Section 10 for domain knowledge, focus areas,
   target audience
3. Create initial index (reports/000-topic-reference.md) with
   brief intro, high-level topic structure, empty chapter
   listings, last updated date
4. Optionally create 1-2 starter chapters
   (001-introduction.md, 002-background.md) with minimal
   content

**Initial index template:**

```markdown
# Topic Reference

**Last Updated**: YYYY-MM-DD

This index maps topics to chapters in the [Project] report.

## Report Purpose

[Brief description based on FLOW.md Section 10]

## Chapter Index

001. Introduction - YYYY-MM-DD
002. Background - YYYY-MM-DD
```

**If EXISTS, skip to Step 1.**

### Step 1: Read FLOW.md Context

Extract:
- Section 1: Project name and purpose
- Section 10: Project scope, goals, target audience
- Report directory location

Define paths:
- `[report_dir]` - default: reports/
- `[report_index]` - default: reports/000-topic-reference.md

### Step 2: Read Reference Files

For each reference file:
- Read full content
- Extract key findings
- Identify themes/topics
- Note citations

### Step 3: Distill Insights

**CRITICAL**: This is NOT copy-paste from references!

Transform raw research into project-specific insights:
- Filter by FLOW.md Section 10 project scope/goals
- Extract what's RELEVANT to project
- Synthesize into business/technical insights
- Maintain citations but focus on actionable information
- Professional, customer-facing language

Example transformation:
- **Raw**: "LangChain 0.2.0 adds streaming API with
  AsyncIterator support..."
- **Distilled**: "Modern AI frameworks now support streaming
  responses, enabling real-time user feedback - critical for
  [project goal from Section 10]."

### Step 4: Map to Report Chapters

Read reports/000-topic-reference.md to understand existing
chapter organization.

**For newly initialized reports:**
- First integrations will likely create new H1 chapters
- Use FLOW.md Section 10 to inform chapter topics
- Build structure organically based on research content

**For established reports:**

- **Topic matches existing H1 flat file** - Update directly
- **Topic matches H1 directory** - Use Glob to find most
  relevant H2 file within directory
- **Topic matches H2 directory** - Use Glob to find most
  relevant H3 file
- **Topic spans multiple chapters** - Distribute insights
- **Topic deserves new H1** - Create new flat file with
  next sequential number (only when topic is completely new
  and NOT a subtopic of existing chapters)

### Step 5: Update Report Files

**Frontmatter requirements:**

Every report file must begin with YAML frontmatter matching
`docs/metadata-taxonomy.yaml`. Required keys: `title`,
`date`, `topics`, `tags`, `geographies`, `data_types`,
`authors`, `source`, `related`.

Set `source: "report"`, update `date` to today, populate
`related` with reference filenames that informed the update.

**For existing chapters:**

- Read file, find appropriate section
- Use Edit tool to integrate (NOT replace entire content)
- Maintain narrative flow and consistency
- Update "Last Updated" date
- For directories: use Glob to find most relevant sub-file

**For new files:**

- **New H1**: Create at reports/NNN-chapter-name.md (flat
  file, next sequential number)
- **New H2**: Create in existing H1 directory
- **New H3**: Create in existing H2 directory

**File structure template:**

```markdown
---
title: "[Chapter Title]"
date: "YYYY-MM-DD"
authors:
  - "Report Team"
topics:
  - "workflow-orchestration"
tags:
  - "analysis"
  - "report"
geographies:
  - "global"
data_types:
  - "research"
source: "report"
related:
  - "references/web-topic-DATE.md"
---

## Executive Summary

[1-2 paragraphs synthesising updates]

## [Section 1]

[Insights with citations]

## References

- references/web-topic-DATE.md
```

**Rules:**
- Prefer updating existing files over creating new ones
- DON'T create empty directories, restructure, or split
  files (maintain-report handles that)
- DON'T move files between directories

### Step 6: Update Index

Edit reports/000-topic-reference.md:

1. Read current index to understand its format
2. Match that format exactly when updating
3. Add new chapter entries if created
4. Update dates for modified chapters
5. Maintain sequential numbering
6. DO NOT add "(NEW)" markers or history tracking

Index can reference both flat files (.md) and directories (/).

### Step 7: Validate

Check all updated files:
- 80 character line limit
- Markdown formatting correct
- Citations preserved
- Customer-facing language (no raw research dumps)
- Aligned with FLOW.md Section 10

## Output

**CRITICAL**: Response must be MINIMAL. First line MUST be:

```
REPORT_UPDATED: reports/[file1],reports/[file2]
```

Examples:
```
REPORT_UPDATED: reports/003-technical-architecture.md
REPORT_UPDATED: reports/005-implementation/core-features.md
REPORT_UPDATED: reports/003-arch.md,reports/019-new-topic.md
```

Comma-separated filenames including directory paths if files
are within subdirectories. Index updates are implied - don't
mention them. Do NOT include explanations or summaries.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
