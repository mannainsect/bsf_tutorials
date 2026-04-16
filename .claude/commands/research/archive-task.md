---
argument-hint: [task filename]
description: Archive completed task to completed folder
allowed-tools: [Read, Bash, Glob]
model: opus
---

# Archive Completed Task

You are archiving a completed research task. This command moves the task
file to a completed subdirectory, indicating the research workflow is
finished.

## Step 0: Read FLOW.md for Project Context

**CRITICAL FIRST STEP**: Before doing anything else, read @FLOW.md to
understand:

- Project name and purpose
- Repository structure (path to tasks directory)
- Task file organization conventions

Define:
- `[tasks_dir]`: Directory where task files are stored
- `[completed_dir]`: Subdirectory for completed tasks (typically
  `[tasks_dir]/completed`)

If FLOW.md doesn't specify tasks directory, use default: `tasks/`

Extract and keep in mind:
- Section 1 (Project Description): For understanding project structure

## Overview

This command will:
1. Read FLOW.md for project context and task directory location
2. Validate task file exists
3. Create completed subdirectory if needed
4. Move task file to completed subdirectory
5. Return structured output for workflow chaining

## Step 1: Parse Input and Locate Task File

Read the user argument at the end of this document.

**Input handling:**

The input should be a task filename, which can be in one of these
formats:
- Full path: `tasks/003-analyze-technology.md`
- Bare filename: `003-analyze-technology.md`
- Relative path: `../tasks/001-topic.md`

**Validation:**
- Use Bash tool to check if file exists: `test -f [filename] && echo
  "exists"`
- If file doesn't exist, return error message

**Extract task identifier:**
- Task number (if numbered): e.g., `003` from
  `003-analyze-technology.md`
- Task slug: e.g., `analyze-technology` for reporting

## Step 2: Create Completed Directory

Use Bash tool to ensure the completed directory exists:

```bash
mkdir -p [tasks_dir]/completed
```

Where `[tasks_dir]` is extracted from FLOW.md or defaults to `tasks/`.

## Step 3: Move Task to Completed

Use Bash tool to move the task file:

```bash
mv -n [task_file] [tasks_dir]/completed/
```

Example:
```bash
mv tasks/003-analyze-technology.md tasks/completed/
```

**Error handling:**
- If move fails, report the error
- Use `mv -n` to avoid overwriting if file already exists in completed/

## Step 4: Verify Move Completed

Use Bash tool to verify the task file now exists in completed directory:

```bash
test -f [tasks_dir]/completed/[task_filename] && echo "verified"
```

## Step 5: Final Output (Minimal)

**CRITICAL**: Your response must be MINIMAL. Only output:

```
TASK_ARCHIVED: [tasks_dir]/completed/[task_filename]
```

**Output format requirements:**
- **First line MUST be:** `TASK_ARCHIVED: [full_path_to_archived_file]`
- Do NOT include task identifiers, descriptions, or path details

**Exit status:**
- Success: Task moved to completed directory
- Failure: Unable to move task (file not found, permission error, etc.)

---

## Important Notes

**Command scope:**
- Atomic operation: ONLY moves task file to completed subdirectory
- Does NOT clean up intermediate research files (web/internal research
  outputs)
- Does NOT modify the task file contents
- Does NOT validate that research is actually complete

**Input/Output chaining:**
- Input: Task filename (from create-task output or user-provided)
- Output: `TASK_ARCHIVED: [completed_path]`
- Chainable with other research workflow commands

**Project agnosticism:**
- Uses FLOW.md for project-specific task directory path
- Works with any task naming convention (numbered or not)
- Adapts to existing directory structure
- Creates completed/ subdirectory if missing

**Safety considerations:**
- Uses `mv -n` to avoid overwriting existing files in completed/
- Validates file existence before attempting move
- Reports clear error messages if move fails
- Non-destructive operation (just moves files)

**File organization:**
- Task files moved to: `[tasks_dir]/completed/[original_filename]`
- Original filename preserved (no renaming)
- Completed directory mirrors task directory structure
- Easy to locate archived tasks by original filename

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
