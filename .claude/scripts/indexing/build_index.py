#!/usr/bin/env python3
# /// script
# dependencies = ["ruamel.yaml"]
# ///

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

from ruamel.yaml import YAML


def load_markdown_files(folders: List[str]) -> List[Path]:
    result: List[Path] = []
    for folder in folders:
        path = Path(folder)
        if not path.exists():
            continue
        result.extend(sorted(path.glob("*.md")))
    return [f for f in result if f.name not in {"index.md", "tags.md"}]


def parse_frontmatter(markdown_path: Path) -> Dict[str, Any]:
    text = markdown_path.read_text(encoding="utf-8")
    _, frontmatter, body = text.split("---", 2)
    yaml = YAML(typ="safe")
    metadata = yaml.load(frontmatter)
    metadata["__body"] = body
    return metadata


def build_index(files: List[Path]) -> Tuple[Dict[str, Any], List[Dict[str, str]]]:
    index: Dict[str, Any] = {
        "files": [],
        "topics": defaultdict(list),
        "tags": defaultdict(list),
        "keywords": defaultdict(lambda: {"count": 0, "files": []}),
    }
    documents: List[Dict[str, str]] = []

    for md_file in files:
        metadata = parse_frontmatter(md_file)
        entry = {
            "path": str(md_file),
            "title": metadata.get("title", ""),
            "date": metadata.get("date", ""),
            "topics": metadata.get("topics", []),
            "tags": metadata.get("tags", []),
            "related": metadata.get("related", []),
        }
        index["files"].append(entry)

        documents.append(
            {
                "path": entry["path"],
                "body": metadata.get("__body", ""),
            }
        )

        for topic in entry["topics"]:
            index["topics"][topic].append(entry["path"])
        for tag in entry["tags"]:
            index["tags"][tag].append(entry["path"])

        title_keywords = set(entry["title"].lower().split())
        for keyword in title_keywords:
            bucket = index["keywords"][keyword]
            bucket["count"] += 1
            bucket["files"].append(entry["path"])

    return index, documents


def build_vector_index(documents: List[Dict[str, str]]) -> None:
    if not documents:
        print("VECTOR_INDEX_SKIPPED: no documents available")
        return

    try:
        import numpy as np
        import faiss  # type: ignore
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:  # noqa: BLE001
        print(f"VECTOR_INDEX_SKIPPED: {exc}")
        return

    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [doc["body"].strip() or doc["path"] for doc in documents]
    embeddings = model.encode(texts, convert_to_numpy=True)

    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embeddings = embeddings / norms

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    Path("index").mkdir(exist_ok=True)
    faiss.write_index(index, "index/vector.index")
    with Path("index/vector-metadata.json").open("w", encoding="utf-8") as fh:
        json.dump([doc["path"] for doc in documents], fh, indent=2)

    print("VECTOR_INDEX_BUILT: index/vector.index")
    print(f"VECTOR_DOCUMENTS: {len(documents)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--folders",
        nargs="*",
        default=["references", "analysis"],
        help="Folders to index",
    )
    parser.add_argument(
        "--vector",
        action="store_true",
        help="Build vector index (Phase 7 optional feature)",
    )
    args = parser.parse_args()

    files = load_markdown_files(args.folders)
    index, documents = build_index(files)

    Path("index").mkdir(exist_ok=True)
    with Path("index/index.json").open("w", encoding="utf-8") as handle:
        json.dump(index, handle, indent=2)

    print("INDEX_BUILT: index/index.json")
    print(f"FILES_INDEXED: {len(files)}")

    if args.vector:
        build_vector_index(documents)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
