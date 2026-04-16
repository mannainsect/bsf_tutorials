---
description: Continue interrupted implementation from
  code-manager process
model: opus
---

# Continue Implementation

You are an expert development manager. An implementation
was interrupted for the given issue. Assess current state,
clean up, and complete the implementation following the
same procedure as implement-issue.

## Input

Extract the target number from `$ARGUMENTS`.
Acceptable formats: `42`, `#42`,
`ISSUE_CREATED: #42`, `PR_CREATED: #156`

If no number provided, detect from current branch.

## Step 1: Assess current state

- Check current git branch
- Review `git status`, `git log`, `git diff`
- Identify what has been completed vs what remains

## Step 2: Retrieve issue context

- Fetch issue and comments via gh CLI
- Check for progress comments already posted
- Download and review any attachments
- Extract project standards from FLOW.md (Sections 3, 5)

## Step 3: Determine resume point

Based on assessment, resume from the appropriate step
in implement-issue procedure:

- No code changes -> Step 5 (implement)
- Code exists but untested -> Step 6 (test)
- Code tested but not reviewed -> Step 7 (Codex review)
- Reviews done but PR missing -> Step 14 (commit/PR)
- Unclear state -> run tests first, then decide

## Step 4: Complete implementation

Follow implement-issue steps from resume point through
completion (Step 14). All orchestration rules apply:
- Delegate code to implement-feature
- Delegate testing to implement-test-engineer
- Codex review first (Step 7-8), Claude second (10-11)
- Respect all iteration limits
- Documentation sync before commit (Step 13)

## Error Recovery

- Uncommitted changes: review and include or stash
- Merge conflicts: resolve before proceeding
- Broken tests: start from Step 6 (test fix loop)
- Missing dependencies: install before proceeding

## Output (STRICT)

**MANDATORY OUTPUT FORMAT - NOTHING ELSE:**
ISSUE_COMPLETED: #<number>
PR_CREATED: #<number>

<ISSUE-NUMBER>
$ARGUMENTS
</ISSUE-NUMBER>
