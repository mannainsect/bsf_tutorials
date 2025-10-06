# Branch Protection Rules Setup Guide

## Purpose

This guide provides step-by-step instructions for setting up branch
protection rules on the `main` branch to ensure code quality and
prevent direct pushes to the main branch without proper validation.

## Prerequisites

- **Admin access** to the repository is required
- CI/CD workflows must be set up and running (lint, format, test)
- GitHub account with appropriate permissions

## Option 1: Setup via GitHub Web UI

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, click on **Branches**
4. Click **Add branch protection rule** (or **Add rule**)

### Step 2: Specify Branch Name Pattern

1. In the **Branch name pattern** field, enter: `main`
2. This will apply the protection rule to the main branch

### Step 3: Configure Required Status Checks

Enable the following options:

1. Check **Require status checks to pass before merging**
2. Check **Require branches to be up to date before merging**
3. In the search box, find and select the required status checks:
   - `lint` - Code linting check
   - `format` - Code formatting check
   - `test` - Test suite execution

Note: Status checks will only appear in the list after they have run
at least once via a pull request.

### Step 4: Additional Recommended Settings

Consider enabling these additional protections:

- **Require a pull request before merging**
  - Require approvals: 1 (recommended for team projects)
  - Dismiss stale pull request approvals when new commits are pushed

- **Require conversation resolution before merging**
  - Ensures all review comments are addressed

- **Do not allow bypassing the above settings**
  - Enforces rules even for administrators

### Step 5: Save Protection Rule

1. Scroll to the bottom of the page
2. Click **Create** (or **Save changes** if editing existing rule)
3. Verify the rule appears in the branch protection rules list

## Option 2: Setup via GitHub CLI

### Prerequisites for CLI Setup

```bash
# Ensure gh CLI is installed and authenticated
gh auth status

# Verify you have admin access to the repository
gh api repos/:owner/:repo --jq .permissions.admin
```

### Apply Branch Protection via CLI

```bash
# Set up branch protection with required status checks
gh api \
  --method PUT \
  repos/:owner/:repo/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=lint \
  -f required_status_checks[contexts][]=format \
  -f required_status_checks[contexts][]=test \
  -f enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f restrictions=null
```

### Verify Branch Protection

```bash
# Check current branch protection settings
gh api repos/:owner/:repo/branches/main/protection | jq

# View specific status checks
gh api repos/:owner/:repo/branches/main/protection \
  --jq '.required_status_checks.contexts'
```

## Testing Branch Protection

### Test 1: Verify Direct Push is Blocked

```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "Test direct push"
git push origin main
# Expected: Error - protected branch push blocked
```

### Test 2: Verify PR Merge Requirements

1. Create a new branch and make changes:

   ```bash
   git checkout -b test-branch-protection
   echo "test" >> test.txt
   git add test.txt
   git commit -m "Test PR requirements"
   git push -u origin test-branch-protection
   ```

2. Create a pull request:

   ```bash
   gh pr create --title "Test branch protection" \
     --body "Testing that status checks are required"
   ```

3. Verify the following:
   - PR shows required status checks (lint, format, test)
   - Merge button is disabled until all checks pass
   - Status shows "Merging is blocked" until checks complete
   - After checks pass, merge button becomes enabled

### Test 3: Verify Up-to-Date Requirement

1. If another PR is merged while your PR is open
2. Your PR should show "This branch is out-of-date with main"
3. Update branch button should appear
4. Merge is blocked until branch is updated

## Troubleshooting

### Status Checks Don't Appear in Selection List

**Cause:** Status checks only appear after running at least once.

**Solution:**

1. Create a test PR to trigger workflows
2. Wait for workflows to complete
3. Return to branch protection settings
4. The status checks should now be available for selection

### "Required status check not found" Error

**Cause:** Status check name mismatch or workflow not configured.

**Solution:**

1. Verify workflow job names match exactly: `lint`, `format`, `test`
2. Check `.github/workflows/ci.yml` for job names
3. Ensure workflows run on `pull_request` events
4. Re-run a PR to register status checks

### Cannot Push Even After PR is Approved

**Cause:** Required status checks not passing or branch out of date.

**Solution:**

1. Check PR status checks - all must be green
2. Ensure branch is up to date with main
3. Click "Update branch" if prompted
4. Wait for status checks to re-run on updated branch

### Admin Bypass Not Working

**Cause:** "Do not allow bypassing" setting is enabled.

**Solution:**

1. Go to Settings → Branches → Edit protection rule
2. Uncheck "Do not allow bypassing the above settings"
3. Save changes
4. Note: Not recommended for production repositories

## Verifying Current Settings

### Via Web UI

1. Go to Settings → Branches
2. Click **Edit** next to the `main` branch protection rule
3. Review all enabled settings

### Via CLI

```bash
# View complete protection settings
gh api repos/:owner/:repo/branches/main/protection \
  --jq '{
    required_status_checks: .required_status_checks,
    enforce_admins: .enforce_admins,
    required_pull_request_reviews: .required_pull_request_reviews
  }'
```

## Best Practices

1. **Always require status checks** for code quality
2. **Require branches to be up to date** to prevent integration issues
3. **Enable dismiss stale reviews** to ensure fresh approvals
4. **Require conversation resolution** to address all feedback
5. **Consider requiring approvals** for team collaboration
6. **Test protection rules** thoroughly before enforcing on main

## References

- [GitHub Branch Protection Documentation][branch-protection]
- [GitHub API Branch Protection][api-protection]
- [GitHub CLI API Documentation][cli-api]

[branch-protection]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
[api-protection]: https://docs.github.com/en/rest/branches/branch-protection
[cli-api]: https://cli.github.com/manual/gh_api

## Support

If you encounter issues not covered in this guide:

1. Check GitHub's official documentation (links above)
2. Verify your account has admin permissions
3. Ensure workflows are properly configured and running
4. Review GitHub Actions logs for workflow failures
