"""Markdown metadata extraction utilities."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


try:
    from ruamel.yaml import YAML  # type: ignore

    _yaml = YAML(typ="safe")
except ModuleNotFoundError:  # pragma: no cover
    try:
        import yaml  # type: ignore

        def _yaml_load(text: str):
            return yaml.safe_load(text)

        class _FallbackYAML:
            def load(self, text: str):
                return _yaml_load(text)

        _yaml = _FallbackYAML()
    except ModuleNotFoundError as err:  # pragma: no cover
        raise RuntimeError(
            "No YAML parser available. Install ruamel.yaml or PyYAML."
        ) from err


FRONT_MATTER_PATTERN = re.compile(
    r"^---\s*\n(?P<content>.+?)\n---\s*\n",
    re.DOTALL,
)

HEADING_PATTERN = re.compile(r"^(?P<level>#+)\s+(?P<title>.+?)\s*$")


@dataclass(slots=True)
class FrontMatter:
    data: dict

    def get(self, key: str, default=None):  # type: ignore[override]
        return self.data.get(key, default)


@dataclass(slots=True)
class MarkdownHeading:
    level: int
    title: str
    line_number: int


@dataclass(slots=True)
class MarkdownDocument:
    path: Path
    front_matter: FrontMatter | None
    body: str

    @property
    def headings(self) -> list[MarkdownHeading]:
        return list(iter_markdown_headings(self.body))


def extract_front_matter(text: str) -> tuple[FrontMatter | None, str]:
    match = FRONT_MATTER_PATTERN.match(text)
    if not match:
        return None, text

    yaml_text = match.group("content")
    remainder = text[match.end() :]
    data = _yaml.load(yaml_text) or {}
    if not isinstance(data, dict):
        raise ValueError("Front matter must define a mapping")
    return FrontMatter(data=data), remainder


def iter_markdown_headings(text: str) -> Iterator[MarkdownHeading]:
    for idx, line in enumerate(text.splitlines(), start=1):
        match = HEADING_PATTERN.match(line)
        if not match:
            continue
        level = len(match.group("level"))
        title = match.group("title").strip()
        yield MarkdownHeading(level=level, title=title, line_number=idx)


def load_markdown_document(path: Path) -> MarkdownDocument:
    text = path.read_text(encoding="utf-8")
    front_matter, body = extract_front_matter(text)
    return MarkdownDocument(path=path, front_matter=front_matter, body=body)
