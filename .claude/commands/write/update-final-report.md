---
argument-hint: [final_report_path] [new_files (comma-sep or glob)]
description: Update existing final report with new content
allowed-tools: [Read, Glob, TodoWrite, Task]
model: claude-opus-4-6
---

# Update Final Report

You are coordinating the update of an existing final report with new
content. You orchestrate the work but DO NOT write content yourself -
delegate to the write-report sub-agent.

## Context

Read FLOW.md Section 1 (project overview) before starting.

## Input

Arguments (space or comma separated):
- final_report_path: Path to existing final report file
- new_files: New files to integrate (comma-separated or glob pattern)

Examples:
- "final-report-2025-01-15.md report/new-chapter.md"
- "final-report.md report/updates/*.md"
- "final-report.md report/ch1.md,report/ch2.md,report/ch3.md"

## Your Task

### Step 1: Parse Input

Extract from arguments:
- `final_report_path`: First argument (required)
- `new_files`: Remaining arguments (required)

Handle comma-separated or space-separated file lists.

### Step 2: Read Final Report Metadata (PRIMARY) and FLOW.md
(FALLBACK)

**PRIMARY SOURCE - Option 1**: Read YAML frontmatter (preferred):

If report starts with YAML frontmatter (between --- markers at top):
- Parse YAML to extract structured metadata:
  * target_audience
  * detail_level
  * report_type
  * tone (in metadata section)
  * focus_areas (in metadata section)
  * user_guidance (in metadata section)
  * style_guidelines (in metadata section)
  * project (name, purpose, goals, scope)
- This structured metadata OVERRIDES FLOW.md
- Use these exact parameters when instructing sub-agent
- Note: Report has Table of Contents that must be maintained

**PRIMARY SOURCE - Option 2**: Read Report Metadata section (legacy):

If report has "REPORT METADATA" or "Report Metadata" section:
- Extract ALL metadata fields from table or prose:
  * Target Audience
  * Detail Level
  * Tone
  * Focus Areas
  * User Guidance (original)
  * Style Guidelines Applied
  * Project Context
- This metadata OVERRIDES FLOW.md - it represents the original
  creation intent
- Use these exact parameters when instructing sub-agent

**FALLBACK**: If no metadata exists:
- Read FLOW.md for context (Section 1, Section 10)
- Analyze existing report content to infer:
  * Audience type (technical vs executive vs comprehensive)
  * Detail level (how deep/thorough)
  * Tone (formal vs accessible vs technical)
  * Writing style patterns
- Make best effort to match existing style

**CRITICAL**: Report metadata takes precedence over FLOW.md

### Step 3: Validate Final Report

Use Read tool to verify:
- Final report file exists
- File is readable
- Has proper markdown structure

Error if file doesn't exist or can't be read.

### Step 4: Resolve New Files

Determine if new_files contains glob patterns or file paths:

If contains wildcards (* or ?):
- Use Glob to expand pattern(s)
- Collect all matching files

If comma-separated paths:
- Split on commas
- Trim whitespace
- Validate each path exists

Result: List of source files to integrate

Verify:
- At least one file found
- All files are readable
- Files are markdown (.md extension)

### Step 5: Create Task List

Use TodoWrite to create task list:
- One task per new file: "Integrate {filename} into final report"
- Final task: "Update metadata and validate report"

### Step 6: Process Each New File

For each new file in task list:

1. Mark task as in_progress using TodoWrite
2. Invoke write-report sub-agent using Task tool with prompt:

```
You are updating an existing final report with new content.

REFERENCE FILE: {new_file_path}
FINAL REPORT: {final_report_path}

PROJECT CONTEXT (from report metadata or FLOW.md):
Project: {project_name}
Purpose: {project_purpose}
Goals: {project_goals}
Scope: {project_scope}

AUDIENCE & STYLE (EXTRACTED FROM REPORT METADATA):
Target Audience: {exact value from report metadata - e.g., "Executive
leadership (CEO level)", "Technical engineers and developers"}
Detail Level: {exact value from report metadata - e.g., "High-level
summary (5 pages)", "Detailed technical analysis"}
Tone: {exact value from report metadata - e.g., "Executive-friendly,
minimal jargon", "Technical and precise"}
Focus Areas: {from report metadata}
Original User Guidance: {from report metadata "User Guidance" field}

STYLE GUIDELINES (FROM REPORT METADATA):
{Copy exact "Style Guidelines Applied" from report metadata block.
This is what was originally used to create the report - maintain it
exactly.}

CRITICAL INSTRUCTION:
This report was created with specific audience and style parameters.
You MUST maintain exact consistency with the original style. The
metadata above represents the original creation intent - follow it
precisely.

INSTRUCTIONS:
- Read the reference file completely
- Identify new content, updates, changes, or additions
- Read the existing final report to understand current structure
- CRITICAL: Match the existing report's tone, style, and detail level
  EXACTLY as specified in metadata
- Apply same audience-appropriate language as existing content
- Use the exact same distillation approach as original report:
  * If executive: aggressive distillation, business focus
  * If technical: preserve depth, technical terminology
  * If funding: comprehensive, methodology-focused
  * If general: balanced, accessible
- Determine appropriate section(s) for integration:
  * Add to existing sections if content fits naturally
  * Create new subsections if content is distinct
  * Maintain document hierarchy and flow
- If report has Table of Contents: UPDATE IT when adding new sections
- If report has YAML frontmatter: DO NOT modify it (maintain as-is)
- Add AI navigation comments (<!-- AI Agent: ... -->) to new sections
- Distill and integrate content avoiding duplication
- Preserve narrative coherence across the document
- Update or enhance existing content if reference provides updates
- Follow 80-character line limit strictly
- Update "Last Updated" or "Generated" in metadata to today's date
- Use Edit tool for targeted updates to final report

Return brief summary confirming completion and sections updated.
```

3. Wait for sub-agent completion
4. Mark task as completed using TodoWrite
5. Continue to next file

### Step 7: Final Validation

Mark validation task as in_progress.

Read updated final report and verify:
- 80-character line limit maintained
- Proper markdown formatting maintained
- Content flows logically with new additions
- No duplicate or conflicting information
- Metadata updated (dates reflect update)
- All sections coherent

If critical issues found:
- Invoke write-report agent with fix instructions

Mark validation task as completed.

### Step 8: Output Result

Return ONLY the marker line:

```
FINAL_REPORT_UPDATED: {final-report-path}
```

No additional explanation or summary.

## Critical Requirements

- DO NOT write content yourself - delegate to sub-agent
- Verify final report exists before processing
- Extract metadata from report as PRIMARY source of style guidance
- Use TodoWrite to track all tasks
- Process files systematically one at a time
- Provide complete context to sub-agent in each invocation
- Sub-agent instructions must be self-contained
- Keep your own context minimal (coordination only)
- 80-character line limit mandatory
- Output marker required for workflow integration
- Preserve existing report quality and structure
- CRITICAL: Report metadata overrides FLOW.md for style consistency

## Error Handling

- Missing final_report_path: Error with usage message
- Final report doesn't exist: Error - use create command instead
- No new files provided: Error with clear message
- New files not found: Error listing missing files
- Glob matches nothing: Error indicating no files found
- Sub-agent failure: Report which file failed, exit gracefully

## Integration Strategy

When integrating new content:
- Respect existing document structure
- Add to appropriate sections based on content themes
- Create new sections only when content doesn't fit existing ones
- Maintain consistent depth and detail level from original report
- Update "Last Updated" date in metadata section
- Preserve document quality and readability
- Match original audience targeting exactly

## Metadata Extraction Process

When reading final report:

1. Look for "REPORT METADATA" section (between --- markers)
2. If found:
   - Parse all fields systematically
   - Extract Target Audience, Detail Level, Tone, Focus Areas
   - Extract Style Guidelines Applied (critical for consistency)
   - Extract Original User Guidance
   - Extract Project Context
   - Use these values to populate sub-agent instructions
3. If not found (older report without metadata):
   - Fall back to FLOW.md reading
   - Infer audience/style from content analysis
   - Make best effort to maintain consistency

## Output Marker

First and only line of output:

```
FINAL_REPORT_UPDATED: {final-report-path}
```

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
