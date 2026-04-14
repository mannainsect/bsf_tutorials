---
description: Analyze report gaps and create tasks for identified missing content
allowed-tools: [Read, Write, Glob, TodoWrite]
model: claude-opus-4-6
---

# Analyze Report Gaps and Create Tasks

You are analyzing the completeness of the project's structured
report relative to project goals, then creating new task files
for identified gaps.

## Step 0: Read FLOW.md for Project Context

Read FLOW.md to extract:
- Project name, purpose, goals (Section 1)
- Task template structure (Section 6: Research Task Workflow)
- Report structure location (Section 1)
- Tasks directory location (Section 1)

**Define key paths:**
- `[report_dir]`: default "reports/"
- `[report_index]`: default "reports/000-topic-reference.md"
- `[tasks_dir]`: default "tasks/"

## Process

1. Read FLOW.md to understand project goals and task format
2. Read report structure and assess current coverage
3. Read existing tasks to avoid duplication
4. Perform comprehensive gap analysis
5. Create new task files for identified gaps
6. Return list of created task filenames

## Step 1: Create Internal Task List

Use TodoWrite to track:
1. Reading FLOW.md project context
2. Reading report structure and content
3. Reading existing tasks
4. Performing gap analysis
5. Creating new task files
6. Reporting completion

Mark first task as in_progress.

## Step 2: Read FLOW.md Project Context

From FLOW.md, extract:

**Section 1**: Primary objectives, key deliverables, domain
context, critical analysis areas.

**Section 6**: Task template structure (Status, Created,
Research Question, etc.), naming conventions (NNN-task-title),
agent assignment guidance, success criteria patterns.

## Step 3: Read Report Structure

**3.1 Read report index** (`[report_index]`) for chapter
organization and topic-to-chapter mapping.

**3.2 List all chapter files** using Glob:
`[report_dir]/*.md` or `[report_dir]/[0-9]*.md`

**3.3 Assess each chapter** with coverage levels:
- **Well-covered**: Comprehensive, no placeholders
- **Partial**: Some content but needs depth
- **Placeholder**: Contains "[To be completed]" markers
- **Minimal**: Very brief, needs expansion
- **Missing**: In index but no file exists

## Step 4: Read Existing Tasks

**4.1** List task files: `[tasks_dir]/*.md`

**4.2** For each task, extract: number, title, status,
research question, topic area.

**4.3** Track keywords from existing tasks to avoid overlap.
Note next available task number.

## Step 5: Perform Gap Analysis

**5.1 Goals coverage analysis** - For each FLOW.md goal:
- Covered, Partial, or Missing in report

**5.2 Identify gaps needing tasks:**
- Placeholder sections in important chapters
- Missing chapters for FLOW.md goals
- Minimal content needing significant expansion

**5.3 Map gaps to potential tasks:**

For each critical gap define: topic/title, target chapter,
research question, keywords, appropriate agents, priority.

**5.4 Deduplicate** - Skip task creation if existing task
covers same topic (keyword overlap > 70%).

## Step 6: Create New Task Files

**Filename format**: `[tasks_dir]/NNN-task-title.md`
(zero-padded, kebab-case)

**Task template:**

```markdown
# Task NNN: [Task Title]

- **Status**: pending
- **Created**: YYYY-MM-DD
- **Research Question**: [Specific question to answer]
- **Success Criteria**: [What makes this task complete]
- **Keywords**: [comma, separated, search, terms]
- **Agent Assignments**: [agent-name-1, agent-name-2]

## Context

[1-2 paragraphs explaining why this research is needed]

## Target Chapter

**Chapter**: [chapter-number-name.md]
**Section**: [specific section if known]
**Current Status**: [placeholder/minimal/missing]

## Research Focus

[2-3 bullet points on specific aspects to investigate]

## Expected Output

[Description of what the synthesis report should contain]
```

**Agent assignment guidance:**
- Technical/complex: perplexity-web-research
- Real-time data/trends: tavily-web-research
- Broad web/news: brave-web-research
- Deep site crawling: firecrawl-web-research
- Internal docs: reference-search

## Output

**CRITICAL**: Response must be MINIMAL. First line MUST be:

```
TASKS_CREATED: [count]

tasks/007-battery-storage-technology-analysis.md
tasks/008-regulatory-framework-analysis.md
tasks/009-market-trends-competitive-landscape.md
```

List all created task filenames (full paths, one per line).
Do NOT include summaries or explanations.

## Error Handling

- Missing FLOW.md: Use defaults, note limitation
- No tasks directory: Create tasks/ directory
- Empty report: Create foundational research tasks
- Cannot determine next number: Start from 001

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
