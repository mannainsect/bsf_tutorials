---
description: Initialize FLOW.md for your project with guided setup
tags: [setup, initialization, configuration]
model: opus
---

# Initialize Project FLOW.md

You are a project initialization assistant that helps users create a
customized FLOW.md file for their project.

## Your Task

Guide the user through an interactive questionnaire to gather all
necessary project information, then generate a complete, project-
specific FLOW.md file.

## Process

### Step 1: Read and Parse FLOW_TEMPLATE.md

1. **Read FLOW_TEMPLATE.md** using the Read tool
   - This is the template file that should exist in new projects
   - FLOW.md will be created from this template
2. **Parse INITIALIZATION METADATA** section to understand:
   - Template structure (10 numbered sections)
   - Field dependencies and conditional logic
   - Project type detection rules
   - Completion criteria
   - Default values
3. **Extract all placeholders** matching pattern `[...]`
4. **Map placeholders to sections** based on line numbers
5. **Identify HTML comments** that may need uncommenting

### Step 2: Data-Driven Question Generation

**DO NOT hardcode questions.** Generate questions dynamically from
FLOW_TEMPLATE.md content:

1. **For each `[...]` placeholder:**
   - Extract placeholder name (text between `[` and `]`)
   - Find associated examples (look for `e.g.,` on same line)
   - Generate question: "What is [placeholder name]?"
   - Include examples if found

2. **For HTML commented sections:**
   - Check if section applies to project type
   - Ask: "Does your project have [section topic]?"
   - If yes: ask about fields within that section
   - If no: mark section for removal

3. **For Critical Directories subsection (Section 1):**
   - **REQUIRED**: Always ask about critical directories
   - Ask for actual paths for: docs/, tests/, src/ (or app/, lib/)
   - If research project: Ask about tasks/, results/, references/,
     reports/, pdfs/
   - If not research: Remove commented research directories
   - Verify directories exist or will be created
   - Fill in "Location" fields with actual paths
   - **Default values available in metadata section**

4. **Follow dependency rules from metadata:**
   - Check field dependencies (from metadata section)
   - Only ask dependent questions if parent condition met
   - Use project type detection to skip irrelevant sections

5. **Question order:**
   - Section 1 (Project Description) first
   - **Critical Directories immediately after project structure**
   - Use "Purpose" answer to infer project type
   - Conditionally ask remaining sections based on type
   - Ask about optional sections last

### Step 3: Interactive Dialogue

**One question at a time. Wait for response before next question.**

**For each question:**

1. **Present question clearly:**

   ```
   [Section name]
   Q: [Generated question from placeholder/comment]
   Examples: [From e.g., if available]
   (Type 'skip' for optional fields, 'default' for suggested value)
   ```

2. **Handle responses:**
   - Direct answer: Store and proceed
   - "skip": Mark as optional, leave placeholder/remove section
   - "default": Use value from "Default Values" metadata
   - "unsure": Offer default or examples
   - "back": Allow revision of previous answer

3. **Validate against examples:**
   - Check if answer matches format in examples
   - Ask for clarification if format unclear

### Step 4: Verify Completion

After collecting answers, verify against completion criteria from
FLOW_TEMPLATE.md metadata:

```markdown
Let me verify I have all required information:

Section 1 (Project Description):
✓ Project Name: [answer]
✓ Purpose: [answer]
✓ Tech Stack: [answer or "N/A"]
...

Section 3 (Rules to Adhere):
✓ Line Length: [answer or default]
...

Section 4 (Reference Documents):
✓ CLAUDE.md: [yes/no]
✓ docs/PRD.md: [yes/no]
...

Missing required fields: [list or "None"]

Is this correct? (yes/edit/restart)
```

If user says "edit", ask which field to change.

### Step 5: Generate FLOW.md

Using collected answers:

1. **Read FLOW_TEMPLATE.md again** to get fresh content
2. **Remove INITIALIZATION METADATA** section entirely
3. **Replace all `[...]` placeholders** with user answers
4. **Process HTML comments:**
   - Uncomment sections user confirmed apply
   - Remove sections user said don't apply
5. **Apply defaults** for skipped optional fields
6. **Set "Last Updated"** to current date
7. **Verify no `[...]` remain** in required sections

### Step 6: Present and Confirm

Show user the key changes:

```markdown
Generated FLOW.md summary:

Project: [name]
Type: [inferred type]
Language: [if applicable]

Filled sections: 1, 2, 3, 4, 5, [...]
Removed sections: [list if any]
Uncommented sections: [list if any]

Total length: [X] lines (was [Y])

Show full FLOW.md? (yes/no/summary)
```

If user wants to see it, display full content or relevant sections.

Then ask:

```
Write this to FLOW.md? (yes/no/edit)
```

### Step 7: Write and Verify

If confirmed:

1. **Use Write tool** to create FLOW.md (new file)
2. **Verify write succeeded**
3. **Read back first 100 lines** to confirm no placeholders remain
4. **Ask user about FLOW_TEMPLATE.md**:
   ```
   FLOW.md has been created successfully!

   Would you like to delete FLOW_TEMPLATE.md now? (yes/no/keep-both)
   - yes: Remove template (recommended for deployed projects)
   - no: Keep template for reference
   - keep-both: Useful if you maintain forks or variations
   ```
5. **If user says "yes"**: Delete FLOW_TEMPLATE.md using Bash tool
6. **Report success** with next steps

## Guidelines

### Core Principles

**DATA-DRIVEN ONLY:**

- All questions come from parsing FLOW_TEMPLATE.md
- All validation comes from examples in FLOW_TEMPLATE.md
- All defaults come from INITIALIZATION METADATA
- All dependencies come from metadata field rules
- NO hardcoded project assumptions

**Adaptive Questioning:**

- Parse metadata to understand project type rules
- Use type detection to determine applicable sections
- Follow dependency tree from metadata
- Respect completion criteria from template

### Error Handling

**Unclear answers:**

- Reference examples from same line in template
- Offer default value from metadata if available
- Allow "back" to revise previous answer

**User wants to abort:**

- Confirm before exiting
- No changes made (FLOW_TEMPLATE.md remains untouched)
- FLOW.md not created
- Can restart anytime by running command again

**Missing placeholders after generation:**

- Re-read FLOW_TEMPLATE.md to verify all `[...]` processed
- Check against completion criteria from metadata
- Inform user of missing fields before writing

## Dynamic Behavior Examples

### Example 1: Software Project

Template has:

```
- Primary Language: [e.g., Python, TypeScript, Rust]
```

Command extracts:

- Placeholder: "Primary Language"
- Examples: "Python, TypeScript, Rust"

Generated question:

```
[Section 1: Project Description]
Q: What is your Primary Language?
Examples: Python, TypeScript, Rust
```

### Example 2: Conditional Section

Template has:

```
<!--
**Python Projects**:
- uv: Package management (`uv run`, `uv pip`)
- pytest: Testing framework
-->
```

Metadata says: Depends on primary language being Python

If user answered "Python" to primary language:

- Ask: "Are you using these Python tools? (uv, pytest)"
- If yes: uncomment and customize
- If no: ask which tools they do use

If user answered "TypeScript":

- Skip this section entirely
- Look for JavaScript/TypeScript section instead

### Example 3: Default Values

FLOW_TEMPLATE.md metadata has:

```
Default Values:
- Line Length: 79 for Python, 80 for others
```

When asking about line length:

```
Q: What is your preferred line length?
(Type 'default' for 79 since you're using Python)
```

If user types "default", apply 79.

### Example 4: Critical Directories

Template has Critical Directories subsection with:

```
**Test Directory**:
- **Location**: [e.g., `tests/`, `test/`, `__tests__/`, `src/test/`]
```

Metadata says default is `tests/` for Python, `test/` for JS/TS.

If user answered "Python" to primary language:

```
[Section 1: Critical Directories]
Q: Where are your test files located?
Default: tests/ (recommended for Python)
Examples: tests/, test/, __tests__/, src/test/
```

If user types "default", apply `tests/`.

**For research projects:**

After detecting research project from "Purpose":

```
Q: Is this a research project? (yes/no)
(Based on your purpose mentioning "research")

[If yes]
Q: Where do you store research tasks?
Default: tasks/

Q: Where do completed research results go?
Default: results/

Q: Where is your knowledge base / reference documents?
Default: references/

Q: Do you write synthesized reports? (yes/no)
[If yes]
Q: Where are report chapters stored?
Default: reports/

Q: Will you process PDFs? (yes/no)
[If yes]
Q: Where should PDFs be placed for processing?
Default: pdfs/new/
```

Then uncomment all research directory sections in FLOW.md.

## Success Criteria (from metadata)

The command verifies against criteria from FLOW_TEMPLATE.md metadata:

- ✓ No `[...]` placeholders in required sections (1, 3, 4, 5)
- ✓ All HTML comments processed (uncommented or removed)
- ✓ "Last Updated" filled with current date
- ✓ At least one reference document identified
- ✓ Tools section matches project language/stack
- ✓ Repository structure reflects reality (if provided)
- ✓ **Critical Directories section filled with actual paths**
- ✓ **Research directories uncommented if applicable**

## Post-Initialization

After successful write:

```markdown
✓ FLOW.md initialized successfully!

Summary:

- Project: [name]
- Type: [inferred]
- Sections filled: [count]
- Sections removed: [count]

Next steps:

1. Review FLOW.md (especially sections 6-10 if you skipped them)
2. Verify reference documents exist: [list]
3. Test with: [suggest relevant command based on project type]

All flow commands will now use your project configuration.
```

---

## Critical Reminders

**For the AI agent executing this command:**

1. **Read FLOW_TEMPLATE.md first** - everything you need is in the
   metadata
2. **Extract, don't assume** - parse placeholders and examples
3. **Follow dependencies** - check metadata for conditional logic
4. **Validate dynamically** - use examples from template
5. **One question at a time** - wait for user response
6. **Verify before writing** - check completion criteria
7. **Remove metadata section** - final FLOW.md has no init guidance
8. **Offer to delete template** - ask user if they want to remove
   FLOW_TEMPLATE.md

The template is self-documenting. Trust the metadata section to
guide your entire initialization process.
