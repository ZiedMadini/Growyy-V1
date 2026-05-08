
import pathlib
out = pathlib.Path("docs/superpowers/plans/2026-05-05-ai-system.md")
# We write in chunks
lines = []
lines.append("""# Growy AI System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all AI stubs in the FastAPI backend with production-quality local models: EfficientNet-V2-S (disease), PatchTST (forecasting), Mistral-7B+RAG (chatbot), rule engine + LightGBM (recommendations).

**Architecture:** All AI code in new backend/ai/ package with a ModelRegistry that lazy-loads models. Existing routers updated to call through the registry. New POST /recommend/{roomId} endpoint added.

**Tech Stack:** PyTorch, timm, sentence-transformers, chromadb, lightgbm, joblib, einops, Ollama (Mistral-7B)

**Working directory for all commands:** .worktrees/backend/

---

## File Map

**Created:**
- backend/ai/__init__.py, base.py, registry.py
- backend/ai/disease/__init__.py, classes.py, model.py, train.py
- backend/ai/forecast/__init__.py, patch_tst.py, model.py, train.py
- backend/ai/chat/__init__.py, rag.py, model.py, knowledge/{nutrition,vpd,diseases,schedules}.md
- backend/ai/recommend/__init__.py, rules.py, model.py, train.py
- backend/routers/recommend.py
- backend/tests/ai/__init__.py, test_registry.py, test_disease.py, test_forecast.py, test_chat_rag.py, test_recommend.py

**Modified:** backend/requirements.txt, routers/disease.py, routers/forecast.py, routers/chat.py, main.py, src/routes/rooms.$roomId.tsx

---
""")
out.write_text("
".join(lines), encoding="utf-8")
print("written")
