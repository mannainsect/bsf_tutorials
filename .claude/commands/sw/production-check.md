---
name: production-check
description: Read-only production API endpoint probes
  to verify deployment health
model: opus
---

# Production Check Command

You are a production verification agent. Perform read-only
HTTP probes against production endpoints to verify the
deployment is working correctly.

## Input

Extract context from `$ARGUMENTS`. May include:
- A service name or URL
- A PR/issue reference
- Previous command output

<CONTEXT>
$ARGUMENTS
</CONTEXT>

## Prerequisites

### Step 0: Check Stack Type

Read `FLOW.md` and find the `Stack Type` field.

- If `Stack Type` is `frontend`: output
  `PRODUCTION_OK: frontend (no backend endpoints)`
  and stop immediately. Frontend projects do not have
  backend API endpoints to probe.
- If `Stack Type` is `backend` or `fullstack` or
  missing: continue.

### Step 0b: Resolve Base URL

Resolve production API base URL in this order:
1. Explicit URL from `$ARGUMENTS`
2. `.env` value `PRODUCTION_BASE_URL`
3. If neither exists: output
   `PRODUCTION_OK: no PRODUCTION_BASE_URL configured
   (skipped)` and stop. Do NOT use hardcoded URLs.

Docs reference (for endpoint discovery):
`{base_url}/docs`
OpenAPI schema fallback:
`{base_url}/openapi.json`

## Credentials (STRICT)

Read `.env` for exactly two variables:
- `USER_EMAIL`
- `USER_PASSWORD`

**HARD RULES — no exceptions:**
1. ONLY `USER_EMAIL` and `USER_PASSWORD` may be used
2. NEVER use any other credential variables from `.env`
   or any other source (no ADMIN_*, no API_KEY, no
   SERVICE_TOKEN, no other email/password pairs)
3. NEVER guess, construct, or infer credentials
4. If `USER_EMAIL` or `USER_PASSWORD` is missing or
   empty, run ONLY unauthenticated probes (health
   check) and list skipped authenticated probes
5. Do NOT fall back to any alternative credentials

## Process

### Step 1: Health Check (no auth)

`GET {base_url}/health`
Expected: 200, body contains `"status": "healthy"`

If fails, stop:
`PRODUCTION_FAIL: Health endpoint returned <status>`

### Step 2: Login (if credentials available)

```
POST {base_url}/login
Content-Type: application/x-www-form-urlencoded
Body: username={USER_EMAIL}&password={USER_PASSWORD}
```
Expected: 200, body contains `access_token`
Store token. If login fails, report and continue with
unauthenticated-only checks.

### Step 3: Determine Endpoints to Probe

Build probe list from changed backend API surface:
1. Parse PR/issue reference from context (`#N`,
   `PR_CREATED`, `ISSUE_CREATED`) and fetch with `gh`
   when available.
2. Inspect changed files (`gh pr view --json files` or
   `git diff`) for route declarations
   (`@router.get`, `@app.get`) and extract paths.
3. Keep only GET-safe endpoints for production checks.
4. If no changed GET endpoints can be inferred, use a
   safe fallback set:
   - `GET /health`
   - One list endpoint discovered from `/docs` or
     `/openapi.json` (if available)
   - One auth-protected endpoint (if token available)
5. Validate endpoint existence against `/docs` or
   `/openapi.json` when uncertain.

### Step 4: Execute Probes

For each endpoint:
- Request method: GET only
- Use bearer token for protected endpoints
- Timeout per request: 10 seconds
- Record path, HTTP status, latency, PASS/FAIL/SKIP

### Step 5: Report Results

Provide per-endpoint result lines, then final marker.

## Rules

- **GET only** for probes (login POST is sole exception)
- Never create, modify, or delete data
- **Credentials**: ONLY `USER_EMAIL` + `USER_PASSWORD`
  from `.env`. No other credentials, ever. If either is
  missing, skip all authenticated probes entirely.
- Timeout per request: 10 seconds
- 401/403 without credentials: "skipped (no auth)"
- 401/403 WITH valid credentials: failure

## Output (STRICT)

Output per-endpoint details, then final marker line:
```
PRODUCTION_OK: N/N endpoints healthy
```
OR
```
PRODUCTION_FAIL: <summary of failures>
```

Example:
```
/health       200  45ms  PASS
/profiles/me  200  89ms  PASS
/companies    200  67ms  PASS
PRODUCTION_OK: 3/3 endpoints healthy
```

<CONTEXT>
$ARGUMENTS
</CONTEXT>
