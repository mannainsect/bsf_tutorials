"""Configuration helpers for indexing workflows."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


def _discover_repo_root(start: Path) -> Path:
    current = start
    for parent in (current, *current.parents):
        if (parent / ".git").is_dir():
            return parent
    return start


def _ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass(slots=True)
class IndexingConfig:
    repo_root: Path
    markdown_dirs: tuple[Path, ...]
    index_dir: Path
    metadata_taxonomy: Path
    tag_registry: Path
    extra_file_patterns: tuple[str, ...] = field(default_factory=tuple)

    def resolve_paths(self, paths: Iterable[str]) -> list[Path]:
        return [self.repo_root / rel for rel in paths]


def load_config() -> IndexingConfig:
    root = _discover_repo_root(Path(__file__).resolve())
    docs_dir = root / "docs"
    index_dir = _ensure_directory(root / "index")
    metadata_taxonomy = docs_dir / "metadata-taxonomy.yaml"
    tag_registry = _ensure_directory(docs_dir).joinpath("tag-registry.json")

    markdown_dirs: list[Path] = []
    for rel in os.environ.get("INDEXING_MD_DIRS", "tasks,results,reports").split(","):
        rel = rel.strip()
        if not rel:
            continue
        markdown_dirs.append(root / rel)

    extra_patterns = tuple(
        p.strip()
        for p in os.environ.get("INDEXING_EXTRA_PATTERNS", "").split(",")
        if p.strip()
    )

    config = IndexingConfig(
        repo_root=root,
        markdown_dirs=tuple(markdown_dirs),
        index_dir=index_dir,
        metadata_taxonomy=metadata_taxonomy,
        tag_registry=tag_registry,
        extra_file_patterns=extra_patterns,
    )

    if not config.tag_registry.exists():
        config.tag_registry.write_text("{}\n", encoding="utf-8")

    return config


def save_tag_registry(config: IndexingConfig, registry: dict[str, list[str]]) -> None:
    text = json.dumps(registry, indent=2, sort_keys=True) + "\n"
    config.tag_registry.write_text(text, encoding="utf-8")
