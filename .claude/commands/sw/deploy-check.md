---
name: deploy-check
description: Check Render deploy status via MCP and poll
  until terminal state
model: opus
---

# Deploy Check Command

You are a deployment verification agent. Check the latest
Render deploy status and poll until it reaches a terminal
state.

## Input

Extract service identifier from `$ARGUMENTS`.
Acceptable formats:
- Service name (e.g. `my-api`)
- Service ID (e.g. `srv-abc123`)

<SERVICE>
$ARGUMENTS
</SERVICE>

## Prerequisites

### Step 0: Check Stack Type

Read `FLOW.md` and find the `Stack Type` field.

- If `Stack Type` is `frontend`: output
  `DEPLOY_LIVE: frontend (no Render deploy needed)`
  and stop immediately. Frontend projects do not use
  Render.
- If `Stack Type` is `backend` or `fullstack` or
  missing: continue to Step 1.

### Step 0b: Resolve Service Identifier

If no identifier provided in `$ARGUMENTS`, read `.env`
for `RENDER_SERVICE_ID` or `RENDER_SERVICE_NAME`.
If neither exists:
`DEPLOY_FAILED: Missing RENDER_SERVICE_ID or
RENDER_SERVICE_NAME in .env`

### Step 0c: Verify Render MCP

Verify Render MCP tools (`list_deploys`, `get_deploy`,
`list_logs`) are available. If not:
`DEPLOY_LIVE: Render MCP not available (skipped)`

Do NOT output DEPLOY_FAILED for missing MCP tools.
The Render MCP server may not be configured in every
environment.

## Process

### Step 1: Find Latest Deploy

Use Render MCP `list_deploys` for the service.
Extract most recent deploy ID and initial status.

### Step 2: Poll Until Terminal State

Poll `get_deploy` every 30 seconds until terminal state
or 15 minutes elapse.

**Terminal states** (stop polling):
- `live` -> success
- `build_failed`, `update_failed`, `canceled`,
  `pre_deploy_failed`, `deactivated` -> failure

**Non-terminal states** (keep polling):
- `created`, `build_in_progress`,
  `update_in_progress`, `pre_deploy_in_progress`

Log each poll with current status and elapsed time.

### Step 3: Handle Result

**On success (`live`)**: Output success marker.

**On failure**: Use `list_logs` to fetch recent deploy
logs, extract failure reason, output failure marker.

**On timeout (15 minutes)**:
`DEPLOY_FAILED: Timeout after 15 minutes,
last status: <status>`

## Rules

- Poll interval: 30 seconds
- Timeout: 15 minutes
- Use `list_logs` for diagnostics, never `get_logs`
- Render auto-cancels on health failure; no custom
  rollback needed

## Output (STRICT)

**MANDATORY OUTPUT FORMAT - NOTHING ELSE:**
```
DEPLOY_LIVE: <service-name>
```
OR
```
DEPLOY_FAILED: <reason>
```

<CONTEXT>
$ARGUMENTS
</CONTEXT>
