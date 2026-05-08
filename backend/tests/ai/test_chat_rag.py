import pytest
from pathlib import Path
from ai.chat.rag import build_index, RAGRetriever, KNOWLEDGE_DIR


@pytest.fixture(scope="module")
def rag(tmp_path_factory):
    chroma_path = tmp_path_factory.mktemp("chroma")
    # Patch the module-level paths temporarily
    import ai.chat.rag as rag_module
    original = rag_module.CHROMA_DIR
    rag_module.CHROMA_DIR = chroma_path
    build_index()
    r = RAGRetriever()
    r._ensure_loaded()
    yield r
    rag_module.CHROMA_DIR = original


def test_knowledge_files_exist():
    md_files = list(KNOWLEDGE_DIR.glob("*.md"))
    assert len(md_files) >= 3, f"Expected at least 3 knowledge .md files, found {len(md_files)}"


def test_retrieve_returns_string(rag):
    result = rag.retrieve("ideal pH for hydroponics")
    assert isinstance(result, str)


def test_retrieve_non_empty_for_known_topic(rag):
    result = rag.retrieve("pH target range vegetative stage")
    assert len(result) > 0


def test_retrieve_graceful_empty_query(rag):
    result = rag.retrieve("")
    assert isinstance(result, str)
