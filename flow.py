#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "claude-agent-sdk",
#     "typer",
#     "questionary",
# ]
# ///
"""
Claude Code Workflow Manager v3 - Interactive Menu & Modular CLI

This version focuses on:
- Interactive menu system when run without arguments
- Organized commands by category (Code, Research, Document)
- Correct slash command prompting ("/command args", no "Run ")
- Clear orchestration that relays outputs between steps
- Reduced duplication via shared executor and workflow helpers
- Compact progress output while streaming
"""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Callable, Optional

import json
import subprocess
import sys

import questionary
import typer
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ThinkingBlock,
    ToolUseBlock,
)

# ANSI colors
GREEN = "\033[0;32m"
BLUE = "\033[0;34m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
NC = "\033[0m"

WORKFLOW_TIMEOUT_SECONDS = 7200  # 2 hours

app = typer.Typer(help="Claude Code Workflow Manager v3")


# -----------------------------
# Commands (single source of truth)
# -----------------------------

class Commands:
    # Research commands
    CREATE_TASK = "/research:create-task"
    SEARCH_INTERNAL = "/research:search-internal"
    SEARCH_WEB = "/research:search-web"
    UPDATE_REPORT = "/research:update-report"
    ARCHIVE_TASK = "/research:archive-task"
    ANALYZE_REPORT_GAPS = "/research:analyze-report-gaps"
    MAINTAIN_REPORT = "/research:maintain-report"
    VALIDATE_METADATA = "/research:validate-metadata"
    IMPORT_DOCUMENT = "/research:import-document"
    MIGRATE_V2 = "/research:migrate-v2"
    INDEX_BUILD = "/research:index-build"
    INDEX_QUERY = "/research:index-query"
    CREATE_ANALYSIS = "/analysis:create"
    # Software development commands
    ANALYSE_ISSUE = "/sw:analyse-issue"
    CODER_SIMPLE = "/sw:coder-simple"
    CONTINUE_IMPLEMENTATION = "/sw:continue-implementation"
    CREATE_ISSUE = "/sw:create-issue"
    IMPLEMENT_ISSUE = "/sw:implement-issue"
    DEPLOY_CHECK = "/sw:deploy-check"
    PRODUCTION_CHECK = "/sw:production-check"
    PR_CHECK = "/sw:pull-request-check"
    PR_MERGE = "/sw:pull-request-merge"
    PR_REVIEW = "/sw:pull-request-review"
    # Utility commands
    CONVERT_PDF = "/utils:convert-pdf"
    UPDATE_FLOW = "/utils:update-flow"
    # Write commands
    CREATE_FINAL_REPORT = "/write:create-final-report"
    UPDATE_FINAL_REPORT = "/write:update-final-report"
    CREATE_PPTX_PRESENTATION = "/write:create-pptx-presentation"
    CREATE_DOCX_REPORT = "/write:create-docx-report"
    CREATE_XLSX_REPORT = "/write:create-xlsx-report"


# -----------------------------
# Printing helpers
# -----------------------------

def print_header(step: int, title: str, details: str = ""):
    print(f"\n=== Step {step}: {title} ===")
    if details:
        print(f"Description: {details}")
    print()


def print_progress(message: str, color: str = NC):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{ts}] {message}{NC}")


def check_merge_failed(text: str) -> tuple[bool, str]:
    if "MERGE_FAILED:" in text:
        m = re.search(r"MERGE_FAILED:\s*(.+?)(?:\n|$)", text)
        return True, (m.group(1) if m else "Unknown reason")
    return False, ""


def check_blocked(text: str) -> tuple[bool, str]:
    if "IMPLEMENTATION_BLOCKED:" in text:
        m = re.search(r"IMPLEMENTATION_BLOCKED:\s*(.+?)(?:\n|$)", text)
        return True, (m.group(1) if m else "Unknown reason")
    return False, ""


def check_deploy_failed(text: str) -> tuple[bool, str]:
    if "DEPLOY_FAILED:" in text:
        m = re.search(
            r"DEPLOY_FAILED:\s*(.+?)(?:\n|$)", text
        )
        return True, (m.group(1) if m else "Unknown reason")
    return False, ""


def check_deploy_live(text: str) -> tuple[bool, str]:
    if "DEPLOY_LIVE:" in text:
        m = re.search(
            r"DEPLOY_LIVE:\s*(.+?)(?:\n|$)", text
        )
        return True, (m.group(1) if m else "")
    return False, ""


def check_production_failed(text: str) -> tuple[bool, str]:
    if "PRODUCTION_FAIL:" in text:
        m = re.search(
            r"PRODUCTION_FAIL:\s*(.+?)(?:\n|$)", text
        )
        return True, (m.group(1) if m else "Unknown reason")
    return False, ""


def check_production_ok(text: str) -> tuple[bool, str]:
    if "PRODUCTION_OK:" in text:
        m = re.search(
            r"PRODUCTION_OK:\s*(.+?)(?:\n|$)", text
        )
        return True, (m.group(1) if m else "")
    return False, ""


# -----------------------------
# Parsing helpers
# -----------------------------

ISSUE_PATTERNS = [
    r"ISSUE_CREATED:\s*#(\d+)",
    r"issue\s*#(\d+)",
    r"#(\d+)",
]

PR_PATTERNS = [
    r"PR_CREATED:\s*#(\d+)",
    r"pull\s*request\s*#(\d+)",
    r"pr\s*#(\d+)",
    r"#(\d+)",
]


def extract_first(patterns: list[str], text: str) -> Optional[str]:
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return f"#{m.group(1)}"
    return None


def extract_issue_ref(text: str) -> Optional[str]:
    return extract_first(ISSUE_PATTERNS, text)


def extract_pr_ref(text: str) -> Optional[str]:
    return extract_first(PR_PATTERNS, text)


def extract_filename(text: str, marker: str) -> Optional[str]:
    """Extract filename from structured output marker like
    'MARKER: filename'"""
    pattern = f"{marker}:\\s+(.+?)(?:\\n|$)"
    m = re.search(pattern, text)
    return m.group(1).strip() if m else None


# -----------------------------
# Execution core
# -----------------------------

@dataclass
class ExecResult:
    text: str
    total_cost_usd: float = 0.0
    session_id: Optional[str] = None
    slash_commands: list[str] = field(default_factory=list)


def default_options() -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        cwd=str(Path.cwd()),
        setting_sources=["project"],
        permission_mode="bypassPermissions",
        model="claude-opus-4-6",
        max_buffer_size=10 * 1024 * 1024,  # 10MB
    )


async def execute_prompt(
    prompt: str,
    *,
    verbose_label: str = "",
) -> ExecResult:
    print_progress(f"Sending: {prompt}", BLUE)

    all_text: list[str] = []
    total_cost = 0.0
    session_id: Optional[str] = None
    slash_commands: list[str] = []
    needs_newline = False

    opts = default_options()
    async with ClaudeSDKClient(options=opts) as client:
        await client.query(prompt)

        async for message in client.receive_response():
            if isinstance(message, SystemMessage) and getattr(
                message, "subtype", ""
            ) == "init":
                session_id = getattr(message, "session_id", None)
                slash_commands = (
                    getattr(message, "slash_commands", []) or []
                )

            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        if needs_newline:
                            print()
                            needs_newline = False
                        all_text.append(block.text)
                        print_progress(block.text, GREEN)
                    elif isinstance(
                        block, (ToolUseBlock, ThinkingBlock)
                    ):
                        print(".", end="", flush=True)
                        needs_newline = True

            elif isinstance(message, ResultMessage):
                if needs_newline:
                    print()
                    needs_newline = False
                if hasattr(message, "usage"):
                    total_cost = (
                        getattr(message.usage, "total_cost_usd", 0.0)
                        or 0.0
                    )
                print_progress(
                    f"Completed ({total_cost:.4f} USD)", GREEN
                )

    return ExecResult(
        text="\n".join(all_text),
        total_cost_usd=total_cost,
        session_id=session_id,
        slash_commands=slash_commands,
    )


async def execute_slash(
    command: str,
    args: str = "",
    label: str = "",
) -> ExecResult:
    # must start with "/"
    prompt = command if not args else f"{command} {args}"
    return await execute_prompt(prompt, verbose_label=label or command)


# -----------------------------
# Orchestration state
# -----------------------------

@dataclass
class FlowState:
    description: str = ""
    issue_ref: Optional[str] = None
    pr_ref: Optional[str] = None
    last_output: str = ""

    def update_from_output(self, text: str):
        self.last_output = text
        if not self.issue_ref:
            self.issue_ref = extract_issue_ref(text) or self.issue_ref
        if not self.pr_ref:
            self.pr_ref = extract_pr_ref(text) or self.pr_ref

    def summary(self) -> str:
        return f"issue={self.issue_ref or '-'}, pr={self.pr_ref or '-'}"


# -----------------------------
# Polling helpers
# -----------------------------

async def wait_for_pr_ready(
    pr_hint: str,
    *,
    max_duration: int = 1800,
    initial_wait: int = 600,
    check_interval: int = 300,
) -> bool:
    print_header(0, "Waiting for GitHub PR to be Ready")
    print_progress(f"Initial wait: {initial_wait // 60} minutes", YELLOW)
    await asyncio.sleep(initial_wait)
    elapsed = initial_wait
    print_progress(f"{elapsed // 60} minutes elapsed", GREEN)

    while elapsed < max_duration:
        print_progress("Checking PR status...", BLUE)
        res = await execute_slash(
            Commands.PR_CHECK,
            pr_hint,
            label="PR Check",
        )

        status = None
        tl = res.text.lower()
        if "ready" in tl and "in progress" not in tl:
            status = "ready"
        elif "in progress" in tl and "ready" not in tl:
            status = "in progress"

        if status == "ready":
            print_progress("PR is ready for review", GREEN)
            return True

        remaining = max_duration - elapsed
        if remaining <= 0:
            print_progress("Max wait time reached, timeout", YELLOW)
            return False
        wait_time = min(check_interval, remaining)
        print_progress(
            f"PR in progress, waiting {wait_time // 60} more minutes...",
            YELLOW,
        )
        await asyncio.sleep(wait_time)
        elapsed += wait_time
        print_progress(
            f"{elapsed // 60}/{max_duration // 60} minutes elapsed...",
            BLUE,
        )

    return False


async def wait_for_pr_mergeable(
    pr_hint: str,
    *,
    max_duration: int = 900,
    initial_wait: int = 300,
    check_interval: int = 180,
) -> bool:
    """Wait for PR to be approved and mergeable after review"""
    print_header(0, "Waiting for PR Approvals and Final Checks")
    print_progress(f"Initial wait: {initial_wait // 60} minutes", YELLOW)
    await asyncio.sleep(initial_wait)
    elapsed = initial_wait
    print_progress(f"{elapsed // 60} minutes elapsed", GREEN)

    while elapsed < max_duration:
        print_progress("Checking PR merge readiness...", BLUE)
        res = await execute_slash(
            Commands.PR_CHECK,
            pr_hint,
            label="PR Check",
        )

        status = None
        tl = res.text.lower()
        if "mergeable" in tl or "approved" in tl:
            status = "approved"
        elif "changes requested" in tl or "not approved" in tl:
            status = "pending"

        if status == "approved":
            print_progress("PR is approved and ready to merge", GREEN)
            return True

        remaining = max_duration - elapsed
        if remaining <= 0:
            print_progress("Max wait time reached, timeout", YELLOW)
            return False
        wait_time = min(check_interval, remaining)
        print_progress(
            f"Waiting for approvals, {wait_time // 60} more minutes...",
            YELLOW,
        )
        await asyncio.sleep(wait_time)
        elapsed += wait_time
        print_progress(
            f"{elapsed // 60}/{max_duration // 60} minutes elapsed...",
            BLUE,
        )

    return False


# -----------------------------
# Workflow timeout decorator
# -----------------------------


def with_workflow_timeout(fn):
    """Wrap a workflow coroutine with a global timeout.

    Uses asyncio.wait_for for Python 3.10 compatibility.
    """
    @wraps(fn)
    async def wrapper(*args, **kwargs):
        start = time.monotonic()
        try:
            return await asyncio.wait_for(
                fn(*args, **kwargs),
                timeout=WORKFLOW_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            elapsed = time.monotonic() - start
            hours = elapsed / 3600
            print_progress(
                "Workflow timed out after"
                f" {hours:.1f} hours",
                RED,
            )
            return 1
    return wrapper


# -----------------------------
# Workflow building blocks
# -----------------------------


def get_issue_title(num: int) -> str:
    """Fetch title for a GitHub issue number."""
    result = subprocess.run(
        ["gh", "issue", "view", str(num),
         "--json", "title", "-q", ".title"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


async def _analyse_qa_loop(
    st: FlowState, start_step: int = 1,
) -> int:
    """Analyse issue: initial, PM Q&A, finalize."""
    step = start_step

    print_header(step, "Initial Analysis")
    r = await execute_slash(
        Commands.ANALYSE_ISSUE, st.issue_ref
    )
    st.update_from_output(r.text)
    step += 1

    for round_num in range(3):
        feedback = await questionary.text(
            "Feedback/answers (blank to finalize):"
        ).ask_async()
        if not feedback or not feedback.strip():
            break
        print_header(
            step,
            f"PM Feedback Round {round_num + 1}",
        )
        r = await execute_slash(
            Commands.ANALYSE_ISSUE,
            f"{st.issue_ref}"
            f" [PM feedback: {feedback}]",
        )
        st.update_from_output(r.text)
        step += 1

    print_header(step, "Finalizing Analysis")
    r_final = await execute_slash(
        Commands.ANALYSE_ISSUE,
        f"{st.issue_ref} [finalize]",
    )
    st.update_from_output(r_final.text)
    return 0


async def _wf1_create(st: FlowState) -> int:
    """WF1: create, analyse, PM loop, finalize."""
    print_header(1, "Creating Issue", st.description)
    r1 = await execute_slash(
        Commands.CREATE_ISSUE, st.description
    )
    st.update_from_output(r1.text)
    print_progress(f"State: {st.summary()}", BLUE)
    if not st.issue_ref:
        print_progress(
            "Could not extract issue ref", RED
        )
        return 1

    return await _analyse_qa_loop(st, start_step=2)


async def _wf2_implement(st: FlowState) -> int:
    """WF2: implement-issue, wait, pr-review."""
    print_header(
        1, f"Implementing Issue {st.issue_ref}"
    )
    r1 = await execute_slash(
        Commands.IMPLEMENT_ISSUE, st.issue_ref
    )
    blocked, reason = check_blocked(r1.text)
    if blocked:
        print_progress(
            f"Implementation blocked: {reason}", RED
        )
        return 1
    st.update_from_output(r1.text)

    ready = await wait_for_pr_ready(
        st.pr_ref or r1.text
    )
    if not ready:
        print_progress(
            "PR may not be ready, continuing anyway",
            YELLOW,
        )

    print_header(2, "Reviewing PR")
    r2 = await execute_slash(
        Commands.PR_REVIEW,
        st.pr_ref or r1.text,
    )
    st.update_from_output(r2.text)
    return 0


async def _wf3_deploy(st: FlowState) -> int:
    """WF3 tail: merge, wait, deploy, prod check."""
    mergeable = await wait_for_pr_mergeable(
        st.pr_ref or st.last_output
    )
    if not mergeable:
        print_progress(
            "PR may not have approvals, "
            "continuing anyway",
            YELLOW,
        )

    print_header(3, "Merging PR")
    r3 = await execute_slash(
        Commands.PR_MERGE,
        st.pr_ref or st.last_output,
    )
    failed, reason = check_merge_failed(r3.text)
    if failed:
        print_progress(
            f"Merge failed: {reason}", RED
        )
        return 1

    print_progress(
        "Waiting 5 min for deploy to start...",
        YELLOW,
    )
    await asyncio.sleep(300)

    print_header(4, "Checking Deploy Status")
    r4 = await execute_slash(
        Commands.DEPLOY_CHECK, ""
    )
    dfailed, dreason = check_deploy_failed(r4.text)
    if dfailed:
        print_progress(
            f"Deploy failed: {dreason}", RED
        )
        return 1
    dlive, live_service = check_deploy_live(r4.text)
    if not dlive:
        print_progress(
            "Deploy check did not return DEPLOY_LIVE marker",
            RED,
        )
        return 1
    print_progress(
        f"Deploy live: {live_service or 'service'}",
        GREEN,
    )

    print_header(5, "Production Endpoint Check")
    r5 = await execute_slash(
        Commands.PRODUCTION_CHECK,
        st.issue_ref or "",
    )
    pfailed, preason = check_production_failed(
        r5.text
    )
    if pfailed:
        print_progress(
            f"Production check failed: {preason}",
            RED,
        )
        return 1
    pok, psummary = check_production_ok(r5.text)
    if not pok:
        print_progress(
            "Production check did not return PRODUCTION_OK marker",
            RED,
        )
        return 1
    print_progress(
        f"Production verified: {psummary or 'OK'}",
        GREEN,
    )
    return 0


# -----------------------------
# Workflows
# -----------------------------


@with_workflow_timeout
async def wf_issue_create(description: str) -> int:
    """WF1: Interactive issue creation with PM."""
    st = FlowState(description=description)
    try:
        rc = await _wf1_create(st)
        if rc != 0:
            return rc
        print_progress("Issue Ready", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_analyse_issue(issue_num: int) -> int:
    """Analyse existing issue with PM Q&A."""
    if issue_num <= 0:
        print_progress("Invalid issue number", RED)
        return 1
    st = FlowState(
        description=f"Issue {issue_num}",
        issue_ref=f"#{issue_num}",
    )
    try:
        rc = await _analyse_qa_loop(st)
        if rc != 0:
            return rc
        print_progress("Analysis Complete", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_implement(issue_num: int) -> int:
    """WF2: Implement issue to merge-ready PR."""
    st = FlowState(
        description=f"Issue {issue_num}",
        issue_ref=f"#{issue_num}",
    )
    try:
        rc = await _wf2_implement(st)
        if rc != 0:
            return rc
        print_progress("PR Ready for Merge", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_implement_deploy(
    issue_num: int,
) -> int:
    """WF3: Implement issue through deploy."""
    st = FlowState(
        description=f"Issue {issue_num}",
        issue_ref=f"#{issue_num}",
    )
    try:
        rc = await _wf2_implement(st)
        if rc != 0:
            return rc
        rc = await _wf3_deploy(st)
        if rc != 0:
            return rc
        print_progress("Deploy Verified", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_create_implement(
    description: str,
) -> int:
    """WF1 + WF2: Create issue then implement."""
    st = FlowState(description=description)
    try:
        rc = await _wf1_create(st)
        if rc != 0:
            return rc
        if not st.issue_ref:
            print_progress(
                "Could not extract issue ref", RED
            )
            return 1
        st.pr_ref = None
        rc = await _wf2_implement(st)
        if rc != 0:
            return rc
        print_progress("PR Ready for Merge", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_full(description: str) -> int:
    """WF1 + WF3: Create issue through deploy."""
    st = FlowState(description=description)
    try:
        rc = await _wf1_create(st)
        if rc != 0:
            return rc
        if not st.issue_ref:
            print_progress(
                "Could not extract issue ref", RED
            )
            return 1
        st.pr_ref = None
        rc = await _wf2_implement(st)
        if rc != 0:
            return rc
        rc = await _wf3_deploy(st)
        if rc != 0:
            return rc
        print_progress(
            "Full Workflow Complete", GREEN
        )
        return 0
    except KeyboardInterrupt:
        print_progress(
            "Workflow interrupted by user", YELLOW
        )
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


async def wf_loop(
    issue_nums: list[int],
    deploy: bool = False,
) -> int:
    """Loop: process explicit issues sequentially."""
    try:
        if not issue_nums:
            print_progress(
                "No issue numbers provided",
                YELLOW,
            )
            return 1

        total = len(issue_nums)
        print_progress(
            f"Processing {total} issue(s): "
            + ", ".join(f"#{n}" for n in issue_nums),
            BLUE,
        )
        results: list[tuple[int, str, int]] = []

        for i, num in enumerate(issue_nums, 1):
            title = get_issue_title(num)
            print_progress(
                f"\n--- [{i}/{total}] Issue "
                f"#{num}: {title} ---",
                BLUE,
            )
            try:
                if deploy:
                    rc = await wf_implement_deploy(
                        num
                    )
                else:
                    rc = await wf_implement(num)
            except Exception as e:
                print_progress(
                    f"Issue #{num} failed: {e}",
                    RED,
                )
                rc = 1
            results.append((num, title, rc))

        print_progress(
            "\n=== Loop Summary ===", BLUE
        )
        ok = sum(
            1 for _, _, rc in results if rc == 0
        )
        fail = len(results) - ok
        for num, title, rc in results:
            status = "OK" if rc == 0 else "FAIL"
            color = GREEN if rc == 0 else RED
            print(
                f"  {color}#{num} {title}:"
                f" {status}{NC}"
            )
        print_progress(
            f"{ok} succeeded, {fail} failed"
            f" out of {len(results)}",
            GREEN if fail == 0 else YELLOW,
        )
        return 0 if fail == 0 else 1
    except KeyboardInterrupt:
        print_progress("Loop interrupted", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_task_to_report(task_file: str) -> int:
    """Complete task with report update: research -> report -> archive"""
    try:
        print_header(1, "Internal Search - Existing Knowledge", task_file)
        r1 = await execute_slash(Commands.SEARCH_INTERNAL, task_file)
        internal_file = extract_filename(r1.text, "INTERNAL_SUMMARY")

        print_header(2, "Web Search - Filling Gaps", task_file)
        context = (f"{task_file} [internal: {internal_file}]"
                   if internal_file else task_file)
        r2 = await execute_slash(Commands.SEARCH_WEB, context)
        ref_file = extract_filename(r2.text, "RESEARCH_COMPLETE")

        print_header(3, "Updating Customer Report")
        # UPDATE_REPORT now handles distillation internally
        r3 = await execute_slash(Commands.UPDATE_REPORT, ref_file)
        chapter_file = extract_filename(r3.text, "REPORT_UPDATED")

        print_header(4, "Maintaining Report Structure")
        r4 = await execute_slash(Commands.MAINTAIN_REPORT, "")

        print_header(5, "Archiving Completed Task")
        r5 = await execute_slash(Commands.ARCHIVE_TASK, task_file)

        print_progress(f"Report updated: {chapter_file}", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress("Workflow interrupted", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_report_gap_analysis() -> int:
    """Analyze report completeness vs goals and tasks"""
    try:
        print_header(1, "Analyzing Report Gaps")
        r1 = await execute_slash(Commands.ANALYZE_REPORT_GAPS, "")

        print_progress("Gap Analysis Complete", GREEN)
        print_progress("Review: results/report-gap-analysis-*.md", BLUE)
        return 0
    except KeyboardInterrupt:
        print_progress("Analysis interrupted by user", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_accumulate_knowledge(description: str) -> int:
    """Research and document WITHOUT updating customer report

    Purpose: Build internal knowledge base
    Result: references/ grows, reports/ unchanged
    """
    try:
        print_header(1, "Internal Search - Existing Knowledge",
                     description)
        r1 = await execute_slash(Commands.SEARCH_INTERNAL, description)
        internal_file = extract_filename(r1.text, "INTERNAL_SUMMARY")

        print_header(2, "Web Search - Filling Knowledge Gaps")
        # Pass internal summary context to web search
        context = (f"{description} [internal: {internal_file}]"
                   if internal_file else description)
        r2 = await execute_slash(Commands.SEARCH_WEB, context)
        ref_file = extract_filename(r2.text, "RESEARCH_COMPLETE")

        print_progress(f"Knowledge documented: {ref_file}", GREEN)
        print_progress("Available for future searches", BLUE)
        return 0
    except KeyboardInterrupt:
        print_progress("Workflow interrupted", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_knowledge_from_task(task_file: str) -> int:
    """Complete task into knowledge base (no report update)"""
    try:
        print_header(1, "Internal Search", task_file)
        r1 = await execute_slash(Commands.SEARCH_INTERNAL, task_file)
        internal_file = extract_filename(r1.text, "INTERNAL_SUMMARY")

        print_header(2, "Web Search", task_file)
        context = (f"{task_file} [internal: {internal_file}]"
                   if internal_file else task_file)
        r2 = await execute_slash(Commands.SEARCH_WEB, context)
        ref_file = extract_filename(r2.text, "RESEARCH_COMPLETE")

        print_header(3, "Archiving Task")
        r3 = await execute_slash(Commands.ARCHIVE_TASK, task_file)

        print_progress("Knowledge accumulated, task archived", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress("Workflow interrupted", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@with_workflow_timeout
async def wf_full_to_report(description: str) -> int:
    """Full: description -> task -> research -> report -> archive"""
    try:
        print_header(1, "Creating Research Task", description)
        r1 = await execute_slash(Commands.CREATE_TASK, description)
        task_file = extract_filename(r1.text, "TASK_CREATED")

        print_header(2, "Internal Search - Existing Knowledge")
        r2 = await execute_slash(Commands.SEARCH_INTERNAL,
                                  task_file or description)
        internal_file = extract_filename(r2.text, "INTERNAL_SUMMARY")

        print_header(3, "Web Search - Filling Gaps")
        context = (f"{task_file or description} [internal: {internal_file}]"
                   if internal_file else task_file or description)
        r3 = await execute_slash(Commands.SEARCH_WEB, context)
        ref_file = extract_filename(r3.text, "RESEARCH_COMPLETE")

        print_header(4, "Updating Customer Report")
        # UPDATE_REPORT now handles distillation internally
        r4 = await execute_slash(Commands.UPDATE_REPORT, ref_file)
        chapter_file = extract_filename(r4.text, "REPORT_UPDATED")

        print_header(5, "Maintaining Report Structure")
        r5 = await execute_slash(Commands.MAINTAIN_REPORT, "")

        if task_file:
            print_header(6, "Archiving Completed Task")
            r6 = await execute_slash(Commands.ARCHIVE_TASK, task_file)

        print_progress(f"Report updated: {chapter_file}", GREEN)
        return 0
    except KeyboardInterrupt:
        print_progress("Workflow interrupted", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


# -----------------------------
# CLI commands
# -----------------------------


def ensure_git_repo():
    if not (Path.cwd() / ".git").exists():
        print(f"{RED}Error: Not in a git repository{NC}")
        raise typer.Exit(1)


async def run_simple(command: str, arg: str, label: str) -> int:
    try:
        print_header(0, label, arg)
        res = await execute_slash(command, arg, label=label)
        failed, reason = (False, "")
        if command == Commands.PR_MERGE:
            failed, reason = check_merge_failed(res.text)
        if failed:
            print_progress(f"Merge failed: {reason}", RED)
            return 1
        return 0
    except KeyboardInterrupt:
        print_progress("Interrupted by user", YELLOW)
        return 130
    except Exception as e:
        print_progress(f"Error: {e}", RED)
        return 1


@app.command()
def issue_create(
    description: str = typer.Argument(
        "", help="Feature description"
    ),
):
    """WF1: Create and analyze issue interactively"""
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter feature description"
        ).strip()
    raise typer.Exit(
        asyncio.run(wf_issue_create(description))
    )


@app.command()
def implement(
    issue_num: int = typer.Argument(
        0, help="Issue number"
    ),
):
    """WF2: Implement issue to merge-ready PR"""
    ensure_git_repo()
    if issue_num <= 0:
        issue_num = typer.prompt(
            "Enter issue number", type=int
        )
    raise typer.Exit(
        asyncio.run(wf_implement(issue_num))
    )


@app.command()
def implement_deploy(
    issue_num: int = typer.Argument(
        0, help="Issue number"
    ),
):
    """WF3: Implement issue through deploy"""
    ensure_git_repo()
    if issue_num <= 0:
        issue_num = typer.prompt(
            "Enter issue number", type=int
        )
    raise typer.Exit(
        asyncio.run(wf_implement_deploy(issue_num))
    )


@app.command()
def create_implement(
    description: str = typer.Argument(
        "", help="Feature description"
    ),
):
    """WF1+WF2: Create issue then implement to PR"""
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter feature description"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            wf_create_implement(description)
        )
    )


@app.command()
def full(
    description: str = typer.Argument(
        "", help="Feature description"
    ),
):
    """WF1+WF3: Create issue through deploy"""
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter feature description"
        ).strip()
    raise typer.Exit(
        asyncio.run(wf_full(description))
    )


@app.command()
def loop(
    issues: list[int] = typer.Argument(
        ..., help="Issue numbers to process"
    ),
    deploy: bool = typer.Option(
        False, help="Include deploy after merge"
    ),
):
    """Process multiple issues sequentially"""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            wf_loop(issues, deploy=deploy)
        )
    )


@app.command()
def create_issue(
    description: str = typer.Argument(
        "",
        help="Feature description",
    )
):
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter feature description"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_ISSUE,
                description,
                "Create Issue",
            )
        )
    )


@app.command()
def analyse_issue(
    issue: str = typer.Argument(
        "",
        help="Issue number or mode command",
    )
):
    """Analyse issue with interactive PM Q&A"""
    ensure_git_repo()
    if not issue.strip():
        issue = typer.prompt(
            "Enter issue number"
        ).strip()
    if "[" in issue:
        if not re.search(r"\d+", issue):
            print(f"{RED}Missing issue number{NC}")
            raise typer.Exit(1)
        raise typer.Exit(
            asyncio.run(
                run_simple(
                    Commands.ANALYSE_ISSUE,
                    issue,
                    "Analyze Issue",
                )
            )
        )
    num = re.search(r"(\d+)", issue)
    if not num:
        print(f"{RED}Invalid issue number{NC}")
        raise typer.Exit(1)
    raise typer.Exit(
        asyncio.run(
            wf_analyse_issue(int(num.group(1)))
        )
    )


@app.command()
def implement_issue(
    issue: str = typer.Argument(
        "",
        help="Issue number or output",
    )
):
    ensure_git_repo()
    if not issue.strip():
        issue = typer.prompt(
            "Enter issue number or output"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.IMPLEMENT_ISSUE,
                issue,
                "Implement Issue",
            )
        )
    )


@app.command()
def pr_check(
    pr_number: str = typer.Argument(
        "",
        help="PR number or empty",
    )
):
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.PR_CHECK,
                pr_number,
                "Check PR",
            )
        )
    )


@app.command()
def pr_review(
    guidance: str = typer.Argument(
        "",
        help="PR number or guidance",
    )
):
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.PR_REVIEW,
                guidance,
                "Review PR",
            )
        )
    )


@app.command()
def pr_merge(
    pr_number: str = typer.Argument(
        "",
        help="PR number or empty",
    )
):
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.PR_MERGE,
                pr_number,
                "Merge PR",
            )
        )
    )


@app.command()
def deploy_check(
    service: str = typer.Argument(
        "",
        help="Service name, service ID, or empty for .env/default",
    )
):
    """Check latest Render deploy status"""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.DEPLOY_CHECK,
                service,
                "Deploy Check",
            )
        )
    )


@app.command()
def production_check(
    context: str = typer.Argument(
        "",
        help="Issue/PR ref or context for endpoint probing",
    )
):
    """Run read-only production endpoint probes"""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.PRODUCTION_CHECK,
                context,
                "Production Check",
            )
        )
    )


@app.command()
def coder_simple(
    description: str = typer.Argument(
        "",
        help="Feature description",
    )
):
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter feature description"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CODER_SIMPLE,
                description,
                "Coder Simple",
            )
        )
    )


@app.command()
def knowledge_from_task(
    task_file: str = typer.Argument("", help="Task file to complete")
):
    """Complete task into knowledge base (no report update)"""
    ensure_git_repo()
    if not task_file.strip():
        task_file = typer.prompt("Enter task filename").strip()
    raise typer.Exit(asyncio.run(wf_knowledge_from_task(task_file)))


@app.command()
def continue_implementation(
    issue: str = typer.Argument(
        "",
        help="Issue number",
    )
):
    ensure_git_repo()
    if not issue.strip():
        issue = typer.prompt(
            "Enter issue number"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CONTINUE_IMPLEMENTATION,
                issue,
                "Continue Implementation",
            )
        )
    )


@app.command()
def convert_pdf(
    filename: str = typer.Argument(
        "",
        help="PDF filename (optional)",
    )
):
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CONVERT_PDF,
                filename,
                "Convert PDF",
            )
        )
    )


@app.command()
def update_flow():
    """Update flow_ai files from upstream repository"""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.UPDATE_FLOW,
                "",
                "Update Flow AI",
            )
        )
    )


@app.command()
def create_final_report(
    input_str: str = typer.Argument(
        "",
        help="Folder path and optional guidance",
    )
):
    """Create final distilled report from directory of reports"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter 'folder_path [guidance]'"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_FINAL_REPORT,
                input_str,
                "Create Final Report",
            )
        )
    )


@app.command()
def update_final_report(
    input_str: str = typer.Argument(
        "",
        help="Final report path and new files",
    )
):
    """Update existing final report with new content"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter 'final_report_path new_files'"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.UPDATE_FINAL_REPORT,
                input_str,
                "Update Final Report",
            )
        )
    )


@app.command()
def create_pptx_presentation(
    input_str: str = typer.Argument(
        "",
        help="Report file path, output folder, and guidance",
    )
):
    """Create PowerPoint presentation from report file"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter 'report_path output_folder [guidance]'"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_PPTX_PRESENTATION,
                input_str,
                "Create PowerPoint Presentation",
            )
        )
    )


@app.command()
def create_docx_report(
    input_str: str = typer.Argument(
        "",
        help="Report file path, output folder, and guidance",
    )
):
    """Create Word document from report file"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter 'report_path output_folder [guidance]'"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_DOCX_REPORT,
                input_str,
                "Create Word Document",
            )
        )
    )


@app.command()
def create_xlsx_report(
    input_str: str = typer.Argument(
        "",
        help="Report file path, output folder, and guidance",
    )
):
    """Create Excel spreadsheet from report file"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter 'report_path output_folder [guidance]'"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_XLSX_REPORT,
                input_str,
                "Create Excel Spreadsheet",
            )
        )
    )


@app.command()
def create_task(
    description: str = typer.Argument(
        "",
        help="Task description",
    )
):
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt(
            "Enter task description"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_TASK,
                description,
                "Create Task",
            )
        )
    )


@app.command()
def search_web(topic: str = typer.Argument("",
                                           help="Topic or task file")):
    """Execute parallel web research and save raw findings"""
    ensure_git_repo()
    if not topic.strip():
        topic = typer.prompt("Enter topic or task filename").strip()
    raise typer.Exit(
        asyncio.run(run_simple(Commands.SEARCH_WEB, topic, "Web Search"))
    )


@app.command()
def search_internal(query: str = typer.Argument("",
                                                 help="Query or task file")):
    """Search internal knowledge base and save raw findings"""
    ensure_git_repo()
    if not query.strip():
        query = typer.prompt("Enter query or task filename").strip()
    raise typer.Exit(
        asyncio.run(run_simple(Commands.SEARCH_INTERNAL, query,
                                "Internal Search"))
    )


@app.command()
def validate_metadata(
    folder: str = typer.Argument(
        "references", help="Folder to validate (references or analysis)"
    )
) -> None:
    """Validate YAML metadata in the chosen folder."""
    ensure_git_repo()
    target = folder.strip() or "references"
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.VALIDATE_METADATA, target, "Validate Metadata"
            )
        )
    )


@app.command()
def import_document(
    path: str = typer.Argument("*", help="File path or glob pattern"),
    max_files: int = typer.Option(
        5, "--max", help="Maximum files per batch"
    ),
    toc: bool = typer.Option(
        False, "--toc/--no-toc", help="Insert Table of Contents"
    ),
) -> None:
    """Import raw files into references with YAML metadata."""
    ensure_git_repo()
    args = f"{path.strip()} --max {max_files}"
    if toc:
        args = f"{args} --toc"
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.IMPORT_DOCUMENT, args, "Import Document"
            )
        )
    )


@app.command()
def migrate_v2() -> None:
    """Reorganise legacy assets into the v2 directory layout."""
    ensure_git_repo()
    if not typer.confirm(
        "This will reorganise the project. Continue?",
        default=False,
    ):
        raise typer.Exit(0)
    raise typer.Exit(
        asyncio.run(
            run_simple(Commands.MIGRATE_V2, "", "Migrate to v2")
        )
    )


@app.command()
def index_build() -> None:
    """Build the deterministic metadata-backed search index."""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(run_simple(Commands.INDEX_BUILD, "", "Build Index"))
    )


@app.command()
def index_query(
    query: str = typer.Argument("", help="Search terms")
) -> None:
    """Query the deterministic metadata index."""
    ensure_git_repo()
    search = query.strip()
    if not search:
        search = typer.prompt("Enter search query").strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(Commands.INDEX_QUERY, search, "Query Index")
        )
    )


@app.command()
def create_analysis(
    topic: str = typer.Argument("", help="Analysis topic"),
    toc: bool = typer.Option(
        False,
        "--toc/--no-toc",
        help="Insert a generated Table of Contents after frontmatter",
    ),
) -> None:
    """Synthesize a metadata-compliant analysis document."""
    ensure_git_repo()
    subject = topic.strip()
    if not subject:
        subject = typer.prompt("Enter analysis topic").strip()
    args = subject
    if toc:
        args = f"{args} --toc" if args else "--toc"
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.CREATE_ANALYSIS, args, "Create Analysis"
            )
        )
    )


@app.command()
def archive_task(task: str = typer.Argument("", help="Task file")):
    """Archive completed task to completed folder"""
    ensure_git_repo()
    if not task.strip():
        task = typer.prompt("Enter task filename").strip()
    raise typer.Exit(
        asyncio.run(run_simple(Commands.ARCHIVE_TASK, task,
                                "Archive Task"))
    )


@app.command()
def update_report(
    input_str: str = typer.Argument(
        "",
        help="Reference filename(s) from references/",
    )
):
    """Update report from synthesized research (atomic command)"""
    ensure_git_repo()
    if not input_str.strip():
        input_str = typer.prompt(
            "Enter reference file(s) from references/"
        ).strip()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.UPDATE_REPORT,
                input_str,
                "Update Report",
            )
        )
    )


@app.command()
def analyze_report_gaps():
    """Analyze report completeness vs FLOW.md goals and tasks"""
    ensure_git_repo()
    raise typer.Exit(asyncio.run(wf_report_gap_analysis()))


@app.command()
def maintain_report():
    """Maintain report structure by splitting large files"""
    ensure_git_repo()
    raise typer.Exit(
        asyncio.run(
            run_simple(
                Commands.MAINTAIN_REPORT,
                "",
                "Maintain Report",
            )
        )
    )


@app.command()
def accumulate_knowledge(
    description: str = typer.Argument("", help="Topic to research")
):
    """Research and document WITHOUT updating customer report"""
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt("Enter topic description").strip()
    raise typer.Exit(asyncio.run(wf_accumulate_knowledge(description)))


@app.command()
def full_to_report(
    description: str = typer.Argument("", help="Feature description")
):
    """Full: description → task → research → report → archive"""
    ensure_git_repo()
    if not description.strip():
        description = typer.prompt("Enter description").strip()
    raise typer.Exit(asyncio.run(wf_full_to_report(description)))


@app.command()
def task_to_report(
    task_file: str = typer.Argument(
        "",
        help="Task file",
    )
):
    """Complete task with report update: research → report → archive"""
    ensure_git_repo()
    if not task_file.strip():
        task_file = typer.prompt("Enter task filename").strip()
    raise typer.Exit(asyncio.run(wf_task_to_report(task_file)))


# -----------------------------
# Interactive Menu System
# -----------------------------

# Menu metadata organized by category
WORKFLOWS = {
    "sw": {
        "implement": {
            "description": (
                "Implement Issue -> PR Ready"
            ),
            "handler": lambda: asyncio.run(
                wf_implement(
                    int(
                        questionary.text(
                            "Enter issue number:"
                        ).ask() or "0"
                    )
                )
            ),
        },
        "analyse-issue": {
            "description": (
                "Analyse Existing Issue (interactive)"
            ),
            "handler": lambda: asyncio.run(
                wf_analyse_issue(
                    int(
                        questionary.text(
                            "Enter issue number:"
                        ).ask() or "0"
                    )
                )
            ),
        },
        "issue-create": {
            "description": "Create & Analyse New Issue",
            "handler": lambda: asyncio.run(
                wf_issue_create(
                    questionary.text(
                        "Enter feature description:"
                    ).ask() or ""
                )
            ),
        },
        "implement-deploy": {
            "description": (
                "Implement Issue -> Deploy"
            ),
            "handler": lambda: asyncio.run(
                wf_implement_deploy(
                    int(
                        questionary.text(
                            "Enter issue number:"
                        ).ask() or "0"
                    )
                )
            ),
        },
        "create-implement": {
            "description": (
                "Full: Create -> PR Ready"
            ),
            "handler": lambda: asyncio.run(
                wf_create_implement(
                    questionary.text(
                        "Enter feature description:"
                    ).ask() or ""
                )
            ),
        },
        "full": {
            "description": (
                "Full: Create -> Deploy"
            ),
            "handler": lambda: asyncio.run(
                wf_full(
                    questionary.text(
                        "Enter feature description:"
                    ).ask() or ""
                )
            ),
        },
        "loop": {
            "description": (
                "Process Multiple Issues"
            ),
            "handler": lambda: asyncio.run(
                wf_loop(
                    [
                        int(n.strip())
                        for n in (
                            questionary.text(
                                "Issue numbers"
                                " (comma-separated):"
                            ).ask() or ""
                        ).split(",")
                        if n.strip().isdigit()
                    ],
                    deploy=questionary.confirm(
                        "Include deploy?",
                        default=False,
                    ).ask(),
                )
            ),
        },
    },
    "research": {
        "accumulate-knowledge": {
            "description": "Research and document (no report update)",
            "handler": lambda: asyncio.run(
                wf_accumulate_knowledge(
                    questionary.text("Enter topic:").ask() or ""
                )
            )
        },
        "knowledge-from-task": {
            "description": "Complete task to knowledge base only",
            "handler": lambda: asyncio.run(
                wf_knowledge_from_task(
                    questionary.text("Enter task file:").ask() or ""
                )
            )
        },
        "full-to-report": {
            "description": "Full: task → research → report",
            "handler": lambda: asyncio.run(
                wf_full_to_report(
                    questionary.text("Enter description:").ask() or ""
                )
            )
        },
        "task-to-report": {
            "description": "Complete task with report update",
            "handler": lambda: asyncio.run(
                wf_task_to_report(
                    questionary.text("Enter task file:").ask() or ""
                )
            )
        },
        "analyze-report-gaps": {
            "description": "Analyze report completeness and gaps",
            "handler": lambda: asyncio.run(wf_report_gap_analysis())
        },
        "create-final-report": {
            "description": "Create final distilled report from sources",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_FINAL_REPORT,
                    questionary.text(
                        "Enter 'folder_path [guidance]':"
                    ).ask() or "",
                    "Create Final Report"
                )
            )
        }
    }
}

COMMANDS = {
    "research": {
        "create-task": {
            "description": "Create a new numbered task file",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_TASK,
                    questionary.text(
                        "Enter task description:"
                    ).ask() or "",
                    "Create Task"
                )
            )
        },
        "search-web": {
            "description": "Execute parallel web research",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.SEARCH_WEB,
                    questionary.text("Enter topic or task file:").ask()
                    or "",
                    "Web Search"
                )
            )
        },
        "search-internal": {
            "description": "Search internal knowledge base",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.SEARCH_INTERNAL,
                    questionary.text("Enter query or task file:").ask()
                    or "",
                    "Internal Search"
                )
            )
        },
        "validate-metadata": {
            "description": "Validate YAML metadata for a folder",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.VALIDATE_METADATA,
                    (
                        questionary.text(
                            "Enter folder (default references):"
                        ).ask()
                        or "references"
                    ),
                    "Validate Metadata"
                )
            )
        },
        "import-document": {
            "description": "Import staged files into references",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.IMPORT_DOCUMENT,
                    (
                        questionary.text(
                            "File path or glob (* for all, default 5 max):"
                        ).ask() or "* --max 5"
                    ),
                    "Import Document"
                )
            )
        },
        "index-build": {
            "description": "Rebuild metadata search indexes",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.INDEX_BUILD,
                    "",
                    "Build Index"
                )
            )
        },
        "index-query": {
            "description": "Query deterministic search index",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.INDEX_QUERY,
                    (
                        questionary.text("Enter search query:").ask()
                        or ""
                    ),
                    "Query Index"
                )
            )
        },
        "create-analysis": {
            "description": (
                "Synthesize analysis (add --toc to include a TOC)"
            ),
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_ANALYSIS,
                    (
                        questionary.text(
                            "Enter analysis topic:"
                        ).ask()
                        or ""
                    ),
                    "Create Analysis"
                )
            )
        },
        "migrate-v2": {
            "description": "Reorganise project into v2 layout",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.MIGRATE_V2,
                    "",
                    "Migrate to v2"
                )
            )
        },
        "update-report": {
            "description": "Distill insights from research into report",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.UPDATE_REPORT,
                    questionary.text(
                        "Enter reference file(s):"
                    ).ask() or "",
                    "Update Report"
                )
            )
        },
        "maintain-report": {
            "description": "Maintain report structure",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.MAINTAIN_REPORT,
                    "",
                    "Maintain Report"
                )
            )
        },
        "analyze-report-gaps": {
            "description": "Analyze report completeness vs goals",
            "handler": lambda: asyncio.run(wf_report_gap_analysis())
        },
        "archive-task": {
            "description": "Archive completed task",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.ARCHIVE_TASK,
                    questionary.text("Enter task file:").ask() or "",
                    "Archive Task"
                )
            )
        }
    },
    "sw": {
        "create-issue": {
            "description": "Create a new issue from description",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_ISSUE,
                    questionary.text(
                        "Enter feature description:"
                    ).ask() or "",
                    "Create Issue"
                )
            )
        },
        "analyse-issue": {
            "description": "Analyze issue (interactive Q&A)",
            "handler": lambda: asyncio.run(
                wf_analyse_issue(
                    int(m.group(1))
                    if (m := re.search(
                        r"(\d+)",
                        questionary.text(
                            "Enter issue number:"
                        ).ask() or "",
                    ))
                    else 0
                )
            )
        },
        "implement-issue": {
            "description": "Implement issue with full workflow",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.IMPLEMENT_ISSUE,
                    questionary.text(
                        "Enter issue number:"
                    ).ask() or "",
                    "Implement Issue"
                )
            )
        },
        "continue-implementation": {
            "description": "Continue interrupted implementation",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CONTINUE_IMPLEMENTATION,
                    questionary.text(
                        "Enter issue number:"
                    ).ask() or "",
                    "Continue Implementation"
                )
            )
        },
        "coder-simple": {
            "description": "Light code manager for implementation",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CODER_SIMPLE,
                    questionary.text(
                        "Enter feature description:"
                    ).ask() or "",
                    "Coder Simple"
                )
            )
        },
        "pull-request-check": {
            "description": "Check if PR is ready for review",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.PR_CHECK,
                    questionary.text(
                        "Enter PR number (or empty):"
                    ).ask() or "",
                    "Check PR"
                )
            )
        },
        "pull-request-review": {
            "description": "Review and fix PR comments",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.PR_REVIEW,
                    questionary.text(
                        "Enter PR number (or empty):"
                    ).ask() or "",
                    "Review PR"
                )
            )
        },
        "pull-request-merge": {
            "description": "Merge PR to main and cleanup branches",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.PR_MERGE,
                    questionary.text(
                        "Enter PR number (or empty):"
                    ).ask() or "",
                    "Merge PR"
                )
            )
        },
        "deploy-check": {
            "description": "Check Render deploy status",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.DEPLOY_CHECK,
                    questionary.text(
                        "Enter service (or empty for default):"
                    ).ask() or "",
                    "Deploy Check",
                )
            ),
        },
        "production-check": {
            "description": "Run read-only production probes",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.PRODUCTION_CHECK,
                    questionary.text(
                        "Enter issue/PR/context (optional):"
                    ).ask() or "",
                    "Production Check",
                )
            ),
        }
    },
    "utils": {
        "convert-pdf": {
            "description": "Convert PDFs to markdown",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CONVERT_PDF,
                    questionary.text(
                        "Enter PDF filename (or empty for all):"
                    ).ask() or "",
                    "Convert PDF"
                )
            )
        },
        "update-flow": {
            "description": "Update flow_ai files from upstream",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.UPDATE_FLOW,
                    "",
                    "Update Flow AI"
                )
            )
        }
    },
    "write": {
        "create-final-report": {
            "description": "Create final distilled report from sources",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_FINAL_REPORT,
                    questionary.text(
                        "Enter 'folder_path [guidance]':"
                    ).ask() or "",
                    "Create Final Report"
                )
            )
        },
        "update-final-report": {
            "description": "Update existing final report with new content",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.UPDATE_FINAL_REPORT,
                    questionary.text(
                        "Enter 'final_report_path new_files':"
                    ).ask() or "",
                    "Update Final Report"
                )
            )
        },
        "create-pptx-presentation": {
            "description": "Create PowerPoint from report file",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_PPTX_PRESENTATION,
                    questionary.text(
                        "Enter 'report_path output_folder [guidance]':"
                    ).ask() or "",
                    "Create PowerPoint Presentation"
                )
            )
        },
        "create-docx-report": {
            "description": "Create Word document from report file",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_DOCX_REPORT,
                    questionary.text(
                        "Enter 'report_path output_folder [guidance]':"
                    ).ask() or "",
                    "Create Word Document"
                )
            )
        },
        "create-xlsx-report": {
            "description": "Create Excel spreadsheet from report file",
            "handler": lambda: asyncio.run(
                run_simple(
                    Commands.CREATE_XLSX_REPORT,
                    questionary.text(
                        "Enter 'report_path output_folder [guidance]':"
                    ).ask() or "",
                    "Create Excel Spreadsheet"
                )
            )
        }
    }
}


def interactive_menu():
    """Interactive menu when flow.py is run without arguments"""
    ensure_git_repo()

    while True:
        try:
            # Level 1: Top menu (Workflows / Commands)
            print(f"\n{BLUE}╔══════════════════════════════════════╗")
            print(f"║  🚀 Flow AI - Workflow Manager      ║")
            print(f"╚══════════════════════════════════════╝{NC}")

            # Add empty lines to create space at bottom of terminal
            print("\n" * 10)
            # Move cursor back up
            print("\033[10A", end="", flush=True)

            top_choice = questionary.select(
                "Select category:",
                choices=["Workflows", "Commands", "Exit"]
            ).ask()

            if top_choice == "Exit" or top_choice is None:
                print(f"\n{GREEN}Goodbye!{NC}\n")
                return 0

            if top_choice == "Workflows":
                # Level 2: Workflow category selection
                print("\n" * 10)
                print("\033[10A", end="", flush=True)

                workflow_category = questionary.select(
                    "Select workflow type:",
                    choices=["SW Workflows", "Research Workflows",
                             "← Back"]
                ).ask()

                if workflow_category == "← Back" or \
                   workflow_category is None:
                    continue

                # Map display name to internal key
                category_map = {
                    "SW Workflows": "sw",
                    "Research Workflows": "research"
                }
                category_key = category_map[workflow_category]

                # Level 3: Specific workflow selection
                workflows = WORKFLOWS[category_key]
                workflow_choices = [
                    f"{name} - {info['description']}"
                    for name, info in workflows.items()
                ]
                workflow_choices.append("← Back")

                print("\n" * 10)
                print("\033[10A", end="", flush=True)

                selected = questionary.select(
                    f"{workflow_category}:",
                    choices=workflow_choices
                ).ask()

                if selected == "← Back" or selected is None:
                    continue

                # Extract workflow name and execute
                workflow_name = selected.split(" - ")[0]
                try:
                    result = workflows[workflow_name]["handler"]()
                    if result and result != 0:
                        print(f"\n{YELLOW}Workflow exited with code: "
                              f"{result}{NC}")
                except KeyboardInterrupt:
                    print(f"\n{YELLOW}Workflow interrupted, returning "
                          f"to menu{NC}")
                    continue
                except Exception as e:
                    print(f"\n{RED}Error: {e}{NC}")

            elif top_choice == "Commands":
                # Level 2: Command category selection
                print("\n" * 10)
                print("\033[10A", end="", flush=True)

                command_category = questionary.select(
                    "Select command category:",
                    choices=["Research Commands", "SW Commands",
                             "Write Commands", "Utils Commands", "← Back"]
                ).ask()

                if command_category == "← Back" or \
                   command_category is None:
                    continue

                # Map display name to internal key
                category_map = {
                    "Research Commands": "research",
                    "SW Commands": "sw",
                    "Write Commands": "write",
                    "Utils Commands": "utils"
                }
                category_key = category_map[command_category]

                # Level 3: Specific command selection
                commands = COMMANDS[category_key]
                command_choices = [
                    f"{name} - {info['description']}"
                    for name, info in commands.items()
                ]
                command_choices.append("← Back")

                print("\n" * 10)
                print("\033[10A", end="", flush=True)

                selected = questionary.select(
                    f"{command_category}:",
                    choices=command_choices
                ).ask()

                if selected == "← Back" or selected is None:
                    continue

                # Extract command name and execute
                command_name = selected.split(" - ")[0]
                try:
                    result = commands[command_name]["handler"]()
                    if result and result != 0:
                        print(f"\n{YELLOW}Command exited with code: "
                              f"{result}{NC}")
                except KeyboardInterrupt:
                    print(f"\n{YELLOW}Command interrupted, returning "
                          f"to menu{NC}")
                    continue
                except Exception as e:
                    print(f"\n{RED}Error: {e}{NC}")

            # Ask if user wants to continue
            try:
                print()  # Add empty line before prompt
                continue_choice = questionary.confirm(
                    "Return to main menu?",
                    default=True
                ).ask()

                if not continue_choice:
                    print(f"\n{GREEN}Goodbye!{NC}\n")
                    return 0
            except KeyboardInterrupt:
                # User pressed Ctrl-C on confirmation, return to menu
                print(f"\n{YELLOW}Returning to menu{NC}\n")
                continue

        except KeyboardInterrupt:
            # Catch Ctrl-C at any point in the menu and return to start
            print(f"\n{YELLOW}Returning to menu{NC}\n")
            continue


if __name__ == "__main__":
    # Check if running without arguments -> show interactive menu
    if len(sys.argv) == 1:
        sys.exit(interactive_menu())
    else:
        # Arguments provided -> use Typer CLI
        app()
