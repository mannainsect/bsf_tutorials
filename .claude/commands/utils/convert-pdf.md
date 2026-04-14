---
argument-hint: [optional-filename.pdf]
description: Convert PDFs to markdown, move to archived, process all if no filename specified
allowed-tools: [Bash, Task, Glob]
model: claude-opus-4-6
---

# Convert PDF to Markdown

You are orchestrating PDF to markdown conversion for the current
project. Follow these steps carefully and rely on project-specific
details from @FLOW.md.

## Step 0: Gather Project Context from FLOW.md

1. Read @FLOW.md Section 1: Critical Directories to identify:
   - **Incoming PDFs**: Look for "Incoming directory" under PDF
     Processing (default: `pdfs/new/`)
   - **Archive directory**: Look for "Archive directory" under PDF
     Processing (default: `pdfs/archived/`)
   - **References output**: Look for "Internal Knowledge Base" Location
     (default: `references/`)

2. Extract the actual directory paths from FLOW.md:
   ```
   [incoming_pdf_dir] = value from FLOW.md or default pdfs/new/
   [archived_pdf_dir] = value from FLOW.md or default pdfs/archived/
   [references_dir] = value from FLOW.md or default references/
   ```

3. If paths are not defined in FLOW.md, use the defaults shown above.

**These paths will be passed to each sub-agent in their task
instructions.**

## Step 1: Parse Arguments

Check if a user argument was provided at the end of this document.

**With argument**: User specified a filename
- Process only the specified PDF file

**Without argument**: User argument is empty or not provided
- Process all PDFs in `[incoming_pdf_dir]`

## Step 2: List and Organize PDFs

Let `[incoming_pdf_dir]` be the directory identified in Step 0 for new
PDFs.

Run: `ls [incoming_pdf_dir]`

Create a list of all PDF files (ignore placeholder files).

**If no PDFs found**:
- Report: "No PDFs found in [incoming_pdf_dir]. Add PDF files to
  process."
- Stop execution

**If PDFs found**:
- Store the list of PDF filenames in order (alphabetically)
- Report: "Found N PDF(s) ready for conversion"
- Continue to next step

**Important**: You will explicitly assign each filename to a specific
agent. Do NOT let agents randomly select files.

## Step 3: Launch Conversion Agents with Assigned Files

**Note on Agent Invocation**: This command uses the Task tool with
subagent_type to invoke convert-pdf-to-markdown agents. The agent
playbook is loaded automatically by the Task tool - the orchestrator
provides task-specific instructions while the agent follows its own
playbook for technical execution. This aligns with FLOW.md's
delegation model.

### Option A: Specific File Provided

If user argument is not empty, launch a single convert-pdf-to-markdown agent:

```
Use the Task tool with subagent_type "general-purpose" and load
@.claude/agents/convert-pdf-to-markdown.md with this prompt:

"Convert the PDF file: [filename from user argument]

Directory paths:
- Incoming PDFs: [incoming_pdf_dir]
- Archive: [archived_pdf_dir]
- Output: [references_dir]

Follow @.claude/agents/convert-pdf-to-markdown.md to:
1. Move [filename] from [incoming_pdf_dir] to [archived_pdf_dir]
2. Convert to markdown using .claude/scripts/pdf_processor/pdf_to_md.py
3. Polish formatting (fix spacing, word concatenation, paragraph flow)
4. Save to [references_dir] using kebab-case naming
5. Report completion with quality checks

IMPORTANT: Process ONLY this file: [filename]"
```

### Option B: Process All Files (Batch Mode)

If user argument is empty, process the list of PDFs from Step 2:

**IMPORTANT**: Launch agents in batches of up to 3 in a SINGLE message
using multiple Task tool calls in parallel.

For each PDF in the list, assign it explicitly to an agent:

```
Agent 1 prompt:
"Convert the PDF file: [first-file.pdf]

Directory paths:
- Incoming PDFs: [incoming_pdf_dir]
- Archive: [archived_pdf_dir]
- Output: [references_dir]

Follow @.claude/agents/convert-pdf-to-markdown.md to:
1. Move [first-file.pdf] from [incoming_pdf_dir] to [archived_pdf_dir]
2. Convert to markdown using .claude/scripts/pdf_processor/pdf_to_md.py
3. Polish formatting
4. Report completion

ONLY process this file: [first-file.pdf]"

Agent 2 prompt:
"Convert the PDF file: [second-file.pdf]

Directory paths:
- Incoming PDFs: [incoming_pdf_dir]
- Archive: [archived_pdf_dir]
- Output: [references_dir]

Follow @.claude/agents/convert-pdf-to-markdown.md to:
1. Move [second-file.pdf] from [incoming_pdf_dir] to [archived_pdf_dir]
2. Convert to markdown using .claude/scripts/pdf_processor/pdf_to_md.py
3. Polish formatting
4. Report completion

ONLY process this file: [second-file.pdf]"

[Continue for agent 3 if needed]
```

**Batch processing rules**:
- Maximum 3 agents per batch running simultaneously
- Explicitly assign a filename to each agent
- Track which files are assigned to prevent duplicates
- If more than 3 PDFs exist, launch first batch of 3, wait for
  completion, then launch next batch with remaining files
- Continue until all PDFs from the list are processed

## Step 4: Monitor Progress and Collect Reports

After launching each batch of agents:

1. Wait for all agents in the current batch to complete
2. Collect completion reports from each agent
3. Track successfully converted files and any errors
4. Check if more PDFs remain in your tracked list
5. If unprocessed PDFs remain, launch next batch (up to 3 agents)
   with the next files from your list
6. Repeat until all PDFs from the original list are processed

**Important**: Each agent handles the complete workflow (convert +
polish), so you just need to collect their final reports.

## Step 5: Report Results

Once all agents have completed, provide a summary:

```markdown
## PDF Conversion Summary

**Total PDFs processed**: N
**Successful conversions**: N
**Failed conversions**: N (if any)

**Output location**: [references_dir]
**Archived PDFs**: [archived_pdf_dir]

### Converted Files:
1. original-name.pdf → kebab-case-name.md ✓
2. another-file.pdf → another-file.md ✓
[List all processed files with status]

### Quality Standards Applied by Agents:
- ✓ PDF converted to markdown
- ✓ Letter spacing removed
- ✓ Word concatenation fixed
- ✓ Paragraphs formatted to 80 characters per line
- ✓ Structure preserved (headers, lists, tables)
- ✓ Files moved to the archive directory

All PDFs have been processed. Each agent handled conversion and
formatting polish for its assigned file.
```

**If errors occurred**: List which files failed and the error
messages reported by agents.

## Error Handling

**File not found**: If user argument specifies a filename that doesn't
exist in [incoming_pdf_dir], report error and list available files

**Agent failures**: If an agent reports an error, include it in the
final summary and note which file failed. Continue processing
remaining files.

**Empty folder**: If [incoming_pdf_dir] is empty at start, report no
files to process

**Invalid argument**: If user argument contains invalid characters or
path traversal, reject and warn the user

**Partial batch failures**: If some agents in a batch fail, continue
with next batch for remaining files

## Important Notes

**Orchestrator responsibilities**:
- Reads FLOW.md to extract directory paths
- Lists all PDFs in [incoming_pdf_dir]
- Explicitly assigns filenames to each agent (no random selection)
- Passes directory paths to each agent in task instructions
- Launches agents in batches of up to 3
- Collects completion reports from agents
- Provides final summary to user

**Agent responsibilities** (convert-pdf-to-markdown):
- Receives directory paths from orchestrator
- Moves assigned file to archive directory BEFORE processing
- Converts PDF to markdown using .claude/scripts/pdf_processor/
- Polishes formatting (removes letter spacing, fixes word
  concatenation, reflows paragraphs)
- Ensures 80-character line limit
- Saves output to references directory with kebab-case naming
- Reports completion with quality checks

**Scalability benefits**:
- Orchestrator only coordinates, doesn't process files
- Agents handle complete workflow independently
- Full parallelization (up to 3 agents simultaneously)
- No bottlenecks - orchestrator doesn't need to sequentially polish
  files
- Each agent uses Haiku model for efficiency

## Usage Examples

Convert specific file:
```
/convert-pdf "Market Analysis 2024.pdf"
```

Convert all files in incoming directory (defined in FLOW.md):
```
/convert-pdf
```

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
