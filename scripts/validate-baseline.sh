#!/usr/bin/env bash
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

# Helper function for test results
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++)) || true
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++)) || true
}

warn() {
  echo -e "${YELLOW}!${NC} $1"
}

# 1. Validate Git State
validate_git_state() {
  echo ""
  echo "=== Git State Validation ==="

  # Check commit hash file exists
  if [ ! -f ".baseline/commit_hash.txt" ]; then
    fail "commit_hash.txt missing"
    return 0
  fi

  # Read and validate commit hash format (40-char SHA-1)
  COMMIT_HASH=$(cat .baseline/commit_hash.txt | tr -d '\n')
  if [[ $COMMIT_HASH =~ ^[0-9a-f]{40}$ ]]; then
    pass "Commit hash format valid (40-char SHA-1)"
  else
    fail "Commit hash format invalid: '$COMMIT_HASH'"
  fi

  # Check branch file exists and has content
  if [ ! -f ".baseline/branch.txt" ]; then
    fail "branch.txt missing"
  elif [ -s ".baseline/branch.txt" ]; then
    BRANCH=$(cat .baseline/branch.txt | tr -d '\n')
    pass "Branch captured: '$BRANCH'"
  else
    fail "branch.txt is empty"
  fi
}

# 2. Validate Coverage Data
validate_coverage_data() {
  echo ""
  echo "=== Coverage Data Validation ==="

  # Check coverage file exists
  if [ ! -f ".baseline/coverage_output.txt" ]; then
    fail "coverage_output.txt missing"
    return 0
  fi

  # Check file has content
  if [ ! -s ".baseline/coverage_output.txt" ]; then
    fail "coverage_output.txt is empty"
    return 0
  fi

  pass "Coverage output file exists and has content"

  # Verify it contains test metrics
  if grep -qE "Test Files.*\|.*passed" .baseline/coverage_output.txt; then
    pass "Coverage contains test metrics"
  else
    warn "Coverage file may not contain test metrics"
  fi
}

# 3. Validate Lint Output
validate_lint_output() {
  echo ""
  echo "=== Lint Output Validation ==="

  # Check lint file exists
  if [ ! -f ".baseline/lint_output.txt" ]; then
    fail "lint_output.txt missing"
    return 0
  fi

  # Check file has content
  if [ ! -s ".baseline/lint_output.txt" ]; then
    fail "lint_output.txt is empty"
    return 0
  fi

  pass "Lint output file exists and has content"

  # Verify it contains error counts
  if grep -qE "(problems?|errors?|warnings?)" \
      .baseline/lint_output.txt; then
    pass "Lint output contains error information"
  else
    warn "Lint file may not contain standard error format"
  fi
}

# 4. Validate TypeCheck Output
validate_typecheck_output() {
  echo ""
  echo "=== TypeCheck Output Validation ==="

  # Check typecheck file exists
  if [ ! -f ".baseline/typecheck_output.txt" ]; then
    fail "typecheck_output.txt missing"
    return 0
  fi

  # Check file has content
  if [ ! -s ".baseline/typecheck_output.txt" ]; then
    fail "typecheck_output.txt is empty"
    return 0
  fi

  pass "TypeCheck output file exists and has content"

  # Verify it contains TypeScript errors
  if grep -qE "(error TS|found [0-9]+ errors?)" \
      .baseline/typecheck_output.txt; then
    pass "TypeCheck output contains error information"
  else
    warn "TypeCheck file may not contain standard error format"
  fi
}

# 5. Validate BASELINE.md Structure
validate_baseline_doc() {
  echo ""
  echo "=== BASELINE.md Structure Validation ==="

  if [ ! -f "docs/BASELINE.md" ]; then
    fail "BASELINE.md missing"
    return 0
  fi

  pass "BASELINE.md exists"

  # Check for all 6 required sections
  SECTIONS=(
    "1. Git State"
    "2. Test Coverage Metrics"
    "3. Lint Errors"
    "4. TypeScript Errors"
    "5. File Size Analysis"
    "6. Security Observations"
  )

  for section in "${SECTIONS[@]}"; do
    if grep -q "## $section" docs/BASELINE.md; then
      pass "Section found: $section"
    else
      fail "Section missing: $section"
    fi
  done
}

# 6. Validate MOBILE_TESTING.md Quality
validate_mobile_testing_doc() {
  echo ""
  echo "=== MOBILE_TESTING.md Quality Validation ==="

  if [ ! -f "docs/MOBILE_TESTING.md" ]; then
    fail "MOBILE_TESTING.md missing"
    return 0
  fi

  pass "MOBILE_TESTING.md exists"

  # Check for all 3 required sections
  SECTIONS=(
    "1. Platform Options"
    "2. Setup Prerequisites"
    "3. Decision Matrix"
  )

  for section in "${SECTIONS[@]}"; do
    if grep -q "## $section" docs/MOBILE_TESTING.md; then
      pass "Section found: $section"
    else
      fail "Section missing: $section"
    fi
  done
}

# 7. Validate Markdown Line Length
validate_markdown_line_length() {
  echo ""
  echo "=== Markdown Line Length Validation (max 80 chars) ==="

  # Check BASELINE.md
  if [ -f "docs/BASELINE.md" ]; then
    LONG_LINES=$(awk 'length > 80 {print NR": "substr($0,1,80)"..."}' \
      docs/BASELINE.md | head -5)
    if [ -z "$LONG_LINES" ]; then
      pass "BASELINE.md: All lines ≤ 80 characters"
    else
      fail "BASELINE.md: Lines exceed 80 characters"
      echo "$LONG_LINES"
    fi
  fi

  # Check MOBILE_TESTING.md
  if [ -f "docs/MOBILE_TESTING.md" ]; then
    LONG_LINES=$(awk 'length > 80 {print NR": "substr($0,1,80)"..."}' \
      docs/MOBILE_TESTING.md | head -5)
    if [ -z "$LONG_LINES" ]; then
      pass "MOBILE_TESTING.md: All lines ≤ 80 characters"
    else
      fail "MOBILE_TESTING.md: Lines exceed 80 characters"
      echo "$LONG_LINES"
    fi
  fi
}

# 8. Validate Directory Structure
validate_directory_structure() {
  echo ""
  echo "=== Directory Structure Validation ==="

  # Check .baseline/ directory
  if [ -d ".baseline" ]; then
    pass ".baseline/ directory exists"
  else
    fail ".baseline/ directory missing"
  fi

  # Check docs/ directory
  if [ -d "docs" ]; then
    pass "docs/ directory exists"
  else
    fail "docs/ directory missing"
  fi

  # Check scripts/ directory
  if [ -d "scripts" ]; then
    pass "scripts/ directory exists"
  else
    fail "scripts/ directory missing"
  fi
}

# 9. Validate File Permissions
validate_file_permissions() {
  echo ""
  echo "=== File Permissions Validation ==="

  # Check if this script is executable
  if [ -x "$0" ]; then
    pass "validate-baseline.sh is executable"
  else
    warn "validate-baseline.sh is not executable (chmod +x needed)"
  fi
}

# 10. Validate Baseline Reproducibility
validate_baseline_reproducibility() {
  echo ""
  echo "=== Baseline Reproducibility Check ==="

  # Verify all core files exist
  REQUIRED_FILES=(
    ".baseline/commit_hash.txt"
    ".baseline/branch.txt"
    ".baseline/coverage_output.txt"
    ".baseline/lint_output.txt"
    ".baseline/typecheck_output.txt"
    "docs/BASELINE.md"
    "docs/MOBILE_TESTING.md"
  )

  ALL_PRESENT=true
  for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
      ALL_PRESENT=false
      fail "Required file missing: $file"
    fi
  done

  if [ "$ALL_PRESENT" = true ]; then
    pass "All required baseline files present"
    pass "Baseline can be reproduced"
  else
    fail "Baseline incomplete - cannot reproduce"
  fi
}

# Main execution
main() {
  echo "============================================"
  echo "  Baseline Validation Script"
  echo "============================================"

  # Run all validations
  validate_git_state
  validate_coverage_data
  validate_lint_output
  validate_typecheck_output
  validate_baseline_doc
  validate_mobile_testing_doc
  validate_markdown_line_length
  validate_directory_structure
  validate_file_permissions
  validate_baseline_reproducibility

  # Summary
  echo ""
  echo "============================================"
  echo "  Validation Summary"
  echo "============================================"
  echo -e "${GREEN}Passed:${NC} $PASSED"
  echo -e "${RED}Failed:${NC} $FAILED"
  echo ""

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Validation failed with $FAILED errors${NC}"
    exit 1
  fi
}

main "$@"
