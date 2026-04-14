---
argument-hint: [query or task filename] [optional: internal:
  /tmp/internal-summary-*.md]
description: Execute sequential web research and save findings
allowed-tools: [Read, Write, Glob, TodoWrite, Task, Bash]
model: claude-opus-4-6
---

# Search Web

You are conducting web research. This command orchestrates
sequential web research agents and synthesizes their findings
into a deduplicated project-relevant report.

## Process

1. Analyze input (query string OR task file, with optional
   internal summary)
2. Extract project context from FLOW.md (references_dir,
   domain, tech stack)
3. Break down research into subtopics with distinct keyword sets
4. Select optimal agent mix based on research needs
5. Launch agents sequentially (synchronous mode for MCP tools)
6. Read agent reports saved in `/tmp/` (temporary files)
7. Create synthesized report with proper YAML frontmatter
8. Call metadata-maintenance to update index/tags files
9. Clean up `/tmp/` agent files
10. Return: RESEARCH_COMPLETE: [path]

## Step 1: Input Handling

Read user argument from <USER-ARGUMENT> at end of document.

**Input formats accepted:**

1. **Direct query**: "AI agent frameworks"
2. **Task file**: "tasks/001-research-ai-agents.md"
3. **Query with internal summary**: "AI agent frameworks
   [internal: /tmp/internal-summary-12345-ai-agents.md]"

**Parsing logic:**

1. Extract main query/task file path
2. Extract internal summary path if present (format:
   [internal: /path/to/file.md])
3. If input ends with ".md": Read task file, extract research
   question, success criteria, keywords
4. If internal summary provided: Read it, identify what's
   already known, note knowledge gaps
5. Determine search strategy:
   - **With internal summary**: Focus ONLY on identified gaps
   - **Without internal summary**: Comprehensive search

**Read FLOW.md for project context:**

- Extract `[references_dir]` for output file location
- Extract project description, domain, tech stack (Section 1)
- Extract project-specific terminology (Section 10)
- Use context to filter relevance during synthesis

## Step 2: Create Task List

Use TodoWrite to track progress:

- Analyze research input and identify key questions
- Determine agent strategy
- Research subtopic 1...N
- Collect agent reports from /tmp/
- Synthesize report with YAML frontmatter
- Call metadata-maintenance to update indexes
- Clean up /tmp/ agent files
- Validate final output

Mark first task as in_progress.

## Step 3: Design Search Strategy

Break research topic into 3-6 subtopics with DISTINCT keyword
sets.

**For each subtopic define:**

- Specific question or information need
- **Primary keyword set** (3-5 keywords)
- **Search angle** (technical/commercial/regulatory/geographic)
- Type of information expected
- Relevance to project domain (from FLOW.md)

Each subtopic MUST use different primary keywords to maximize
coverage and minimize duplication.

**Example:**

- Subtopic 1: "Industrial systems architecture"
  - Keywords: industrial, modular systems, automation,
    architecture
  - Angle: Technical/engineering
- Subtopic 2: "Equipment suppliers"
  - Keywords: manufacturers, suppliers, CAPEX, turnkey
  - Angle: Commercial/procurement
- Subtopic 3: "Facility design standards"
  - Keywords: facility design, environmental controls,
    regulations
  - Angle: Regulatory/compliance

## Step 4: Select Research Agents

Use decision matrix and agent characteristics to select
optimal mix.

### Agent Capabilities

**quick-web-research (Haiku)**

- Fast landscape scans, basic fact-finding
- Use for: Initial overviews, key players, non-technical info

**brave-web-research (Opus + Brave Search)**

- Exceptional for recent news/funding (10/10 validated)
- Tools: brave_web_search, brave_news_search,
  brave_video_search
- FREE TIER: 2,000 queries/month
- Use for: News, market developments, video/image content

**exa-web-research (Opus + Exa API)**

- AI-optimized neural search with 9 category types
- Best for: Person research (LinkedIn), company intelligence,
  GitHub, papers
- Categories: "linkedin profile", "company", "github",
  "research paper", "news", "pdf", "tweet", "personal site",
  "financial report"
- Natural language queries, agent handles API details

**tavily-web-research (Opus + Tavily AI)**

- Advanced search with domain filtering, date ranges
- Tools: tavily-search, tavily-extract, tavily-map,
  tavily-crawl
- Use for: Investor intelligence, strategic analysis

**firecrawl-web-research (Opus + Firecrawl)**

- Structured data extraction from known URLs
- NOT for discovery (blocked by paywalls)
- Use TWO-PHASE: Discovery (other agents) then Extraction
- Tools: scrape_url, crawl_site, map_site, extract_data

**perplexity-web-research (Opus + Perplexity AI)**

- Exceptional real-time capability (10/10 validated)
- Often finds most recent data missed by others
- Tools: perplexity_search, perplexity_ask,
  perplexity_research, perplexity_reason
- Launch: EXACTLY 1 agent for most topics

**deep-web-research (Opus)**

- Complex technical analysis, regulatory requirements
- Cost/financial verification, risk assessment
- Use for: Information feeding deliverables, expert sources

### Decision Matrix

| Topic Type            | Quick | Brave | Exa | Tav | Fire | Perp | Deep |
| --------------------- | ----- | ----- | --- | --- | ---- | ---- | ---- |
| Recent news/funding   |       | ++    | +   |     |      | ++   |      |
| Person research       |       |       | ++  |     |      |      |      |
| Company intelligence  |       | +     | ++  | +   |      | +    |      |
| Code/GitHub search    |       |       | ++  |     |      |      |      |
| Academic papers       |       |       | ++  |     |      |      | +    |
| Quick fact-finding    | +     | +     | +   | +   |      | +    |      |
| Technical specs       |       | +     | +   | +   |      | +    | +    |
| Cost/financial data   |       | +     | ++  | +   | +    | +    | +    |
| Regulatory/compliance |       | +     | +   | +   |      | +    | +    |
| Known URLs to extract |       |       | +   | +   | +    |      |      |
| Real-time information |       | +     | +   | +   |      | ++   |      |

**Legend**: + = Suitable, ++ = Excellent/Validated

### Standard Agent Mix Patterns

**Balanced (most topics):**
- 1-2 quick/brave/exa for landscape
- 0-1 tavily for advanced filtering
- 0-1 firecrawl if URLs known
- 1 perplexity for real-time synthesis
- 2-3 deep for detailed analysis
- **Total: 4-8 agents**

**Survey-Heavy (market scans):**
- 3-4 quick/brave/exa for multiple angles
- 1 perplexity for verification
- 1 deep for key technical points
- **Total: 5-6 agents**

**Analysis-Heavy (technical deep-dives):**
- 1 quick/brave/exa for context
- 1 perplexity for strategic reasoning
- 3-4 deep for detailed investigation
- **Total: 5-6 agents**

Always use multiple agent types - they complement rather than
replace each other.

### Document Strategy

Before launching, explicitly state:

```markdown
## Research Agent Strategy

**Topic**: [Topic name]
**Agent mix**: [W] quick/brave/exa + [X] tavily +
[Y] firecrawl + [Z] perplexity + [V] deep

**Subtopic 1** ([agent-type])
- Keywords: [keyword1, keyword2, keyword3]
- Angle: [technical/commercial/regulatory]
- Rationale: [Why this agent is appropriate]

**Subtopic 2** ([agent-type])
- Keywords: [keyword4, keyword5, keyword6]
- Angle: [Different angle]

[Continue for all subtopics]

**Total**: [W+X+Y+Z+V] agents launching sequentially
**Keyword coverage**: Each agent has distinct primary keywords
```

## Step 5: Launch Agents Sequentially

**CRITICAL**: Launch agents ONE AT A TIME in synchronous mode.
MCP tools are not passed to subagents in background mode
(Claude Code bug #13254).

**Agent invocation format (NO run_in_background):**

```python
Task(subagent_type="quick-web-research",
     prompt="...", description="...")
# Wait for result, then launch next agent
Task(subagent_type="brave-web-research",
     prompt="...", description="...")
```

**Research prompt template:**

```
Research [SUBTOPIC] for [PROJECT NAME from FLOW.md].

Context from FLOW.md:
[Relevant excerpts: domain, tech stack, terminology]

Primary keywords: [keyword1, keyword2, keyword3]
Alternative terms: [alt1, alt2, alt3]
Search angle: [technical/commercial/regulatory/geographic]

Specific information needed:
- [Requirement 1]
- [Requirement 2]

Deliverable: [Concise summary (quick) OR comprehensive
report (deep)]
```

**Agent-specific prompt guidance:**

- **Brave**: Specify tools (web/news/video_search), use
  count/freshness parameters
- **Exa**: Specify categories, use natural language queries,
  specify date ranges if needed
- **Tavily**: Specify tool (search/extract/map/crawl),
  domain filtering, date ranges
- **Firecrawl**: Specify exact URLs, tool
  (scrape_url/crawl_site), output format (Markdown)
- **Perplexity**: Use direct language, specify recency

## Step 6: Collect Agent Reports

As agents complete:

- Mark corresponding todos as completed
- Parse agent output for success OR failure
- For successes: Extract file paths from completion notices
- For failures: Note failure reason, continue processing

**Agent output formats:**

**SUCCESS:**
```
AGENT_REPORT_COMPLETE: /tmp/web-[agent]-[topic]-[DATE]-[TIME].md
TOPICS_IDENTIFIED: [...]
TAGS_SUGGESTED: [...]
```

**FAILURE:**
```
RESEARCH_FAILED: [Detailed reason]
```

**Processing logic:**

1. Check output for "AGENT_REPORT_COMPLETE:" or
   "RESEARCH_FAILED:"
2. If complete: Extract file path, parse TOPICS_IDENTIFIED
   and TAGS_SUGGESTED
3. If failed: Extract failure reason
4. Track both successful paths and failure reasons
5. Never abort entire process due to individual failures

## Step 7: Synthesize Deduplicated Report

Create project-relevant, deduplicated synthesis organized
by themes (NOT by agent). Factual synthesis only - no
opinions/recommendations.

**Step 7.1: Initialize synthesis file with YAML frontmatter**

Create: `[references_dir]/YYYY-MM-DD-[topic-slug].md`

```markdown
---
title: "Web Research: [Topic]"
date: "YYYY-MM-DD"
source: "web-synthesis"
topics:
  - [topic1 from agents]
  - [topic2 from agents]
tags:
  - [tag1 from agents]
  - [tag2 from agents]
geographies:
  - [geography from context, default: "global"]
data_types:
  - "research-synthesis"
authors:
  - "Multiple web sources"
related: []
---

# Web Research: [Topic]

**Research Date:** YYYY-MM-DD
**Agents Deployed:** [agent count and mix]
**Successful Agents:** [count]
**Failed Agents:** [count, if any]
**Internal Summary Used:** [path or "None"]

---

[Content added iteratively]
```

**Frontmatter construction:**
- Consolidate TOPICS_IDENTIFIED from all successful agents
- Consolidate TAGS_SUGGESTED from all successful agents
- Remove duplicates, lowercase all values

**If any agents failed**, add an Agent Status section after
the header listing successful and failed agents with reasons.
Omit this section if all agents succeeded.

**Step 7.2: Iterative synthesis process**

Read each SUCCESSFUL agent report ONE BY ONE from `/tmp/`:

1. **First report**: Extract key findings, write initial
   content sections, preserve citations
2. **Subsequent reports**: Compare with existing synthesis,
   add ONLY new information, skip duplicates
3. **Apply FLOW.md filtering**: Remove findings not relevant
   to project domain/tech stack

If any report exceeds 2000 lines, read in chunks using
offset/limit parameters.

**Synthesis rules:**

- Organize by themes, not agents
- Deduplicate aggressively
- Remove project-irrelevant content
- DO NOT add opinions or recommendations
- Preserve citations
- 80 character line limit

**Final report structure:**

```markdown
## Executive Summary
[2-3 paragraph overview]

## [Theme 1]
[Synthesized findings, deduplicated]
- Finding A [Source: Agent 1, Agent 3]
- Finding B [Source: Agent 2]

## [Theme 2]
[Continue...]

## Sources Referenced
- Original sources cited within content
```

## Step 8: Update Index and Tags

After synthesis file is written to `[references_dir]/`:

1. Call metadata-maintenance:
   ```python
   Task(
       subagent_type="metadata-maintenance",
       prompt="""
       Update index for new file.
       folder: [references_dir]
       operation: add
       filepath: YYYY-MM-DD-[topic-slug].md
       """
   )
   ```
2. Verify output contains `INDEX_UPDATED:`
3. If indexing fails, report error but continue (run
   `/research:index-build` manually to rebuild).

## Step 9: Clean Up Temporary Files

After metadata-maintenance completes:

- Delete ALL agent tmp files: `rm -f /tmp/web-*.md`
- Verify cleanup: `ls /tmp/web-*.md 2>/dev/null || echo "Clean"`
- Only delete AFTER successful synthesis and indexing

## Step 10: Validate Output

Before completing:

1. All subtopics addressed (from successful agents)
2. Agent outputs parsed correctly
3. Agent Status section present if any failures occurred
4. YAML frontmatter present with topics and tags
5. All unique findings from successful agents included
6. 80 character limit enforced
7. Organized by themes, not agents
8. Executive summary present, citations preserved
9. metadata-maintenance called successfully
10. All /tmp/web-*.md files deleted
11. Filename: YYYY-MM-DD-[topic-slug].md at [references_dir]
12. All todos marked completed

## Output

**CRITICAL**: Response must be MINIMAL. Output ONLY:

```
RESEARCH_COMPLETE: [references_dir]/YYYY-MM-DD-[topic-slug].md
TOPICS_IDENTIFIED: ["topic1", "topic2"]
TAGS_ADDED: ["tag-one", "tag-two"]
INDEX_UPDATED: references/index.md
```

Use JSON array syntax for topics/tags. Do NOT include
explanations, summaries, or descriptions.

<USER-ARGUMENT>$ARGUMENTS</USER-ARGUMENT>
