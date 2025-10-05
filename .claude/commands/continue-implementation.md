---
description: Continue interrupted implementation from code-manager process
---

# Description

You are an expert development manager and github workflow expert. Your job
is to continue and complete an interrupted implementation process for the
given issue number. This command is used when the code-manager-full process
was interrupted (e.g., due to a crash) and needs to be resumed.

You will assess the current state of implementation, determine what has been
completed, and continue from where the previous process left off. You are the
central orchestrator who evaluates progress and coordinates remaining work.

Ultrathink.

## Core Responsibilities

- Assess current implementation state and progress
- Determine what tasks have been completed
- Resume the implementation process from the appropriate stage
- Coordinate sub-agents to complete remaining work
- Ensure quality and completeness of the final implementation
- Create PR if implementation is complete

## Important Context

The implementation for this issue has already been started but was
interrupted. Code may be partially or fully implemented. Your first priority
is to assess the current state before proceeding with any new work.

## Procedure

1. Initial Assessment Phase:
   - Check current git status and branch (should be main or dev, but can be
     already created issue branch)
   - Review recent commits to understand what was implemented
   - Look for any uncommitted changes
   - Identify which files have been modified related to the issue

2. Retrieve and analyze the issue:
   - First determine the repository owner and name from git:
     - Use `git remote -v` to get the repository URL
     - Extract owner and repo name from the URL
   - Use GitHub MCP server to fetch the issue and its comments
   - Review any progress comments that may have been posted
   - Extract all requirements and acceptance criteria

3. Quality Evaluation (START HERE):
   - Call code quality evaluator sub agent with:
     - Complete issue requirements and specifications
     - List of all detected changes and implementations
     - Request assessment of implementation completeness
   - Review the quality report carefully
   - Based on quality report, determine next steps:
     a. If implementation is complete and quality is good → proceed to step 6
     b. If implementation has issues → proceed to step 4
     c. If implementation is incomplete → proceed to step 5

4. Fix Quality Issues (if needed):
   - Call feature implementer sub agent with:
     - Specific issues identified in quality report
     - Detailed guidance on how to address each issue
     - Original issue requirements for context
   - Re-run quality evaluation after fixes
   - Repeat until quality standards are met

5. Complete Missing Implementation (if needed):
   - Identify remaining tasks from issue requirements
   - Call feature implementer sub agent with:
     - Specific missing features or requirements
     - Context from existing implementation
     - Clear success criteria for completion
   - After implementation, return to step 3 for quality check

6. Comprehensive Testing Phase:
   - Call test-engineer sub agent with:
     - Issue requirements and test criteria
     - List of all code changes and features
     - Specific test scenarios to verify
   - Review test report
   - If tests fail, return to step 4 with test failure details
   - NOTE: Dev servers and builds will be run manually by user

7. Documentation Synchronization:
   - Call docs sync engineer sub agent with:
     - Issue details and implemented features
     - List of all changes made
     - Specific documentation sections that may need updates
   - Review documentation updates

8. Final Review and Judgment:
   - Compile results from all sub-agents
   - Verify all issue requirements are met
   - Ensure all sub agents confirm implementation integrity
   - Make final assessment of implementation readiness

9. Post progress summary to GitHub issue:
   - Use GitHub MCP server to add comment with:
     - Summary of what was already implemented
     - What additional work was completed
     - Quality evaluation results
     - Test results
     - Documentation updates
     - Final verdict on PR readiness

10. Create Pull Request (if not already created):
    - Check if a PR already exists for this issue
    - If no PR exists:
      a. Confirm current git branch (should be main or dev)
      b. Create a new branch for the issue if not already on feature branch
      c. Commit all changes with appropriate message
      d. Push branch to remote
      e. Create pull request against main or dev branch
      f. Link PR to the issue

## Key Differences from code-manager-full

- Start with quality evaluation instead of implementation
- Assume code may already be partially or fully implemented
- Focus on assessment and completion rather than fresh implementation
- Check for existing branches and PRs before creating new ones
- More emphasis on understanding what's already done

## Error Recovery

If you encounter issues:

- Uncommitted changes: Carefully review and either commit or stash
- Merge conflicts: Resolve before proceeding
- Missing dependencies: Install required packages
- Test failures: Focus on fixing before creating PR

<ISSUE-NUMBER>
$ARGUMENTS
</ISSUE-NUMBER>
