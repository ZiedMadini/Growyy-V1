"""
ChromaDB RAG pipeline for the Growy chatbot.

Embeds the knowledge base .md files with all-MiniLM-L6-v2 (runs locally, ~80MB).
On each chat request: embed the user query → top-3 chunks → inject into system prompt.

Build the index once:
    python -m ai.chat.rag --build

The index persists at backend/data/chroma/.
"""

import argparse
import logging
import re
import sys
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"
CHROMA_DIR = Path(__file__).parent.parent.parent / "data" / "chroma"
COLLECTION_NAME = "growy_kb"
EMBED_MODEL = "all-MiniLM-L6-v2"
TOP_K = 3
CHUNK_SIZE = 400    # characters per chunk
CHUNK_OVERLAP = 80


def _split_markdown(text: str, source: str) -> List[dict]:
    """Split a markdown document into overlapping chunks by paragraph."""
    # Split on double newline (paragraph boundaries)
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) < CHUNK_SIZE:
            current = current + "\n\n" + para if current else para
        else:
            if current:
                chunks.append({"text": current, "source": source})
            # Start new chunk with overlap from previous
            words = current.split()[-CHUNK_OVERLAP // 5:]
            current = " ".join(words) + "\n\n" + para

    if current:
        chunks.append({"text": current, "source": source})

    return chunks


def build_index() -> None:
    """Embed all knowledge files and persist ChromaDB collection."""
    import chromadb
    from sentence_transformers import SentenceTransformer

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    # Delete and recreate to rebuild from scratch
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    embedder = SentenceTransformer(EMBED_MODEL)

    all_chunks = []
    for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        chunks = _split_markdown(text, md_file.stem)
        all_chunks.extend(chunks)
        logger.info("Indexed %s → %d chunks", md_file.name, len(chunks))

    if not all_chunks:
        logger.warning("No knowledge files found in %s", KNOWLEDGE_DIR)
        return

    texts = [c["text"] for c in all_chunks]
    embeddings = embedder.encode(texts, show_progress_bar=True, batch_size=32)
    ids = [f"chunk_{i}" for i in range(len(all_chunks))]
    metadatas = [{"source": c["source"]} for c in all_chunks]

    collection.add(documents=texts, embeddings=embeddings.tolist(), ids=ids, metadatas=metadatas)
    logger.info("ChromaDB: indexed %d chunks from %d files", len(all_chunks), len(list(KNOWLEDGE_DIR.glob("*.md"))))


class RAGRetriever:
    """Lazy-loaded retriever. First call to retrieve() loads the model."""

    def __init__(self) -> None:
        self._embedder = None
        self._collection = None

    def _ensure_loaded(self) -> bool:
        if self._collection is not None:
            return True
        if not CHROMA_DIR.exists():
            return False
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer
            client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self._collection = client.get_collection(COLLECTION_NAME)
            self._embedder = SentenceTransformer(EMBED_MODEL)
            return True
        except Exception as e:
            logger.warning("RAG not available: %s", e)
            return False

    def retrieve(self, query: str) -> str:
        """Return top-K relevant knowledge chunks as a formatted string."""
        if not self._ensure_loaded():
            return ""
        try:
            embedding = self._embedder.encode([query])[0].tolist()
            results = self._collection.query(
                query_embeddings=[embedding], n_results=TOP_K
            )
            docs = results.get("documents", [[]])[0]
            sources = [m.get("source", "") for m in results.get("metadatas", [[]])[0]]
            if not docs:
                return ""
            lines = ["## Relevant Knowledge\n"]
            for doc, src in zip(docs, sources):
                lines.append(f"[{src}]\n{doc}\n")
            return "\n".join(lines)
        except Exception as e:
            logger.warning("RAG retrieval error: %s", e)
            return ""


# Module-level singleton
retriever = RAGRetriever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true", help="Build ChromaDB index")
    args = parser.parse_args()
    if args.build:
        build_index()
        print("RAG index built successfully.")
    else:
        parser.print_help()
