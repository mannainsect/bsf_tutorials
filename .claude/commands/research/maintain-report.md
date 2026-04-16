---
description: Maintain report structure by splitting large files into organized directories
allowed-tools: [Read, Write, Edit, Glob, Bash, TodoWrite]
model: opus
---

# Maintain Report Structure

You are maintaining the project's report structure by analyzing
file sizes, splitting large files into subdirectories when
needed, and keeping the index file synchronized.

## Step 0: Read FLOW.md for Project Context

Read FLOW.md to extract:
- Report directory location (Section 1)
- Report index file location (Section 1)
- Line length and formatting standards (Section 3)

**Define key paths:**
- `[report_dir]`: default "reports/"
- `[report_index]`: default "reports/000-topic-reference.md"
- `[size_threshold]`: default 1000 lines

## Process

1. Read FLOW.md to understand report structure
2. Analyze all report files for size (H1, H2, H3 levels)
3. Identify files exceeding threshold
4. Split large files based on hierarchy level
5. Update the index file to reflect new structure
6. Return summary of changes made

## Hierarchy and Split Logic

Reports follow a 3-level hierarchy:

```
reports/
├── 001-intro.md                  [H1: Flat file]
├── 002-background/               [H1: Directory]
│   ├── 01-overview.md            [H2: Sub-topic]
│   ├── 02-history.md             [H2: Sub-topic]
│   └── 03-research/              [H2: Directory]
│       ├── 01-methods.md         [H3: Detail]
│       └── 02-findings.md        [H3: Detail]
└── 003-analysis.md               [H1: Flat file]
```

**Split rules:**
- **H1 file too large** -> H1 directory with H2 files
- **H2 file too large** -> H2 subdirectory with H3 files
- **H3 file too large** -> Warning only (max depth reached)
- Minimum 2 sections required for splitting
- Use ## headings as primary split points, ### as fallback

## Step 1: Create Internal Task List

Use TodoWrite to track:
1. Reading FLOW.md project context
2. Analyzing report file sizes
3. Identifying files to split
4. Splitting large files into directories
5. Updating report index
6. Reporting completion

Mark first task as in_progress.

## Step 2: Analyze Report File Sizes

**List all report files using Glob:**
- H1: `[report_dir]/*.md`
- H2: `[report_dir]/*/*.md`
- H3: `[report_dir]/*/*/*.md`
- Exclude index files (000-topic-reference.md, 00-index.md)

**Determine hierarchy level by path depth:**
- 1 segment: H1 (e.g., `reports/003-analysis.md`)
- 2 segments: H2 (e.g., `reports/002-bg/01-overview.md`)
- 3 segments: H3 (e.g., `reports/002-bg/research/01-m.md`)

**For each file:**
- Count total lines
- Extract heading structure
- Calculate lines per section
- Record hierarchy level

**Create file assessment:**
```
H1 Level:
- 001-introduction.md: 250 lines (OK)
- 002-background.md: 780 lines (SPLIT -> H2 directory)

H2 Level:
- 004-methodology/02-data.md: 1200 lines (SPLIT -> H3)

H3 Level:
- 005-results/findings/01-quant.md: 800 lines (WARNING)
```

## Step 3: Create Split Plan

For files exceeding threshold, verify split feasibility
(multiple ## headings required).

**Create split plan:**
```
H1 -> H2 Split:
File: reports/002-background.md (780 lines)
Target: reports/002-background/
Splits:
- 01-overview.md (## Overview) [H2]
- 02-history.md (## History) [H2]
- 03-research.md (## Research) [H2]

H2 -> H3 Split:
File: reports/004-methodology/02-data-collection.md
Target: reports/004-methodology/02-data-collection/
Splits:
- 01-primary-sources.md [H3]
- 02-secondary-sources.md [H3]
- 03-validation.md [H3]
```

## Step 4: Execute Splits

For each file in split plan:

**4.1 Create directory:**
```bash
mkdir -p reports/002-background
```

**4.2 Extract content sections:**
- Parse by ## headings
- Include pre-heading content in first file
- Preserve original heading levels and formatting

**4.3 Create individual files:**
- Filename: `NN-section-title.md` (zero-padded, kebab-case)
- Maintain 80-character line length
- Preserve all markdown formatting

**4.4 Create directory index (00-index.md):**

```markdown
# [Chapter Title] - Index

This chapter has been split for maintainability.

## Sections

1. [01-section-one.md](01-section-one.md) - Description
2. [02-section-two.md](02-section-two.md) - Description
```

**4.5 Remove original file** after verifying all content was
extracted and new files created successfully.

## Step 5: Update Report Index

Read `[report_index]`, then for each split performed:
- Update entry from file reference to directory reference
- Add sub-entries for each section file
- Maintain 80-character line length and consistent formatting
- Update modification date

## Step 6: Final Output

**CRITICAL**: Response must be MINIMAL. Output ONLY:

```
SPLITS_PERFORMED: [count]

H1 -> H2 Splits:
reports/002-background.md -> reports/002-background/ (3 files)

H2 -> H3 Splits:
reports/004-methodology/02-data.md ->
reports/004-methodology/02-data/ (3 files)

H3 Warnings:
reports/005-results/findings/01-quant.md (800 lines)

FILES_CREATED: 8
FILES_REMOVED: 2
INDEX_UPDATED: reports/000-topic-reference.md
```

**If no splits needed:**

```
SPLITS_PERFORMED: 0

All report files within size threshold (<=1000 lines)
No maintenance required
```

## Error Handling

- Missing FLOW.md: Use defaults
- No report directory: Create it with warning
- Empty reports: No action needed
- No files exceed threshold: Report success, no changes
- Split fails: Report error, preserve original file

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
