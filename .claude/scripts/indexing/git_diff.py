"""Git diff helpers for indexing."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Iterable, Sequence


def _run_git_command(args: Sequence[str], cwd: Path) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git command failed")
    return result.stdout


def get_changed_files(
    repo_root: Path,
    *,
    staged: bool = True,
    include_untracked: bool = True,
) -> list[Path]:
    args = ["diff", "--name-only", "--diff-filter=ACMRT"]
    if staged:
        args.append("--staged")
    output = _run_git_command(args, cwd=repo_root)
    files = [repo_root / line.strip() for line in output.splitlines() if line]

    if include_untracked:
        untracked = _run_git_command(["ls-files", "--others", "--exclude-standard"], cwd=repo_root)
        files.extend(repo_root / line.strip() for line in untracked.splitlines() if line)

    return files


def get_changed_markdown_files(
    repo_root: Path,
    directories: Iterable[Path],
    patterns: Iterable[str] = ("*.md",),
    *,
    staged: bool = True,
) -> list[Path]:
    patterns = tuple(patterns)
    changed = get_changed_files(repo_root, staged=staged)
    scope = {path.resolve() for path in directories}

    def in_scope(path: Path) -> bool:
        resolved = path.resolve()
        for directory in scope:
            try:
                resolved.relative_to(directory)
                return True
            except ValueError:
                continue
        return False

    def matches_pattern(path: Path) -> bool:
        return any(path.match(pattern) for pattern in patterns)

    return [path for path in changed if in_scope(path) and matches_pattern(path)]
