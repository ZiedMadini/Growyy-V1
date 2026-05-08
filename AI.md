# Growy — AI Engineer Reference

This file is the authoritative reference for the Growy AI layer.
Keep it up to date as models are trained, swapped, or tuned.

---

## Current Status (as of 2026-05-06)

| Module            | Status | Notes                                                                                                                                              |
| ----------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disease Detection | LIVE   | DeiT-Base fine-tuned on PlantVillage (`rescu/deit-base-patch16-224-finetuned-plantvillage`). 39 classes, 99.89% top-1. Cached at `D:\hf_cache\hub`. |
| Forecasting       | LIVE   | PatchTST Phase 1 — all 5 metrics (temp, humidity, ph, ec, co2). Checkpoints at `backend/models/patchtst_*.pth`. Scalers at `patchtst_scalers.json`. |
| Chatbot           | LIVE   | Mistral-7B at `D:\ollama\models`. Requires `OLLAMA_MODELS=D:\ollama\models` before `ollama serve`. RAG indexed (39 chunks). Graceful 503 on OOM.  |
| Recommendations   | LIVE   | Rule engine (always). LightGBM on synthetic data — 4 boosters at `lgbm_recommend_*.txt`. Activates on first real request.                         |

---

## Hardware

| Component | Spec                                                      |
| --------- | --------------------------------------------------------- |
| GPU       | NVIDIA GeForce RTX 3050 Laptop (4GB VRAM)                 |
| RAM       | 24GB                                                      |
| OS        | Windows 11                                                |
| Backend   | Python 3.14 + FastAPI, port 8000                          |
| PyTorch   | 2.11.0+cpu (no CUDA build for Python 3.14 yet)            |
| Ollama    | 0.23.1 — models at `D:\ollama\models`                     |

The PC acts as a server — all models run here while users access the app from their phones.

---

## Startup Sequence (after every PC boot)

```powershell
# 1. Start Ollama (env var is set permanently, so just run)
$env:OLLAMA_MODELS = "D:\ollama\models"   # failsafe — already a permanent user env var
ollama serve   # leave this running in a terminal

# 2. Start the backend server
cd D:\Haykel\growy\Growyy-V1\.worktrees\backend\backend
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

# 3. Verify everything is live
curl http://localhost:8000/health
# Expected: {"status":"ok","ollama":"connected","simulation":"2 engines running",...}
```

> **Note:** After a long training session (the initial overnight run), the Windows pagefile may be exhausted. If the server fails to start or Ollama crashes with "unable to allocate CPU buffer", **restart the PC** — this clears the pagefile and resolves the issue. Normal operation requires only ~7GB RAM total.

---

## Firestore Composite Indexes (deploy once)

The chatbot uses queries that require composite indexes. Deploy with Firebase CLI:

```bash
cd D:\Haykel\growy\Growyy-V1\.worktrees\backend
firebase deploy --only firestore:indexes
```

The `firestore.indexes.json` file in that directory defines the required indexes:
- `dosingLog`: userId (ASC) + timestamp (DESC)
- `notifications`: userId (ASC) + read (ASC) + timestamp (DESC)

Until deployed, the chatbot skips those context sections gracefully (no crash).

---

## AI Package Structure

```
backend/ai/
  registry.py             ← ModelRegistry: lazy-load on first request
  base.py                 ← BaseAIModel ABC
  disease/
    model.py              ← DeiT wrapper (HuggingFace Transformers, auto-downloads)
    classes.py            ← 39 class names + treatment map
  forecast/
    model.py              ← PatchTST wrapper (one per metric, falls back to linear)
    train.py              ← training script (phase 1 = synthetic, phase 2 = Firestore)
    patch_tst.py          ← PatchTST architecture
  chat/
    model.py              ← Ollama client + RAG pipeline
    rag.py                ← ChromaDB setup + retrieval
    knowledge/            ← curated .md greenhouse docs
  recommend/
    model.py              ← RuleEngine + LightGBM orchestrator
    rules.py              ← deterministic rule set
    train.py              ← LightGBM training script
```

---

## Module 1 — Disease Detection

**Model:** DeiT-Base (`rescu/deit-base-patch16-224-finetuned-plantvillage`) via HuggingFace Transformers
**Cache:** `D:\hf_cache\hub\models--rescu--deit-base-patch16-224-finetuned-plantvillage` (~330 MB)
**Classes:** 39 (PlantVillage 38 + `Background_without_leaves`)
**Endpoint:** `POST /disease/analyze`
**Accuracy:** 99.89% top-1 on PlantVillage test set
**Inference:** ~200ms on CPU
**Status:** Tested and confirmed working ✓

No training needed — model downloads and caches on first server start.

---

## Module 2 — Forecasting (PatchTST)

**Model:** PatchTST (IBM Research, ICLR 2023)
**Checkpoints:** `backend/models/patchtst_{metric}.pth` — 5 files: temp, humidity, ph, ec, co2
**Scalers:** `backend/models/patchtst_scalers.json`
**Input:** 1,008 readings (7 days × 144 ticks at 10-min resolution)
**Output:** 5 daily forecast values
**Endpoint:** `GET /forecast/{roomId}/{metric}` — valid metrics: temp, humidity, ph, ec, co2
**Fallback:** linear regression on daily averages (used if not enough history readings)

**To retrain after 30 days of real data:**
```bash
python -m ai.forecast.train --phase 2
```

---

## Module 3 — Chatbot (Mistral-7B + RAG)

**LLM:** `mistral:7b-instruct-v0.3-q4_K_M` via Ollama (~4.4GB model file)
**RAG:** ChromaDB at `backend/data/chroma/`, embedded with `all-MiniLM-L6-v2`
**Knowledge base:** `backend/ai/chat/knowledge/` — 4 .md files, 39 chunks indexed
**Endpoint:** `POST /chat`
**Error handling:** Returns HTTP 503 with JSON `{"detail": "LLM unavailable/error: ..."}` when Ollama is down or OOM

**To rebuild RAG index (if knowledge files change):**
```bash
python -m ai.chat.rag --build
```

---

## Module 4 — Recommendations

**Endpoint:** `POST /recommend/{roomId}`
**Frontend:** "Apply AI Recommendations" button in `rooms.$roomId.tsx` Setpoints tab

**Rule Engine** (always active, <1ms): pH up/down dosing, EC flush/dose, temp/humidity HVAC, VPD correction.

**LightGBM Optimizer** (active — trained on synthetic data):
- 4 boosters: temp, humidity, ph, ec
- Checkpoints: `backend/models/lgbm_recommend_{setpoint}.txt`
- Retrain every 14 days after 30d of real data: `python -m ai.recommend.train`

---

## Dependencies

`backend/requirements.txt` includes all AI deps:

```
transformers>=4.40.0    ← DeiT disease model
chromadb>=0.5.0         ← RAG vector store
sentence-transformers>=3.0.0  ← RAG embeddings
lightgbm>=4.3.0         ← recommendations
datasets>=2.19.0        ← training data
einops>=0.7.0           ← PatchTST
```

Ollama model (system-level): `mistral:7b-instruct-v0.3-q4_K_M`

---

## Retraining Schedule

| Model     | Trigger                          | Command                              |
| --------- | -------------------------------- | ------------------------------------ |
| PatchTST  | Every 14 days after 30d of data  | `python -m ai.forecast.train --phase 2` |
| LightGBM  | Every 14 days after 30d of data  | `python -m ai.recommend.train`       |
| DeiT      | Never (pre-trained, no retraining needed) | —                           |
| Mistral   | Never (quantized, served via Ollama) | —                               |

---

## Endpoint Summary

| Endpoint                          | Method | Purpose                                |
| --------------------------------- | ------ | -------------------------------------- |
| `GET /health`                     | GET    | Server + Ollama + simulation status    |
| `POST /disease/analyze`           | POST   | Image → top-3 disease predictions      |
| `GET /forecast/{roomId}/{metric}` | GET    | 5-day forecast for a metric            |
| `POST /recommend/{roomId}`        | POST   | Rule + LightGBM setpoint suggestions   |
| `POST /chat`                      | POST   | Mistral-7B chat with RAG context       |

---

_Last updated: 2026-05-06 14:30 — ALL MODELS LIVE. Startup sequence + Firestore indexes documented. Chat returns 503 (not 500) when Ollama is unavailable. Restart PC after overnight training to clear pagefile._
