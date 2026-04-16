---
argument-hint: [source file(s)...] [output folder] [additional guidance]
description: Create PowerPoint presentation from report file(s)
allowed-tools: [Read, Write, Bash, Skill, Task, TodoWrite]
model: opus
---

# Create PowerPoint Presentation from Report

You are creating a professional PowerPoint presentation from one or
multiple customer-facing report files.

## Input Parameters

Receive three types of arguments:

1. **Source file(s)**: One or more source report markdown files
   (e.g., `reports/003-technical-architecture.md` or multiple files
   like `reports/001-overview.md reports/002-technical.md`)
2. **Output folder**: Directory where final presentation will be saved
   (e.g., `output/presentations/`) - Recognized as the first directory
   path argument
3. **Additional guidance**: Specific instructions for the presentation
   (e.g., "5 slides for CEO on economics", "technical deep-dive with
   15 slides")

Example invocations:
```
# Single source file
reports/003-architecture.md output/presentations/ "5 slides for CEO"

# Multiple source files
reports/001-overview.md reports/002-technical.md output/presentations/
"comprehensive technical presentation"
```

## Context

Read FLOW.md Section 1 (Project name and purpose) and Section 10
(Project-specific context) before starting to understand:
- Project domain and goals
- Target audience expectations
- Key messaging priorities

## Reusable Scripts

**IMPORTANT**: This command uses pre-built scripts in `.claude/scripts/pptx/`:
- `create-template.js` - Creates master template with theme
- `create-slide.js` - Creates individual slide from JSON spec
- `assemble-presentation.js` - Merges slides into final presentation

These scripts avoid recreating code each time and ensure consistency.

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
      - `target_audience`: Who the report is for (helps determine
        presentation style)
      - `report_type`: Type classification (executive, technical, etc.)
      - `detail_level`: Level of detail in report
      - `focus_areas`: Key topics covered
      - Project context (name, purpose, goals)

   c. **If Report Metadata section exists** (legacy format), extract:
      - Target Audience
      - Detail Level
      - Focus Areas

   d. **If Table of Contents exists**, use it to:
      - Identify major sections (becomes slide structure)
      - Understand report hierarchy
      - Prioritize sections based on additional guidance
      - Plan slide allocation per section

   e. **Then: Read strategically** based on TOC and guidance:
      - For "5 slides for CEO": Read Executive Summary + Key Findings
        only
      - For "technical deep-dive": Focus on technical sections, skip
        high-level summaries
      - For comprehensive: Read all sections but extract slide-worthy
        content only
      - Skip verbose prose, focus on key points, data, visuals

   **Benefits of this approach:**
   - Avoid reading 10,000+ line reports completely
   - Extract only presentation-worthy content
   - Match slide depth to audience automatically
   - Save significant tokens and time

4. If multiple source files, consolidate content logically:
   - Combine related sections
   - Maintain narrative flow
   - Avoid duplicate information

5. Parse additional guidance to understand:
   - Slide count target (if specified)
   - Target audience (CEO, technical, mixed)
   - Focus areas or priorities

### Step 2: Plan Presentation Structure

Based on report content and additional guidance:

1. Determine slide count and structure
2. Identify key messages and supporting points
3. Plan visual hierarchy (title slides, content slides, summary)
4. Extract data suitable for charts/visuals
5. Use TodoWrite to track presentation planning steps

**Default visual guidance** (override with additional guidance):
- Clean, professional design
- Maximum 6 bullet points per slide
- Use data visualizations where applicable
- Consistent color scheme (professional_blue)
- Large, readable fonts (Title: 32pt, Body: 18pt)
- White space for clarity

### Step 2.5: Create Master Template

**CRITICAL**: Use the reusable script to create the master template.

1. Create directory: `mkdir -p /tmp/pptx-work`
2. Use pre-built script:
   ```bash
   node .claude/scripts/pptx/create-template.js \
     /tmp/pptx-work/template.pptx \
     professional_blue
   ```
3. Available color schemes:
   - `professional_blue` (default): Navy and blue
   - `corporate_gray`: Grayscale professional
   - `modern_teal`: Teal and cyan

This template will be used by ALL worker agents to ensure visual
consistency.

### Step 2.6: Content Analysis and Slide Specification Generation

For each planned slide, analyze content semantically to determine the
best visual representation:

#### Content Analysis Algorithm

1. **Analyze content patterns:**
   - **Comparison**: Keywords like "vs", "versus", "compared to",
     "before/after", "old vs new"
   - **Financial data**: Currency symbols ($, €, £), percentages,
     revenue/cost/profit terms
   - **Categorical costs**: Multiple categories with associated
     dollar amounts
   - **Time-series**: Dates, quarters, years with numeric trends
   - **Emphasis**: "importantly", "critical", "key takeaway", actual
     quotes with attribution
   - **Metrics**: Multiple similar facts (all numbers, all features,
     all benefits)

2. **Select visual type based on analysis:**
   ```
   if (has quote with attribution) → "emphasis"
   else if (has categorical costs/breakdown) → "pie_chart"
   else if (has time-series or comparative metrics) → "bar_chart"
   else if (has financial numbers + bullet points) →
     "bullet_with_chart"
   else if (has comparison with 2 equal sides) → "two_column"
   else if (is title/intro slide) → "title_only"
   else → "bullets"
   ```

3. **Extract chart data when applicable:**
   - Parse numbers, labels, categories from content
   - Structure as pptxgenjs-compatible format
   - Choose appropriate colors from palette

#### JSON Specification Format

```json
{
  "slide_number": N,
  "title": "Slide Title",
  "subtitle": "Optional subtitle",
  "content": {
    "type": "bullets|title_only|two_column|emphasis|pie_chart|
      bar_chart|bullet_with_chart",

    // For bullets type:
    "items": ["point 1", "point 2", ...],

    // For two_column type:
    "left": {
      "header": "Left Header",
      "items": ["point 1", "point 2"]
    },
    "right": {
      "header": "Right Header",
      "items": ["point 1", "point 2"]
    },

    // For emphasis type:
    "text": "Key quote or important message",
    "attribution": "Optional: Person Name, Title",

    // For chart types (pie_chart, bar_chart, bullet_with_chart):
    "bullets": ["context 1", "context 2"],  // For bullet_with_chart
    "chart_data": {
      "name": "Data Series Name",
      "labels": ["Category A", "Category B", "Category C"],
      "values": [450000, 320000, 180000],
      "colors": ["4472C4", "ED7D31", "A5A5A5"],
      "x_label": "X Axis Label",
      "y_label": "Y Axis Label (include units)"
    }
  },
  "visual_specs": {
    "title_font_size": 32,
    "subtitle_font_size": 20,
    "body_font_size": 18,
    "max_bullets": 6,
    "bullet_spacing": 1.2,
    "color_scheme": "professional_blue",
    "layout": "title_and_content"
  },
  "template_path": "/tmp/pptx-work/template.pptx"
}
```

**Supported content types:**
- `bullets`: Standard bulleted list
- `title_only`: Title slide with optional subtitle
- `two_column`: Left/right comparison split
- `emphasis`: Large centered quote or key message
- `pie_chart`: Categorical breakdown (costs, market share, etc.)
- `bar_chart`: Comparative metrics or time-series data
- `bullet_with_chart`: Bullets on left (40%), chart on right (60%)

**Content extraction rules**:
- Extract concise bullet points from report (not full paragraphs)
- For charts, extract actual numbers and labels from content
- Respect max_bullets limit
- Use active voice and strong verbs
- Choose chart colors that match color_scheme palette
- Include axis labels with units for charts

**Chart color selection** (match to color_scheme):
- professional_blue: ["4472C4", "ED7D31", "A5A5A5", "FFC000",
  "5B9BD5"]
- corporate_gray: ["808080", "404040", "C0C0C0", "606060", "D3D3D3"]
- modern_teal: ["00BCD4", "00796B", "4DB6AC", "26A69A", "80CBC4"]

Store all specifications in a list for batch processing.

### Step 2.7: Technical Implementation Requirements

**CRITICAL**: These rules apply to all worker agents and helper
scripts. Worker agents MUST follow these constraints when creating
slides.

#### HTML Slide Format (for html2pptx library)

**Text Content Rules:**
- ALL text MUST be in semantic HTML tags: `<p>`, `<h1>`-`<h6>`,
  `<ul>`, `<ol>`
- ✅ Correct: `<div><p>Text here</p></div>`
- ❌ Wrong: `<div>Text here</div>` — Text will NOT appear in
  PowerPoint

**Bullet Lists:**
- Use `<ul>` or `<ol>` tags — NEVER manual symbols (•, -, *)
- ✅ Correct: `<ul><li>Item 1</li><li>Item 2</li></ul>`
- ❌ Wrong: `<p>• Item 1</p><p>• Item 2</p>`

**Fonts:**
- ONLY web-safe fonts: Arial, Helvetica, Times New Roman, Georgia,
  Courier New, Verdana, Tahoma, Trebuchet MS, Impact
- Non-web-safe fonts will cause rendering failures

**Slide Dimensions:**
- Body container: `width: 720pt; height: 405pt` (16:9 aspect ratio)
- Margins: Minimum 0.5 inches from edges

**Styling Rules:**
- Backgrounds, borders, box-shadows ONLY work on `<div>` elements
- Text elements (`<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>`) cannot have
  backgrounds or borders
- Use wrapper `<div>` for background effects, text inside for content

#### PptxGenJS Rules (for assembly)

**Color Format (CRITICAL - prevents file corruption):**
- NEVER use `#` prefix with hex colors
- ✅ Correct: `color: "FF0000"`, `fill: { color: "0066CC" }`
- ❌ Wrong: `color: "#FF0000"` — Causes corrupted .pptx files

**Chart Data Format:**
```javascript
[{
  name: "Series Name",
  labels: ["Q1", "Q2", "Q3", "Q4"],
  values: [100, 200, 300, 400]
}]
```
- Charts MUST include axis labels: `catAxisTitle`, `valAxisTitle`
- Pie charts need single series with all categories in `labels` array

**Chart Color Selection:**
- Use colors from the specified color scheme palette (no # prefix)
- professional_blue: `["4472C4", "ED7D31", "A5A5A5", "FFC000",
  "5B9BD5"]`
- corporate_gray: `["808080", "404040", "C0C0C0", "606060",
  "D3D3D3"]`
- modern_teal: `["00BCD4", "00796B", "4DB6AC", "26A69A", "80CBC4"]`

#### Worker Agent Responsibilities

When spawning pptx-slide-creator agents, they will:
1. Receive JSON specification with slide content
2. Generate HTML following above format rules
3. Save to `/tmp/pptx-work/spec_{number}.json`
4. Execute `create-slide.js` which handles html2pptx conversion
5. Verify output files created successfully
6. Report `COMPLETE: slide_XXX.pptx` or `ERROR: reason`

These constraints ensure html2pptx can properly convert HTML to
PowerPoint format without data loss or corruption.

### Step 3: Create Slides via Parallel Sub-Agents

**CRITICAL**: Do NOT create slides yourself. Delegate to worker
agents.

#### Step 3.1: Batch Processing Logic

Claude Code supports **maximum 10 parallel Task invocations** per
message.

For N slides, calculate batches:
- Batch size: 10
- Number of batches: ceil(N / 10)
- Example: 25 slides = 3 batches (10 + 10 + 5)

#### Step 3.2: Spawn Worker Agents in Batches

For each batch of slides (up to 10 at a time):

1. **Send single message with multiple Task invocations**
2. Each Task uses `subagent_type=pptx-slide-creator`
3. Each Task prompt contains:
   - The slide JSON specification
   - Brief instruction to create the slide
   - Expected output format

**Example Task invocation**:

```xml
<invoke name="Task">
  <parameter name="subagent_type">pptx-slide-creator</parameter>
  <parameter name="description">Create slide 5</parameter>
  <parameter name="prompt">
Create PowerPoint slide #5 from this specification.

Slide specification:
```json
{
  "slide_number": 5,
  "title": "Technical Architecture",
  "content": {
    "type": "bullets",
    "items": [
      "Microservices-based design",
      "Cloud-native deployment (AWS)",
      "PostgreSQL + Redis data layer"
    ]
  },
  "visual_specs": {
    "title_font_size": 32,
    "body_font_size": 18,
    "max_bullets": 6,
    "color_scheme": "professional_blue",
    "layout": "title_and_content"
  },
  "template_path": "/tmp/pptx-work/template.pptx"
}
```

Expected output: COMPLETE: slide_005.pptx
  </parameter>
</invoke>
```

#### Step 3.3: Wait and Validate Batch Completion

After spawning each batch:

1. Wait for all sub-agents in batch to complete
2. Check for "COMPLETE: slide_XXX.pptx" messages
3. Verify files exist: `ls /tmp/pptx-work/slide_*.pptx`
4. If any slide failed, retry OR continue with error tracking

#### Step 3.4: Progress Reporting

Report progress between batches:
- "Creating slides 1-10..."
- "Slides 1-10 complete (10/25)"
- "Creating slides 11-20..."
- "Slides 11-20 complete (20/25)"
- "Creating slides 21-25..."
- "All 25 slides created successfully"

### Step 4: Assemble Final Presentation

After all slide files are created, merge them into one presentation.

#### Step 4.1: Verify All Slides Created

```bash
# Count HTML slide files (used for assembly)
slide_count=$(ls /tmp/pptx-work/slide_*.html 2>/dev/null | wc -l)
# Should match planned slide count
```

If count mismatch, identify missing slides and retry OR abort.

**Note:** create-slide.js creates both:
- `slide_XXX.html` - HTML source for assembly
- `slide_XXX.pptx` - Individual slide for verification

The assembly process uses the HTML files.

#### Step 4.2: Merge Slides into Final Presentation

Use the pre-built assembly script:

```bash
node .claude/scripts/pptx/assemble-presentation.js \
  /tmp/pptx-work \
  /tmp/pptx-work/final_presentation.pptx \
  <slide-count>
```

Where:
- First argument: Directory containing slide_001.html, slide_002.html
- Second argument: Output path for final .pptx
- Third argument: Total number of slides

The script automatically:
- Processes HTML slides in order (001, 002, 003, ...)
- Converts each HTML to PPTX slide using html2pptx
- Reports progress every 5 slides
- Verifies all expected slides exist
- Creates final merged presentation

#### Step 4.3: Final Visual Quality Verification

**After assembly**, verify the complete presentation:

1. **Slide count**: Matches planned count
2. **Slide order**: Logical flow maintained
3. **Consistency**: All slides use same template/styling
4. **No duplicates**: No repeated slide numbers
5. **File size**: Reasonable (not corrupted)

Quick checks:
```bash
# Verify file exists and has reasonable size
ls -lh /tmp/pptx-work/final_presentation.pptx
# Should be > 50KB for typical presentation
```

### Step 5: Save to Output Folder

1. Ensure output folder exists: `mkdir -p [output folder]`
2. Generate filename based on report name and date:
   `[report-name]-presentation-YYYY-MM-DD.pptx`
3. Copy final presentation from temp to output:
   ```bash
   cp /tmp/pptx-work/final_presentation.pptx \
      [output_folder]/[filename].pptx
   ```
4. Verify file was created successfully:
   ```bash
   ls -lh [output_folder]/[filename].pptx
   ```

### Step 6: Cleanup

Remove all temporary files and directory:
```bash
rm -rf /tmp/pptx-work
```

This removes:
- All HTML slide files (slide_*.html)
- All individual PPTX files (slide_*.pptx)
- All JSON spec files (spec_*.json)
- Template file (template.pptx)

Verify cleanup:
```bash
# Should output: No such file or directory
ls /tmp/pptx-work 2>&1
```

## Critical Requirements

### Workflow Architecture

- **Main Agent (You)**: Orchestrator only
  - Read report and plan slides
  - Create master template (ONE Skill invocation)
  - Generate slide specifications (JSON)
  - Spawn worker sub-agents in parallel batches
  - Assemble final presentation (ONE Skill invocation)
  - Save and cleanup

- **Worker Agents (pptx-slide-creator)**: Create individual slides
  - Invoked directly via Task tool with subagent_type=pptx-slide-creator
  - Each creates ONE slide with visual verification
  - Maximum 10 workers in parallel per batch

### Technical Requirements

- Input: Report file path, output folder, additional guidance
- Output: Professional PowerPoint presentation
- Use Node.js scripts in `.claude/scripts/pptx/` for:
  1. Creating master template (`create-template.js`)
  2. Creating individual slides (`create-slide.js`)
  3. Assembling final presentation (`assemble-presentation.js`)
- Use Task tool with pptx-slide-creator to delegate slide creation
- Use /tmp/pptx-work/ for all temporary files
- Default to professional_blue color scheme (override via guidance)
- Default visual specs: Title 32pt, Body 18pt, Max 6 bullets
- Follow additional guidance for slide count and audience
- Clean up all temporary files after completion

### Scalability

- Supports 100+ slides without context overflow
- Parallel processing: 10 slides at a time
- Expected time: ~30 seconds per slide in parallel batches
- Total time for 100 slides: ~5-10 minutes (vs 50+ min sequential)

## Output Format

**CRITICAL**: Your response must be MINIMAL. Only output:

```
PRESENTATION_CREATED: [output folder]/[filename].pptx
Slides: [count]
```

Example:
```
PRESENTATION_CREATED: output/presentations/architecture-presentation-
2025-11-03.pptx
Slides: 12
```

Do NOT include:
- Detailed explanations of each slide
- Long summaries of content
- Section-by-section descriptions

## Visual Quality Checklist

Visual quality is enforced at TWO levels:

### Worker Level (Per-Slide)
Each worker agent verifies before saving:
- [ ] Title font ≥ visual_specs.title_font_size (typically 32pt)
- [ ] Body font ≥ visual_specs.body_font_size (typically 18pt)
- [ ] Bullet count ≤ visual_specs.max_bullets (typically 6)
- [ ] No text overflow off slide boundaries
- [ ] Consistent color scheme applied

### Orchestrator Level (Final Assembly)
Before outputting completion, verify:
- [ ] Slide count matches plan
- [ ] All slide files created successfully
- [ ] Logical flow between slides maintained
- [ ] No duplicate slide numbers
- [ ] File size reasonable (> 50KB)
- [ ] Final presentation opens without errors

## Output Marker

First line MUST be:

```
PRESENTATION_CREATED: [output_folder]/[filename].pptx
```

This marker enables workflow orchestration. Do not omit.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
