---
argument-hint: [source file(s)...] [output folder] [additional guidance]
description: Create Excel spreadsheet from report file(s)
allowed-tools: [Read, Write, Bash, Skill, TodoWrite]
model: opus
---

# Create Excel Spreadsheet from Report

You are creating a professional Excel workbook from one or multiple
customer-facing report files.

## Input Parameters

Receive three types of arguments:

1. **Source file(s)**: One or more source report markdown files
   (e.g., `reports/003-technical-architecture.md` or multiple files
   like `reports/001-overview.md reports/002-technical.md`)
2. **Output folder**: Directory where final spreadsheet will be saved
   (e.g., `output/spreadsheets/`) - Recognized as the first directory
   path argument
3. **Additional guidance**: Specific instructions for the spreadsheet
   (e.g., "financial summary with charts", "separate tabs by category",
   "include pivot tables")

Example invocations:
```
# Single source file
reports/003-architecture.md output/spreadsheets/ "separate tabs by
data type"

# Multiple source files
reports/001-overview.md reports/002-technical.md output/spreadsheets/
"combined financial analysis with charts"
```

## Context

Read FLOW.md Section 1 (Project name and purpose) and Section 10
(Project-specific context) before starting to understand:
- Project domain and goals
- Data types and categories
- Stakeholder reporting needs

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
      - `source_documents`: How many source files
      - `focus_areas`: Key topics covered
      - Project context (name, purpose, goals)

   c. **If Report Metadata section exists** (legacy format), extract:
      - Target Audience
      - Detail Level
      - Focus Areas
      - Source Documents count

   d. **If Table of Contents exists**, use it to identify:
      - Major sections in the report
      - Which sections contain data/tables/metrics
      - Section structure and hierarchy

   e. **Then: Selectively read sections** based on metadata and TOC:
      - Skip Executive Summary (usually prose, not data)
      - Focus on sections with data/tables/metrics
      - Look for sections matching additional guidance
      - Read only relevant sections for spreadsheet content

   **Benefits of this approach:**
   - Avoid reading 10,000+ line reports completely
   - Extract only data-rich sections
   - Understand report structure before processing
   - Save significant tokens and time

4. If multiple source files, consolidate content logically:
   - Combine related sections
   - Maintain narrative flow
   - Avoid duplicate information

5. Parse additional guidance to understand:
   - Data organization preferences (single vs multiple tabs)
   - Chart/visualization requirements
   - Specific data to highlight
   - Formatting preferences

### Step 2: Analyze Report Data

Analyze the report content to identify data categories:

**Data type detection patterns:**

1. **Financial data**:
   - Currency symbols ($, €, £)
   - Terms: revenue, cost, profit, budget, expense, ROI
   - Percentage calculations
   - Time-series financial metrics

2. **Metrics and KPIs**:
   - Performance indicators
   - Measurements with units
   - Comparative data (before/after, target vs actual)
   - Success criteria

3. **Timeline/Schedule data**:
   - Dates, quarters, milestones
   - Project phases
   - Deadlines and deliverables

4. **Technical specifications**:
   - Configuration parameters
   - Technical requirements
   - System specifications
   - Feature lists

5. **Categorical breakdowns**:
   - Lists with categories
   - Hierarchical data
   - Grouped information

**Categorization rules:**
- Group related data into logical tabs
- Maximum 10 tabs per workbook (for clarity)
- If only 1-2 categories, use single tab with sections
- If 3+ distinct categories, use multiple tabs
- Use TodoWrite to track identified categories

### Step 3: Plan Workbook Structure

Based on data analysis and additional guidance:

1. **Determine tab structure**:
   - Single tab: "Summary" or "Report"
   - Multiple tabs: Named by category (e.g., "Financial",
     "Technical", "Timeline")

2. **Plan data layout per tab**:
   - Headers and column structure
   - Table formatting
   - Chart placement (if applicable)
   - Summary sections

3. **Identify visualizations**:
   - Financial data → Line/bar charts for trends
   - Categorical data → Pie charts for distribution
   - Comparative data → Stacked bar charts
   - Time-series → Line charts with markers

**Default formatting guidance** (override with additional guidance):
- Professional business spreadsheet style
- Header row with bold formatting and background color
- Freeze header rows for scrolling
- Auto-fit column widths
- Currency formatting for financial data
- Date formatting for temporal data
- Percentage formatting where applicable
- Conditional formatting for thresholds (if applicable)

### Step 4: Create Workbook using Claude Skills

**CRITICAL**: Use the Skill tool to invoke the `xlsx` skill for all
Excel operations.

```
Skill: document-skills:xlsx
```

The xlsx skill handles:
- Creating new workbooks
- Adding multiple worksheets
- Writing data with formulas
- Applying cell formatting (bold, colors, borders)
- Creating charts and visualizations
- Setting column widths and row heights
- Applying conditional formatting
- Creating pivot tables (if requested)
- Freezing panes

**Temporary file handling**:
- Use `/tmp/xlsx-work/` for all intermediate files
- Create directory with: `mkdir -p /tmp/xlsx-work`
- Clean up temp files after final workbook is saved

### Step 5: Data Transformation

Transform report content into structured data:

**Markdown to Excel mapping**:
- Tables → Excel tables with header formatting
- Lists → Structured rows with categories
- Numeric data → Formatted cells with appropriate types
- Sections → Separate worksheets or labeled sections

**Data structuring rules**:
1. **Headers**: First row of each table/section
   - Bold text
   - Background fill (light blue or gray)
   - Freeze pane below header
2. **Data rows**: Consistent formatting
   - Currency columns: $#,##0.00
   - Percentage columns: 0.0%
   - Date columns: YYYY-MM-DD or MM/DD/YYYY
3. **Calculated fields**: Excel formulas where appropriate
   - SUM for totals
   - AVERAGE for means
   - Percentage calculations
4. **Charts**: Placed to the right or below data tables
   - Clear titles
   - Axis labels
   - Legend where needed

**Preserve data integrity**:
- Maintain all numeric values exactly as in report
- Preserve relationships between data points
- Keep categorical groupings intact
- Apply consistent units throughout

### Step 6: Apply Professional Styling

Apply Excel formatting:

1. **Color scheme**: Professional blues/grays (not bright colors)
   - Header: Light blue (#4472C4) or gray (#808080)
   - Alt rows: Very light gray (#F2F2F2) for readability
2. **Fonts**: Calibri or Arial, 11pt body, 12pt headers
3. **Borders**: Light gray borders around tables
4. **Alignment**: Left for text, right for numbers, center for
   headers
5. **Column widths**: Auto-fit to content (min 10, max 50 chars)
6. **Number formats**: Apply based on data type
7. **Conditional formatting** (if applicable):
   - Red for negative values
   - Green for positive growth
   - Color scales for ranges

**If charts requested**:
- Professional chart style (no 3D effects)
- Clear axis titles with units
- Data labels where helpful
- Matching color scheme
- Positioned for easy viewing

### Step 7: Save to Output Folder

1. Ensure output folder exists: `mkdir -p [output folder]`
2. Generate filename based on report name and date:
   `[report-name]-spreadsheet-YYYY-MM-DD.xlsx`
3. Save final workbook to output folder
4. Verify file was created successfully:
   ```bash
   ls -lh [output_folder]/[filename].xlsx
   ```

### Step 8: Cleanup

Remove all temporary files:
```bash
rm -rf /tmp/xlsx-work
```

## Critical Requirements

- Input: Report file path, output folder, additional guidance
- Output: Professional Excel workbook (.xlsx)
- Use Skill tool (document-skills:xlsx) for all Excel operations
- Use /tmp/xlsx-work/ for temporary files
- Analyze report to identify data categories
- Create multiple tabs (3-10) for distinct data categories
- Apply professional formatting consistently
- Include charts/visualizations for financial or metric data
- Use Excel formulas for calculated fields
- Follow additional guidance for structure and formatting
- Clean up all temporary files

## Output Format

**CRITICAL**: Your response must be MINIMAL. Only output:

```
SPREADSHEET_CREATED: [output folder]/[filename].xlsx
Tabs: [count]
Rows: [approximate total across all tabs]
Charts: [count]
```

Example:
```
SPREADSHEET_CREATED: output/spreadsheets/architecture-spreadsheet-
2025-11-03.xlsx
Tabs: 4
Rows: ~156
Charts: 2
```

Do NOT include:
- Detailed explanations of each tab
- Long summaries of data
- Tab-by-tab descriptions

## Formatting Quality Checklist

Before outputting completion:

- [ ] All tables have bold header rows with background color
- [ ] Header rows are frozen for scrolling
- [ ] Column widths are appropriate for content
- [ ] Numeric data has proper formatting (currency, %, dates)
- [ ] Charts are properly labeled with titles and axes
- [ ] Consistent color scheme throughout workbook
- [ ] Professional appearance
- [ ] Multiple tabs for distinct data categories (if applicable)
- [ ] All data from report is included

## Output Marker

First line MUST be:

```
SPREADSHEET_CREATED: [output_folder]/[filename].xlsx
```

This marker enables workflow orchestration. Do not omit.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
