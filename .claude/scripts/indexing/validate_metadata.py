#!/usr/bin/env -S uv run --quiet
# /// script
# dependencies = ["ruamel.yaml"]
# ///
"""Validate YAML frontmatter for flow_ai v3 markdown files.

This validator implements the simplified, taxonomy-free semantics
described in ``docs/UPGRADE_v3.md``:

- No dependency on ``docs/metadata-taxonomy.yaml``.
- Required fields: ``title``, ``date``, ``tags``, ``source``,
  ``summary``.
- ``date`` must be in ``YYYY-MM-DD`` format.
- ``tags`` must contain between 1 and 5 entries; values are
  normalised to lowercase kebab-case for validation purposes.
- ``related`` paths (when present) must point to existing files.

The script is intentionally conservative and read-only: it reports
problems but does not modify any markdown files.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any, Dict, List

from ruamel.yaml import YAML


DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TAG_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


REQUIRED_FIELDS: List[str] = [
    "title",
    "date",
    "tags",
    "source",
    "summary",
]


def extract_frontmatter(markdown_path: Path) -> Dict[str, Any]:
    text = markdown_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError("Missing YAML frontmatter")
    _, frontmatter, _ = text.split("---", 2)
    yaml = YAML(typ="safe")
    return yaml.load(frontmatter) or {}


def _normalise_tags(raw: Any) -> List[str]:
    """Return a list of normalised tag slugs for validation.

    Normalisation rules (mirroring UPGRADE_v3.md):

    - Accept strings or lists (anything else is coerced to ``str``).
    - Lowercase values.
    - Replace any non-alphanumeric run with a single ``-``.
    - Collapse multiple ``-`` characters and strip leading/trailing
      dashes.
    - Drop empty results.
    """

    if raw is None:
        return []

    values: List[str]
    if isinstance(raw, str):
        values = [raw]
    elif isinstance(raw, list):
        values = [str(item) for item in raw]
    else:
        values = [str(raw)]

    normalised: List[str] = []
    for value in values:
        tag = value.strip().lower()
        tag = re.sub(r"[^a-z0-9]+", "-", tag)
        tag = re.sub(r"-+", "-", tag).strip("-")
        if tag:
            normalised.append(tag)
    return normalised


def validate(metadata: Dict[str, Any], path: Path) -> List[str]:
    errors: List[str] = []

    # Required field presence
    for field in REQUIRED_FIELDS:
        if field not in metadata:
            errors.append(f"{path}: missing required field '{field}'")

    # Basic type/format checks for core fields
    title_value = metadata.get("title")
    if title_value is not None and not str(title_value).strip():
        errors.append(f"{path}: title must be a non-empty string")

    date_value = metadata.get("date")
    if date_value is None:
        pass
    elif not DATE_PATTERN.match(str(date_value)):
        errors.append(
            f"{path}: invalid date '{date_value}' (expected YYYY-MM-DD)"
        )

    source_value = metadata.get("source")
    if source_value is not None and not str(source_value).strip():
        errors.append(f"{path}: source must be a non-empty string")

    summary_value = metadata.get("summary")
    if summary_value is not None and not str(summary_value).strip():
        errors.append(f"{path}: summary must be a non-empty string")

    # Tag constraints: 1–5 kebab-case tags
    normalised_tags = _normalise_tags(metadata.get("tags"))
    if not normalised_tags:
        errors.append(
            f"{path}: tags must contain between 1 and 5 entries after "
            "normalisation"
        )
    elif not 1 <= len(normalised_tags) <= 5:
        errors.append(
            f"{path}: tags must contain between 1 and 5 entries (found "
            f"{len(normalised_tags)})"
        )

    for tag in normalised_tags:
        if not TAG_SLUG_PATTERN.match(tag):
            errors.append(
                f"{path}: tag '{tag}' is not valid kebab-case "
                "(expected lowercase letters/numbers separated by hyphens)"
            )

    # Related file existence check (unchanged from v2 semantics)
    related = metadata.get("related", [])
    if isinstance(related, str):
        related = [related]
    for rel in related:
        candidate = path.parent / str(rel)
        if not candidate.exists():
            errors.append(
                f"{path}: related file '{rel}' not found"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate flow_ai metadata"
    )
    parser.add_argument(
        "folder",
        help="Folder containing Markdown files (references or analysis)",
    )
    args = parser.parse_args()

    base = Path(args.folder)
    if not base.exists() or not base.is_dir():
        print(f"ERROR: folder '{base}' not found")
        return 1

    errors_total: List[str] = []
    error_files: Dict[Path, int] = {}

    for md_file in sorted(base.glob("*.md")):
        if md_file.name in {"index.md", "tags.md"}:
            continue
        try:
            metadata = extract_frontmatter(md_file)
        except Exception as exc:  # noqa: BLE001
            msg = f"{md_file}: failed to parse frontmatter ({exc})"
            errors_total.append(msg)
            error_files[md_file] = error_files.get(md_file, 0) + 1
            continue

        file_errors = validate(metadata, md_file)
        if file_errors:
            errors_total.extend(file_errors)
            error_files[md_file] = error_files.get(md_file, 0) + len(
                file_errors
            )

    if errors_total:
        print("ERRORS:")
        for error in errors_total:
            print(f"- {error}")
        print(f"VALIDATION_ERRORS: {len(errors_total)}")
        for file_path in sorted(error_files.keys()):
            print(f"ERROR_FILE: {file_path}")
        return 1

    print(f"VALID_METADATA: {args.folder}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
