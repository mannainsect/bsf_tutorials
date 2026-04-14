"""Helper utilities for generating markdown Table of Contents."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple


HEADING_PATTERN = re.compile(r"^(#{2,6})\s+(.*)$")


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", text).strip().lower()
    slug = re.sub(r"\s+", "-", slug)
    return slug


def iter_headings(
    markdown: str,
    levels: Iterable[int],
) -> List[Tuple[int, str]]:
    allowed = set(levels)
    headings: List[Tuple[int, str]] = []
    for line in markdown.splitlines():
        match = HEADING_PATTERN.match(line)
        if not match:
            continue
        level = len(match.group(1))
        if level not in allowed:
            continue
        title = match.group(2).strip()
        headings.append((level, title))
    return headings


def generate_toc(
    markdown: str,
    levels: Sequence[int] = (2, 3, 4),
) -> str:
    headings = iter_headings(markdown, levels)
    if not headings:
        return ""

    base_level = min(levels)
    lines = ["## Table of Contents", ""]
    for level, title in headings:
        indent = "  " * max(0, level - base_level)
        lines.append(f"{indent}- [{title}](#{slugify(title)})")
    lines.append("")
    return "\n".join(lines)


def strip_existing_toc(body: str) -> str:
    marker = "## Table of Contents"
    idx = body.find(marker)
    if idx == -1:
        return body
    start = idx
    remainder = body[idx + len(marker):]
    next_heading = remainder.find("\n#")
    if next_heading != -1:
        end = idx + len(marker) + next_heading + 1
    else:
        end = len(body)
    prefix = body[:start].rstrip()
    suffix = body[end:].lstrip("\n")
    if prefix and suffix:
        return prefix + "\n\n" + suffix
    if suffix:
        return suffix
    return prefix


def insert_toc(markdown: str, levels: Sequence[int]) -> str:
    if not markdown.startswith("---"):
        raise ValueError("Markdown file missing YAML frontmatter")
    parts = markdown.split("---", 2)
    if len(parts) < 3:
        raise ValueError("Frontmatter delimiter incomplete")
    prefix = "---" + parts[1] + "---\n"
    body = parts[2].lstrip("\n")
    cleaned = strip_existing_toc(body)
    toc_block = generate_toc(cleaned, levels)
    if not toc_block:
        return prefix + cleaned
    return prefix + toc_block + "\n" + cleaned.lstrip()


def parse_levels(raw: str | None) -> Sequence[int]:
    if not raw:
        return (2, 3, 4)
    try:
        levels = tuple(int(part) for part in raw.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            "Levels must be comma-separated integers"
        ) from exc
    for level in levels:
        if level < 2 or level > 6:
            raise argparse.ArgumentTypeError(
                "Levels must be between 2 and 6"
            )
    return levels


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate or insert a markdown table of contents",
    )
    parser.add_argument(
        "path",
        type=Path,
        help="Markdown file to process",
    )
    parser.add_argument(
        "--levels",
        type=parse_levels,
        default=(2, 3, 4),
        help="Comma-separated heading levels to include (default 2,3,4)",
    )
    parser.add_argument(
        "--insert",
        action="store_true",
        help="Overwrite file by inserting or refreshing the TOC",
    )
    parser.add_argument(
        "--print",
        action="store_true",
        help="Print TOC to stdout (implied when --insert unset)",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    markdown = args.path.read_text(encoding="utf-8")
    try:
        result = insert_toc(markdown, args.levels)
    except ValueError as exc:
        parser.error(str(exc))
    if args.insert:
        args.path.write_text(result, encoding="utf-8")
    if args.print or not args.insert:
        body = result.split("---", 2)[-1]
        toc_only = generate_toc(strip_existing_toc(body), args.levels)
        if toc_only:
            print(toc_only)
    return 0


if __name__ == "__main__":
    sys.exit(main())
