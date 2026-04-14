"""Index building utilities for Markdown collections."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .config import IndexingConfig
from .metadata import MarkdownDocument, load_markdown_document


DEFAULT_MARKDOWN_PATTERNS = ("*.md",)


def _iter_markdown_files(
    directories: Iterable[Path],
    patterns: Iterable[str] = DEFAULT_MARKDOWN_PATTERNS,
) -> Iterable[Path]:
    for directory in directories:
        if not directory.exists():
            continue
        for pattern in patterns:
            yield from directory.rglob(pattern)


def _build_document_entry(doc: MarkdownDocument) -> dict:
    front_matter = doc.front_matter.data if doc.front_matter else {}
    headings = [
        {
            "level": heading.level,
            "title": heading.title,
            "line": heading.line_number,
        }
        for heading in doc.headings
    ]

    return {
        "path": str(doc.path.as_posix()),
        "title": front_matter.get("title"),
        "summary": front_matter.get("summary"),
        "topics": front_matter.get("topics", []),
        "geographies": front_matter.get("geographies", []),
        "time_horizon": front_matter.get("time_horizon"),
        "related": front_matter.get("related", []),
        "tags": sorted(set(front_matter.get("topics", []) + front_matter.get("data_types", []))),
        "headings": headings,
        "line_count": doc.body.count("\n") + 1,
    }


def build_index_manifest(
    config: IndexingConfig,
    *,
    files: Iterable[Path] | None = None,
    include_all: bool = False,
) -> dict:
    markdown_files = list(files) if files else []
    if include_all or not markdown_files:
        markdown_files = list(
            _iter_markdown_files(
                config.markdown_dirs,
                patterns=DEFAULT_MARKDOWN_PATTERNS
                + config.extra_file_patterns,
            )
        )

    documents: list[dict] = []
    for path in sorted(set(markdown_files)):
        if not path.is_file():
            continue
        doc = load_markdown_document(path)
        documents.append(_build_document_entry(doc))

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documents": documents,
    }

    output_path = config.index_dir / "index.json"
    output_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return manifest
