---
argument-hint: [query string] [--limit N]
description: Use index.md/tags.md plus light content reads to rank relevant references
allowed-tools: [Read, Task]
model: claude-opus-4-6
---

# /research:index-query

## Purpose

Perform an internal search over the v3 text-first indexes by delegating
to the `reference-search` agent, which uses `references/index.md`,
`references/tags.md`, and shallow content reads to return a ranked list
of reference file paths.

## Context Discovery

Before executing a query:

1. Read `FLOW.md` Section 1: Critical Directories to resolve
   `[references_dir]` (Internal Knowledge Base; default
   `references/`). Use this resolved path instead of hardcoded
   defaults.
2. Confirm that `[references_dir]/index.md` exists and is readable;
   this is a hard prerequisite for v3 search.
3. Check for `[references_dir]/tags.md` (optional but recommended) so
   the search agent can reason about tag usage.
4. If helpful, briefly review `FLOW.md` sections 1 and 10 to provide
   domain hints that may influence how the query is interpreted.

## Steps

1. **Parse arguments**
   - Accept a free-form query string argument; if it is empty, prompt
     the operator for a query.
   - Optionally parse `--limit N` (default 20) to cap the number of
     results returned.

2. **Verify prerequisites**
   - Use `Read` to check that `[references_dir]/index.md` exists.
   - If it is missing or empty, print a clear message instructing the
     user to run `/research:index-build` and exit with code `1`.

3. **Delegate to `reference-search` agent**
   - Invoke `Task` with `subagent_type="reference-search"`, providing:
     - The original query string.
     - The desired result limit.
     - Any relevant context hints from `FLOW.md` (especially sections 1
       and 10, if helpful), summarised briefly in the prompt rather
       than inlined.
   - Allow the agent to apply its v3 search algorithm over
     `[references_dir]/index.md` and `[references_dir]/tags.md`, plus
     light content reads of candidate files.

4. **Return results verbatim**
   - Print the agent’s response **without** reformatting, ensuring the
     first three markers appear exactly once and in this order:
     - `QUERY: <terms>`
     - `RESULTS: <count>`
     - `TOP_MATCH: <path-or-NONE>`
   - The response must also include a `RELEVANT_FILES:` section listing
     one path per line so downstream commands can parse it easily.

## Output Markers

The delegated agent is responsible for producing these markers:

- `QUERY: <terms>`
- `RESULTS: <count>`
- `TOP_MATCH: <path-or-NONE>`
- `RELEVANT_FILES:` followed by `- <path>` entries

## Post-Conditions

- No files are modified; the command only reports ranked search
  results.
- Exit code is `0` on successful agent completion and `1` when
  prerequisites are missing or the agent signals a hard failure.
