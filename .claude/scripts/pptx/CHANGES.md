# PowerPoint Workflow Changes Summary

## What Changed

### 1. **Fully Portable Scripts** ✅
- Copied `html2pptx.js` from `~/.claude/plugins/` to local
  `.claude/scripts/pptx/`
- Updated `create-slide.js` to use `./html2pptx.js`
- Updated `assemble-presentation.js` to use `./html2pptx.js`
- **No external plugin dependencies required** - everything is
  self-contained

### 2. **Documentation Updates** ✅

#### create-pptx-presentation.md
- **Removed:** Skill (document-skills:pptx) references
- **Added:** Step 2.7 "Technical Implementation Requirements"
  - HTML format rules for html2pptx
  - PptxGenJS color format rules (no # prefix)
  - Chart data format specifications
  - Worker agent responsibilities
- **Updated:** Technical Requirements section to reference Node.js
  scripts

#### pptx-slide-creator.md
- **Added:** "HTML Format Requirements (CRITICAL)" section
  - Text content rules
  - Bullet list format
  - Font restrictions
  - Color format rules
  - Styling constraints

#### .claude/scripts/pptx/README.md
- **Updated:** Dependencies section (removed plugin path)
- **Added:** "Technical Constraints" section
  - HTML format requirements
  - PptxGenJS rules
  - Chart data format
  - Slide dimensions

### 3. **Single Source of Truth**
All technical implementation details are now documented in the slash
command, with references in worker agent documentation. No need to
consult external skill documentation.

## How the Assembly Process Works

### Question: "Does the main agent put together the final PowerPoint?"

**YES** - Here's the flow:

### Step-by-Step Process:

1. **Main Agent (Orchestrator)** creates master template:
   ```bash
   node .claude/scripts/pptx/create-template.js \
     /tmp/pptx-work/template.pptx professional_blue
   ```

2. **Worker Agents** (pptx-slide-creator) create individual slides in
   parallel:
   - Each agent receives JSON specification
   - Each calls: `node .claude/scripts/pptx/create-slide.js ...`
   - Each creates TWO files:
     - `slide_001.html` - HTML source (for assembly)
     - `slide_001.pptx` - Individual slide (for verification)
   - Workers run in batches of 10 (max parallel Task calls)

3. **Main Agent (Orchestrator)** assembles final presentation:
   ```bash
   node .claude/scripts/pptx/assemble-presentation.js \
     /tmp/pptx-work \
     /tmp/pptx-work/final_presentation.pptx \
     25
   ```

4. **Assembly Process** (assemble-presentation.js):
   - Reads all `slide_*.html` files in order (001, 002, 003, ...)
   - Converts each HTML to PowerPoint slide using html2pptx
   - Adds charts if specified in JSON specs
   - Merges all slides into **one final .pptx file**
   - Reports progress every 5 slides

5. **Main Agent** saves to output folder:
   ```bash
   cp /tmp/pptx-work/final_presentation.pptx \
      output/presentations/report-2025-11-13.pptx
   ```

6. **Main Agent** cleans up:
   ```bash
   rm -rf /tmp/pptx-work
   ```

### Final Result:
**ONE complete PowerPoint file** with all slides in the correct order,
saved to the output folder specified by the user.

## Portability Benefits

1. **No Plugin Dependency**: All code in project `.claude/` folder
2. **Version Control**: html2pptx.js can be committed to git
3. **Consistency**: Same html2pptx version for all users
4. **Offline Capable**: No need for external plugin installation
5. **Self-Contained**: Copy `.claude/scripts/pptx/` to any project

## Migration for Other Projects

To use this in another project:

1. Copy `.claude/scripts/pptx/` folder
2. Copy `.claude/commands/write/create-pptx-presentation.md`
3. Copy `.claude/agents/pptx-slide-creator.md`
4. Install global dependencies:
   ```bash
   npm install -g pptxgenjs playwright sharp
   ```

Everything else is self-contained!

## Breaking Changes

None - the workflow remains the same. Only the underlying
implementation is now fully portable.

## Technical Improvements

1. **Critical HTML rules documented** - prevents text disappearing
2. **Color format rules documented** - prevents file corruption
3. **Chart data format specified** - ensures charts render correctly
4. **Worker responsibilities clarified** - better error handling

---

**Version:** 2.0 (Portable)
**Date:** 2025-11-13
**Status:** Production Ready ✅
