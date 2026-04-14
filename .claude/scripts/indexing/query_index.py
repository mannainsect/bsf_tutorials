#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple


def load_index() -> Dict[str, Any]:
    path = Path("index/index.json")
    if not path.exists():
        raise FileNotFoundError(
            "index/index.json not found. Run: ./flow.py index-build"
        )
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def score_documents(index: Dict[str, Any], query: str) -> List[Tuple[str, float]]:
    terms = [part.strip().lower() for part in query.split() if part.strip()]
    scores: Dict[str, float] = {}

    for entry in index.get("files", []):
        score = 0.0
        title = entry.get("title", "").lower()
        for term in terms:
            if term in title:
                score += 1.0
            keywords = index.get("keywords", {})
            if term in keywords and entry["path"] in keywords[term]["files"]:
                score += 0.5
        for topic in entry.get("topics", []):
            if any(term in topic.lower() for term in terms):
                score += 2.0
        for tag in entry.get("tags", []):
            if any(term in tag.lower() for term in terms):
                score += 1.5
        if score:
            scores[entry["path"]] = score

    return sorted(scores.items(), key=lambda item: item[1], reverse=True)


def semantic_search(query: str, limit: int) -> List[Tuple[str, float]]:
    index_path = Path("index/vector.index")
    metadata_path = Path("index/vector-metadata.json")
    if not index_path.exists() or not metadata_path.exists():
        print("SEMANTIC_QUERY_SKIPPED: vector index missing")
        return []

    try:
        import numpy as np
        import faiss  # type: ignore
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:  # noqa: BLE001
        print(f"SEMANTIC_QUERY_SKIPPED: {exc}")
        return []

    doc_paths: List[str] = json.loads(metadata_path.read_text(encoding="utf-8"))
    vector_index = faiss.read_index(str(index_path))
    model = SentenceTransformer("all-MiniLM-L6-v2")

    embedding = model.encode([query], convert_to_numpy=True)
    norms = np.linalg.norm(embedding, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embedding = embedding / norms

    k = min(limit, vector_index.ntotal)
    if k == 0:
        return []

    scores, indices = vector_index.search(embedding, k)
    results: List[Tuple[str, float]] = []
    for idx, score in zip(indices[0], scores[0]):
        if idx == -1:
            continue
        try:
            path = doc_paths[idx]
        except IndexError:
            continue
        results.append((path, float(score)))
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("query", help="Search terms")
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Maximum number of results to return",
    )
    parser.add_argument(
        "--semantic",
        action="store_true",
        help="Use vector index for semantic ranking",
    )
    args = parser.parse_args()

    index = load_index()
    ranked = score_documents(index, args.query)[: args.limit]

    print(f"QUERY: {args.query}")
    print(f"RESULTS: {len(ranked)}")
    for rank, (path, score) in enumerate(ranked, start=1):
        print(f"{rank}. {path} (score: {score:.2f})")
    if ranked:
        print(f"TOP_MATCH: {ranked[0][0]}")

    if args.semantic:
        semantic_ranked = semantic_search(args.query, args.limit)
        print(f"SEMANTIC_RESULTS: {len(semantic_ranked)}")
        for rank, (path, score) in enumerate(semantic_ranked, start=1):
            print(f"S{rank}. {path} (score: {score:.4f})")
        if semantic_ranked:
            print(f"SEMANTIC_TOP_MATCH: {semantic_ranked[0][0]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
