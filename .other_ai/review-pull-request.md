# Pull Request Review - Generic AI Tool Instructions

Your job is to review all comments from the pull request related to the
current branch and assess which should be implemented and updated to the PR
before it is merged. Think carefully about all comments and implementation.

Use the comments of the PR and any additional guidance provided to follow
the process and improve the PR. If no additional guidance is given, use only
PR comments.

## Available CLI Tools

You have access to these command line tools:

- `gh` - GitHub CLI for PR management, comments, and reviews
- `git` - Standard git commands for version control
- Standard development tools (linters, formatters, test runners)
- File operations (cat, grep, find, ls, sed, awk, etc.)
- Language-specific tools (uv, npm, pytest, etc.)

## Rules

- Make sure tests are always covered, so any comments on missing or failing
  tests should be taken seriously
- Not all comments have to be included, if they relate to documentation or
  code styling, but important to continuously improve the code
  maintainability and modularity regardless if they are not critical
- Focus on security, performance, and functionality issues first
- Address code quality and style improvements when feasible

## Process (Must Follow Always)

### 1. Detect Current PR from Branch

```bash
# Check current branch
git branch --show-current
git status

# Get PR information for current branch
gh pr view --json number,title,url,state
gh pr status

# Store PR number for later use
PR_NUMBER=$(gh pr view --json number --jq '.number')
echo "Working on PR #$PR_NUMBER"
```

### 2. Fetch All Review Comments

```bash
# Get PR details
gh pr view $PR_NUMBER

# Get all comments (general comments)
gh pr view $PR_NUMBER --json comments --jq '.comments[] | {author: .author.login, body: .body, createdAt: .createdAt}'

# Get review comments (code-specific comments)
gh api repos/:owner/:repo/pulls/$PR_NUMBER/comments --jq '.[] | {author: .user.login, body: .body, path: .path, line: .line}'

# Get review summaries
gh api repos/:owner/:repo/pulls/$PR_NUMBER/reviews --jq '.[] | {author: .user.login, state: .state, body: .body}'

# Save all comments to file for analysis
gh pr view $PR_NUMBER --json comments,reviews > pr_comments.json
```

### 3. Analyze and Categorize Issues by Priority

Create a systematic analysis:

**High Priority Issues:**

- Security vulnerabilities
- Breaking changes
- Test failures
- Logic errors
- Performance bottlenecks

**Medium Priority Issues:**

- Error handling improvements
- Code maintainability
- Documentation updates
- Performance optimizations

**Low Priority Issues:**

- Code style preferences
- Optional enhancements
- Minor refactoring suggestions

### 4. Create Todo List for All Fixes

Create a comprehensive todo list:

```bash
echo "# PR Review Todo List

## High Priority Fixes
- [ ] Fix failing tests
- [ ] Address security concerns
- [ ] Fix breaking changes

## Medium Priority Fixes
- [ ] Improve error handling
- [ ] Update documentation
- [ ] Optimize performance

## Low Priority Fixes
- [ ] Style improvements
- [ ] Optional refactoring

## Files to Modify
- [ ] [List specific files based on comments]
" > pr_review_todo.md
```

### 5. Implement Fixes Systematically

For each category, starting with high priority:

```bash
# Before making changes, ensure we're on the correct branch
BRANCH_NAME=$(git branch --show-current)
echo "Working on branch: $BRANCH_NAME"

# Make incremental changes and commits
git add .
git commit -m "fix: address high priority review comments

- Fixed security issue in authentication
- Corrected test failures
- Updated error handling

Addresses PR #$PR_NUMBER feedback"
```

Implementation guidelines:

- **One category at a time**: Start with high priority issues
- **Incremental commits**: Make separate commits for different types of fixes
- **Clear commit messages**: Reference specific review comments
- **Test after each change**: Ensure changes don't break existing functionality

### 6. Code Quality Evaluation

Run comprehensive quality checks:

```bash
# Python projects
uv run ruff check and format

# JavaScript/TypeScript projects
npm run lint:fix and npm run format

# General code quality checks
echo "Running general quality checks..."
grep -r "console.log\|debugger\|TODO\|FIXME" --include="*.js" --include="*.ts" --include="*.py" . || true
```

### 7. Fix Code Based on Quality Evaluation

Address any issues found in quality checks:

```bash
# Auto-fix formatting issues
uv run format || npm run format

# Fix linting issues manually
# Address type checking errors
# Remove debug code and TODOs

# Commit quality fixes
git add .
git commit -m "fix: address code quality issues

- Fixed linting errors
- Resolved type checking issues
- Removed debug code

Part of PR #$PR_NUMBER review"
```

### 8. Run Tests

Ensure all tests pass after fixes:

```bash
# Python testing
if [ -f "pytest.ini" ] || [ -d "tests/" ]; then
    echo "Running Python tests..."
    uv run pytest || python -m pytest
fi

# JavaScript testing
if [ -f "package.json" ]; then
    echo "Running JavaScript tests..."
    npm test || npm run test:unit
fi

# If tests fail, fix them before proceeding
if [ $? -ne 0 ]; then
    echo "Tests failed - must fix before proceeding"
    exit 1
fi
```

### 9. Commit and Push Updates to PR

```bash
# Final commit with all remaining changes
git add .
git commit -m "fix: complete PR review implementation

Addresses all review comments from PR #$PR_NUMBER:
- [List specific fixes implemented]
- All tests passing
- Code quality checks passed

Ready for re-review."

# Push updates to PR
git push origin $BRANCH_NAME

# Add comment to PR about updates
gh pr comment $PR_NUMBER --body "**Review Comments Addressed**

All review comments have been addressed:

## High Priority Fixes 
- Fixed security vulnerabilities
- Resolved test failures
- Corrected breaking changes

## Medium Priority Fixes 
- Improved error handling
- Updated documentation
- Optimized performance

## Code Quality 
- All linting issues resolved
- Type checking passed
- Tests passing

Ready for re-review. Please let me know if any additional changes are needed."
```

### 10. Return to Main Branch and Cleanup

```bash
# Switch back to main branch or dev
git checkout main  # or dev if that was original branch

# Delete local PR branch (optional - only if PR is merged)
# git branch -D $BRANCH_NAME

echo "PR review process completed for PR #$PR_NUMBER"
echo "Updates pushed and ready for re-review"
```

## Implementation Guidance Examples

### Comment Analysis Template

```bash
# Create analysis file
echo "# PR Comment Analysis

## Security Issues
- [List security-related comments]

## Test Issues
- [List test-related comments]

## Performance Issues
- [List performance-related comments]

## Style/Quality Issues
- [List style/quality comments]

## Implementation Priority
1. Security fixes
2. Test fixes
3. Performance improvements
4. Style improvements
" > comment_analysis.md
```

### Testing Commands by Language

```bash
# Python
uv run pytest -v
python -m pytest --cov=. --cov-report=html

# JavaScript/TypeScript
npm run test
npm run test:coverage
npm run test:unit

# Integration tests
npm run test:integration || python -m pytest tests/integration/
```

## Common Review Comment Categories

**Security:**

- Input validation missing
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication issues

**Testing:**

- Missing test cases
- Insufficient coverage
- Flaky tests
- Integration test gaps

**Performance:**

- Inefficient algorithms
- Memory leaks
- Database query optimization
- Caching opportunities

**Code Quality:**

- Complex functions
- Code duplication
- Poor naming
- Missing error handling

## Final Checklist

Before completing the review process:

- [ ] All high priority comments addressed
- [ ] Tests are passing
- [ ] Code quality checks pass
- [ ] No debug code remaining
- [ ] Documentation updated if needed
- [ ] Commit messages are clear
- [ ] PR updated with summary of changes

Remember: The goal is to improve code quality while addressing reviewer
concerns. Focus on the most impactful changes first, and ensure the code
remains maintainable and reliable.
