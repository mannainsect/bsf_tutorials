# PowerPoint Generation Scripts

Reusable scripts for scalable PowerPoint presentation creation using
the orchestrator-worker sub-agent pattern.

## Overview

These scripts support the `/write/create-pptx-presentation` command
and `pptx-slide-creator` worker agent, enabling creation of 100+
slide presentations without context overflow.

## Scripts

### `create-template.js`

Creates a master PowerPoint template with specified color scheme.

**Usage:**
```bash
node create-template.js <output-path> [color-scheme]
```

**Arguments:**
- `output-path`: Where to save the template .pptx file
- `color-scheme`: Optional, defaults to `professional_blue`

**Color Schemes:**
- `professional_blue`: Navy (#1F3864) and blue (#4472C4)
- `corporate_gray`: Grayscale (#404040, #808080)
- `modern_teal`: Teal (#00796B) and cyan (#00BCD4)

**Example:**
```bash
node create-template.js /tmp/pptx-work/template.pptx professional_blue
```

**Output:**
```
Template created: /tmp/pptx-work/template.pptx
```

---

### `create-slide.js`

Creates a single PowerPoint slide from JSON specification.

**Usage:**
```bash
node create-slide.js <spec-json-file> <output-path>
```

**Arguments:**
- `spec-json-file`: Path to JSON file containing slide specification
- `output-path`: Where to save the slide .pptx file

**Spec Format:**
```json
{
  "slide_number": 1,
  "title": "Slide Title",
  "subtitle": "Optional subtitle",
  "content": {
    "type": "bullets",
    "items": ["Point 1", "Point 2", "Point 3"]
  },
  "visual_specs": {
    "title_font_size": 32,
    "body_font_size": 18,
    "max_bullets": 6,
    "color_scheme": "professional_blue"
  }
}
```

**Content Types:**
- `title_only`: Title slide with optional subtitle
- `bullets`: Bullet point list
- `two_column`: Left/right columns with headers and bullets

**Example:**
```bash
node create-slide.js /tmp/pptx-work/spec_001.json \
  /tmp/pptx-work/slide_001.pptx
```

**Output:**
```
COMPLETE: slide_001.pptx
```

---

### `assemble-presentation.js`

Assembles individual slide HTML files into final PowerPoint
presentation.

**Usage:**
```bash
node assemble-presentation.js <slides-dir> <output-path> <slide-count>
```

**Arguments:**
- `slides-dir`: Directory containing slide_001.html, slide_002.html, etc.
- `output-path`: Where to save final .pptx file
- `slide-count`: Total number of slides to assemble

**Example:**
```bash
node assemble-presentation.js /tmp/pptx-work \
  /tmp/pptx-work/final.pptx 20
```

**Output:**
```
Assembling 20 slides from /tmp/pptx-work...
  Assembled 5/20 slides...
  Assembled 10/20 slides...
  Assembled 15/20 slides...

Final presentation assembled successfully!
  Slides: 20/20
  Output: /tmp/pptx-work/final.pptx
```

---

## Workflow Integration

### Orchestrator (Main Agent)

The `/write/create-pptx-presentation` command uses:

1. **create-template.js** - Step 2.5: Create master template
2. **assemble-presentation.js** - Step 4.2: Merge slides

### Worker Agent

The `pptx-slide-creator` agent uses:

1. **create-slide.js** - Step 3: Create individual slide

### Typical Workflow

```bash
# 1. Create master template
node .claude/scripts/pptx/create-template.js \
  /tmp/pptx-work/template.pptx professional_blue

# 2. Workers create individual slides (parallel)
node .claude/scripts/pptx/create-slide.js \
  /tmp/pptx-work/spec_001.json \
  /tmp/pptx-work/slide_001.pptx
# ... (slides 2-20 created in parallel batches)

# 3. Assemble final presentation
node .claude/scripts/pptx/assemble-presentation.js \
  /tmp/pptx-work \
  /tmp/pptx-work/final.pptx 20

# 4. Copy to output
cp /tmp/pptx-work/final.pptx \
  output/presentations/presentation-2025-11-03.pptx

# 5. Cleanup
rm -rf /tmp/pptx-work
```

## Benefits

1. **No Code Regeneration**: Scripts are pre-built and tested
2. **Consistency**: Same logic across all invocations
3. **Performance**: Faster than generating scripts each time
4. **Maintainability**: Single source of truth for updates
5. **Scalability**: Supports 100+ slides without modification

## Dependencies

These scripts require globally installed packages:
- `pptxgenjs` - PowerPoint generation library
- `playwright` - HTML rendering engine
- `sharp` - Image processing (for gradients/icons)

The scripts include a local copy of `html2pptx.js` for HTML to
PowerPoint conversion.

## Technical Constraints

### HTML Format Requirements (html2pptx)

The scripts use `html2pptx.js` which has strict HTML format rules:

**Text Content:**
- ALL text MUST be in semantic tags: `<p>`, `<h1>`-`<h6>`, `<ul>`,
  `<ol>`
- Text directly in `<div>` or `<span>` will NOT appear in PowerPoint
- Example:
  - ✅ Correct: `<div><p>Text here</p></div>`
  - ❌ Wrong: `<div>Text here</div>`

**Bullet Lists:**
- Use `<ul>` or `<ol>` tags — NEVER manual symbols (•, -, *)
- Example:
  - ✅ Correct: `<ul><li>Item 1</li><li>Item 2</li></ul>`
  - ❌ Wrong: `<p>• Item 1</p>`

**Fonts:**
- ONLY web-safe fonts: Arial, Helvetica, Times New Roman, Georgia,
  Courier New, Verdana, Tahoma, Trebuchet MS, Impact
- Non-web-safe fonts cause rendering failures

**Styling:**
- Backgrounds, borders, shadows ONLY work on `<div>` elements
- Text elements cannot have backgrounds/borders
- Use wrapper pattern: `<div style="background: ..."><p>Text</p></div>`

### PptxGenJS Rules

**Color Format (CRITICAL):**
- NEVER use `#` prefix with hex colors — causes file corruption
- ✅ Correct: `color: "FF0000"`, `fill: { color: "0066CC" }`
- ❌ Wrong: `color: "#FF0000"`

**Chart Data:**
```javascript
[{
  name: "Series Name",
  labels: ["Q1", "Q2", "Q3", "Q4"],
  values: [100, 200, 300, 400]
}]
```
- Charts require axis labels: `catAxisTitle`, `valAxisTitle`
- Pie charts need single series with all categories in `labels` array

**Slide Dimensions:**
- Body container: `width: 720pt; height: 405pt` (16:9)
- Margins: Minimum 0.5 inches from edges

## Troubleshooting

### Script not found

Ensure scripts are executable:
```bash
chmod +x .claude/scripts/pptx/*.js
```

### Missing dependencies

Install global packages:
```bash
npm install -g pptxgenjs playwright sharp
```

### Invalid color scheme

Use one of the predefined schemes:
- professional_blue
- corporate_gray
- modern_teal

Or add a new scheme in `create-template.js` COLOR_SCHEMES object.

## Future Enhancements

Potential additions:
- Support for chart slides
- Support for image slides
- Support for table slides
- Custom font selection
- More layout types
- Theme customization via JSON config

---

**Version:** 1.0
**Last Updated:** 2025-11-03
**Maintained by:** flow_ai project
