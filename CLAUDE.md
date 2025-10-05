# Important additional project rules

- Never create header or footer inside a page. Public and private
  layouts have header and footer and menu and there is a logic to
  decide if it is private or public. Do not create sub headers or
  footers under any page.

## Git and GitHub CLI Workflow

Use git and gh CLI tools for all GitHub operations:

### Getting repository information

```bash
git remote -v  # Get repo URL, extract owner/repo name
gh repo view   # View current repository details
gh auth status # Check authentication status
```

### Working with issues

```bash
gh issue view <number>              # Read issue details
gh issue view <number> --comments   # Read with all comments
gh issue list                       # List all issues
gh issue create --title "..." --body "..."  # Create new issue
gh issue edit <number> --title "..." --body "..."  # Update
gh issue comment <number> --body "..."  # Add comment to issue
gh issue close <number>             # Close issue
```

### Working with pull requests

```bash
gh pr create --title "..." --body "..."  # Create PR
gh pr view <number>                 # View PR details
gh pr view <number> --comments      # View PR with comments
gh pr list                          # List all PRs
gh pr comment <number> --body "..." # Add comment to PR
gh pr review <number>               # Review PR
gh pr checks                        # View PR check status
gh pr merge <number>                # Merge PR
```

### Common git operations

```bash
git status                          # Check working tree status
git branch                          # List branches
git branch --show-current           # Show current branch name
git checkout -b <branch-name>       # Create and switch to branch
git add .                           # Stage all changes
git commit -m "message"             # Commit with message
git push -u origin <branch>         # Push branch to remote
git log --oneline --grep="keyword"  # Search commit history
```
