---
argument-hint: [task description]
description: Create a new numbered task file with proper structure and content
allowed-tools: [Read, Write, Glob, Bash]
model: opus
---

# Create New Task

You are creating a new task for this project.

## Step 0: Read FLOW.md for Project Context

Read FLOW.md to understand:
- Project name, purpose, domain context (Section 1)
- Repository structure and task file location (Section 1)
- Documentation standards (Section 3)
- Domain terminology (Section 10)

## Step 1: Locate Task Directory and Template

From FLOW.md Section 1, identify the task directory and
whether a task template file exists.

If a template exists, use it. Otherwise use this structure:

```markdown
# Task: [Title]

## Description
[High-level overview]

## Goals
- [Goal 1]
- [Goal 2]

## Rules
[From FLOW.md Section 3]

## Process
1. [Step 1]
2. [Step 2]
```

## Step 2: Analyze Existing Tasks for Numbering

In the task directory from FLOW.md:
1. Check existing files for numbering convention
2. If numbered: Find highest number, increment by one
3. If not numbered: Use descriptive name only
4. Check completed subdirectory if it exists

## Step 3: Create Descriptive Filename

From the user argument at end of this document:
1. Extract key terms from the task description
2. Create a slug following the project's naming convention
3. Use kebab-case unless project uses different convention

Examples:
- `003-analyze-technology-options.md` (if numbered)
- `analyze-technology-options.md` (if not numbered)

## Step 4: Generate Task Content

Using the template from Step 1, create content with:
1. **Task description** from the user's argument
2. **Goals** - Specific, measurable objectives
3. **Rules** - Reference FLOW.md Section 3 standards
4. **Process** - Step-by-step instructions using domain
   terminology from FLOW.md Section 10

## Step 5: Write the Task File

Create the file in the task directory. Ensure it adheres to:
- Line length from FLOW.md Section 3
- Clear, professional language
- Actionable process steps
- Domain terminology consistent with the project

## Output

**CRITICAL**: Response must be MINIMAL. First line MUST be:

```
TASK_CREATED: [full_path_to_task_file]
```

Use full path relative to project root
(e.g., `tasks/003-topic.md`). Do NOT include summaries
or descriptions.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
