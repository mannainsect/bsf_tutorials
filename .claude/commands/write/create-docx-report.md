---
argument-hint: [source file(s)...] [output folder] [additional guidance]
description: Create Word document from report file(s)
allowed-tools: [Read, Write, Bash, Skill, TodoWrite]
model: opus
---

# Create Word Document from Report

You are creating a professional Word document from one or multiple
customer-facing report files.

## Input Parameters

Receive three types of arguments:

1. **Source file(s)**: One or more source report markdown files
   (e.g., `reports/003-technical-architecture.md` or multiple files
   like `reports/001-overview.md reports/002-technical.md`)
2. **Output folder**: Directory where final document will be saved
   (e.g., `output/documents/`) - Recognized as the first directory
   path argument
3. **Additional guidance**: Specific instructions for the document
   (e.g., "executive summary format", "include table of contents",
   "technical appendix")

Example invocations:
```
# Single source file
reports/003-architecture.md output/documents/ "executive summary with
TOC"

# Multiple source files
reports/001-overview.md reports/002-technical.md output/documents/
"comprehensive report with TOC"
```

## Context

Read FLOW.md Section 1 (Project name and purpose) and Section 10
(Project-specific context) before starting to understand:
- Project domain and goals
- Target audience expectations
- Document formatting preferences

## Your Task

### Step 1: Parse Input and Read Context

1. Parse arguments to identify:
   - Source file(s): All file paths before the first directory path
   - Output folder: The first directory path in arguments
   - Additional guidance: All remaining text after output folder
2. Read FLOW.md Sections 1 and 10 for project context

3. **Efficient Report Reading (CRITICAL)**:

   **DO NOT immediately read entire report files. Follow this sequence:**

   a. **First: Read only the beginning of each source file** (first 100-200
      lines) to check for:
      - YAML frontmatter (between `---` markers at top)
      - Report Metadata section/table
      - Table of Contents

   b. **If YAML frontmatter exists**, parse it to extract:
      - `target_audience`: Who the report is for
      - `report_type`: Type classification
      - `detail_level`: Level of detail
      - `focus_areas`: Key topics covered
      - Project context (name, purpose, goals)
      - Use this to understand report structure before reading content

   c. **If Report Metadata section exists** (legacy format), extract:
      - Target Audience
      - Detail Level
      - Focus Areas

   d. **If Table of Contents exists**, use it to:
      - Identify document structure (will mirror this in Word doc)
      - Understand section hierarchy
      - Plan heading levels in Word document
      - Identify sections to include/exclude per guidance

   e. **Then: Read content efficiently**:
      - Use TOC to navigate to specific sections if guidance specifies
      - Read sections in order for complete document
      - Skip YAML frontmatter and metadata sections (not for Word doc)
      - Preserve all content formatting for Word conversion

   **Benefits of this approach:**
   - Understand report structure before processing
   - Can skip/prioritize sections per guidance
   - Maintain proper heading hierarchy in Word
   - Efficient token usage

4. If multiple source files, consolidate content logically:
   - Combine related sections
   - Maintain narrative flow
   - Avoid duplicate information

5. Parse additional guidance to understand:
   - Document style preferences
   - Specific sections to include/exclude
   - Formatting requirements

### Step 2: Plan Document Structure

Based on report content and additional guidance:

1. Determine document sections and hierarchy
2. Plan heading levels (H1, H2, H3)
3. Identify tables, lists, and formatted content
4. Plan table of contents if requested
5. Use TodoWrite to track document sections to create

**Default formatting guidance** (override with additional guidance):
- Professional business document style
- Clear heading hierarchy
- Consistent formatting throughout
- Page breaks between major sections
- Proper spacing and margins
- Use of styles for consistency

### Step 3: Create Document using Claude Skills

**CRITICAL**: Use the Skill tool to invoke the `docx` skill for all
Word operations.

```
Skill: document-skills:docx
```

The docx skill handles:
- Creating new documents
- Adding formatted text with styles
- Creating tables with proper formatting
- Adding lists (bulleted and numbered)
- Applying heading styles (H1, H2, H3, etc.)
- Adding page breaks
- Creating table of contents
- Formatting (bold, italic, underline)

**Temporary file handling**:
- Use `/tmp/docx-work/` for all intermediate files
- Create directory with: `mkdir -p /tmp/docx-work`
- Clean up temp files after final document is saved

### Step 4: Content Transformation

Transform report markdown to Word document:

**Markdown to Word mapping**:
- `# Heading` → Heading 1 style
- `## Heading` → Heading 2 style
- `### Heading` → Heading 3 style
- `**bold**` → Bold formatting
- `*italic*` → Italic formatting
- Bullet lists → Bulleted list style
- Numbered lists → Numbered list style
- Tables → Word tables with proper formatting
- Code blocks → Monospace font with shading
- Block quotes → Quote style with indentation

**CRITICAL**: No character limit constraints
- Word handles line wrapping automatically
- Focus on proper formatting, not line length
- Preserve full content from markdown
- Use Word's native formatting capabilities

**Preserve formatting**:
- Maintain heading hierarchy
- Keep list structures intact
- Format tables properly with headers
- Apply consistent styles throughout
- Use proper paragraph spacing

### Step 5: Apply Professional Styling

Apply Word document styling:

1. **Heading styles**: Use built-in Heading 1, 2, 3 styles
2. **Body text**: Normal style with appropriate font (e.g., Calibri
   11pt)
3. **Lists**: Proper indentation and bullet/number formatting
4. **Tables**: Header row formatting, borders, alignment
5. **Spacing**: Appropriate paragraph and line spacing
6. **Page setup**: Standard margins, page size

**If table of contents requested**:
- Add TOC at beginning of document after title
- Use Word's auto-generated TOC from heading styles
- Include page numbers

### Step 6: Save to Output Folder

1. Ensure output folder exists: `mkdir -p [output folder]`
2. Generate filename based on report name and date:
   `[report-name]-document-YYYY-MM-DD.docx`
3. Save final document to output folder
4. Verify file was created successfully

### Step 7: Cleanup

Remove all temporary files:
```bash
rm -rf /tmp/docx-work
```

## Critical Requirements

- Input: Report file path, output folder, additional guidance
- Output: Professional Word document (.docx)
- Use Skill tool (document-skills:docx) for all Word operations
- Use /tmp/docx-work/ for temporary files
- NO character limit constraints (Word handles wrapping)
- Convert ALL markdown formatting to proper Word formatting:
  - Headings → Heading styles
  - Tables → Word tables
  - Bullets → Bulleted lists
  - Bold/italic → Character formatting
- Maintain full content from source report
- Apply professional styling consistently
- Follow additional guidance for structure and formatting
- Clean up all temporary files

## Output Format

**CRITICAL**: Your response must be MINIMAL. Only output:

```
DOCUMENT_CREATED: [output folder]/[filename].docx
Pages: [count]
Sections: [count]
```

Example:
```
DOCUMENT_CREATED: output/documents/architecture-document-2025-11-
03.docx
Pages: 24
Sections: 6
```

Do NOT include:
- Detailed explanations of formatting
- Long summaries of content
- Section-by-section descriptions

## Formatting Quality Checklist

Before outputting completion:

- [ ] All markdown headings converted to Word Heading styles
- [ ] All tables properly formatted with headers
- [ ] All lists use proper Word list formatting
- [ ] Bold and italic formatting preserved
- [ ] Consistent styling throughout
- [ ] Professional appearance
- [ ] Table of contents added if requested
- [ ] Page breaks at logical points

## Output Marker

First line MUST be:

```
DOCUMENT_CREATED: [output_folder]/[filename].docx
```

This marker enables workflow orchestration. Do not omit.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
