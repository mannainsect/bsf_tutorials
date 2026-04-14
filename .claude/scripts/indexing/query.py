"""Simple lexical search over the generated manifest."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Iterable

from .config import IndexingConfig


WORD_PATTERN = re.compile(r"[A-Za-z0-9_-]+")


def _tokenize(text: str) -> list[str]:
    return [token.lower() for token in WORD_PATTERN.findall(text)]


def _score_document(query_tokens: list[str], document: dict) -> float:
    fields = [
        document.get("title") or "",
        document.get("summary") or "",
        " ".join(document.get("topics", [])),
        " ".join(h.get("title", "") for h in document.get("headings", [])),
    ]
    text_tokens = _tokenize(" ".join(fields))
    if not text_tokens:
        return 0.0
    counts = Counter(text_tokens)
    return float(sum(counts[token] for token in query_tokens))


def _load_manifest(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def query_manifest(
    config: IndexingConfig,
    query: str,
    *,
    limit: int = 10,
) -> list[dict]:
    manifest = _load_manifest(config.index_dir / "index.json")
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    scored = []
    for document in manifest.get("documents", []):
        score = _score_document(query_tokens, document)
        if score <= 0:
            continue
        scored.append((score, document))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [doc for _, doc in scored[:limit]]


def format_results(documents: Iterable[dict]) -> str:
    lines = []
    for doc in documents:
        path = doc.get("path")
        title = doc.get("title") or "Untitled"
        summary = doc.get("summary") or ""
        lines.append(f"- {title} ({path})")
        if summary:
            lines.append(f"  Summary: {summary[:120]}")
    return "\n".join(lines)
