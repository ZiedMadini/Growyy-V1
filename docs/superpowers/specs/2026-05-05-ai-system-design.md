# Growy AI System — Design Spec

**Date:** 2026-05-05
**Author:** AI Engineer (Claude)
**Status:** Approved

---

## Overview

Four AI modules integrated into the existing FastAPI backend with no external API dependencies. All inference runs locally on the host PC (RTX 3050, 24GB RAM). The modules share a common model registry and GPU memory manager housed in a new `backend/ai/` package.

---

## Hardware Target

| Component | Spec |
|---|---|
| GPU | NVIDIA GeForce RTX 3050 (~4–8GB VRAM) |
| RAM | 24GB system RAM |
| OS | Windows 11 |
| Inference runtime | PyTorch + CUDA via timm / transformers |

---

## Architecture

```
FastAPI (main.py)
  ├── routers/disease.py      → ai.registry.get("disease").predict(image)
  ├── routers/forecast.py     → ai.registry.get("forecast").predict(readings, metric)
  ├── routers/chat.py         → ai.registry.get("chat").respond(message, context)
  └── routers/recommend.py    → ai.registry.get("recommend").evaluate(room)

backend/ai/
  ├── registry.py             ← ModelRegistry: lazy-load, GPU memory manager
  ├── base.py                 ← BaseAIModel ABC (load, predict, unload)
  ├── disease/
  │   ├── model.py            ← EfficientNetV2S wrapper
  │   ├── train.py            ← fine-tuning script
  │   └── classes.py          ← 38 PlantVillage class names + treatment map
  ├── forecast/
  │   ├── model.py            ← PatchTST wrapper (one instance per metric)
  │   ├── train.py            ← training script (synthetic + Firestore data)
  │   └── patch_tst.py        ← PatchTST architecture implementation
  ├── chat/
  │   ├── model.py            ← Ollama client + RAG pipeline
  │   ├── rag.py              ← ChromaDB setup, embed + retrieve
  │   └── knowledge/          ← curated .md files: nutrition, diseases, VPD, schedules
  └── recommend/
      ├── model.py            ← RuleEngine + LightGBM orchestrator
      ├── rules.py            ← deterministic rule set
      └── train.py            ← LightGBM training script
```

### Model Registry

- Each model class extends `BaseAIModel` with `load()`, `predict()`, `unload()` methods
- Registry lazy-loads on first request, caches in memory
- GPU memory manager tracks VRAM usage; unloads least-recently-used model if budget exceeded
- Models declare their VRAM footprint in their class definition

---

## Module 1 — Disease Detection

**Model:** EfficientNet-V2-S (timm), fine-tuned on PlantVillage

| Property | Value |
|---|---|
| Architecture | `efficientnet_v2_s` via timm |
| Parameters | 21.5M |
| Classes | 38 (PlantVillage standard) |
| Expected accuracy | ~99% top-1 on PlantVillage test set |
| Inference latency | ~80ms on RTX 3050 GPU |
| Checkpoint path | `backend/models/efficientnet_v2s_plantvillage.pth` |

**Training pipeline (`ai/disease/train.py`):**
1. Download PlantVillage dataset from HuggingFace (`spMohanty/plantvillage_dataset`)
2. Split: 80% train / 10% val / 10% test
3. Augmentation: RandomResizedCrop(224), HorizontalFlip, ColorJitter, Mixup(alpha=0.2)
4. Optimizer: AdamW, lr=1e-4, weight_decay=1e-2
5. Schedule: cosine annealing with 2-epoch linear warm-up
6. Epochs: 20 (early stop on val loss, patience=5)
7. Save best checkpoint by val accuracy

**Endpoint:** `POST /disease/analyze` — unchanged response shape.

---

## Module 2 — Forecasting (PatchTST)

**Model:** PatchTST (IBM Research, ICLR 2023) — patches time series into fixed-length segments fed to a transformer encoder.

| Property | Value |
|---|---|
| Architecture | PatchTST (custom implementation) |
| Input | 1,008 readings (7 days × 144 ticks/day at 10-min resolution) |
| Patch size | 16 time steps |
| Output | 5 daily values (5-day forecast) |
| Metrics | 4 separate models: temp, humidity, ph, ec |
| Model size | ~2MB each |
| Inference latency | <20ms on CPU |

**Training pipeline (`ai/forecast/train.py`):**
1. **Phase 1 (cold start):** Generate synthetic training data by running the simulation engine for 90 days across 10 virtual rooms with varied configs. Creates ~1.3M data points.
2. **Phase 2 (real data):** After 30+ days of real Firestore readings, retrain on real data. Background job runs every 14 days.
3. Normalization: per-metric min-max scaling, scaler saved alongside checkpoint.
4. Loss: MSE on daily aggregated output.
5. Optimizer: Adam, lr=1e-3, batch=64, epochs=50.

**Endpoint:** `GET /forecast/{roomId}/{metric}` — unchanged response shape.

---

## Module 3 — Chatbot (Mistral-7B + RAG)

**LLM:** Mistral-7B-Instruct-v0.3 via Ollama (Q4_K_M quantization, ~4GB VRAM)

**RAG layer:**
- Vector store: ChromaDB (local, persistent at `backend/data/chroma/`)
- Embedding model: `sentence-transformers/all-MiniLM-L6-v2` (22MB, CPU)
- Knowledge base: curated `.md` files in `ai/chat/knowledge/` covering:
  - pH and EC target tables per grow stage (seedling, veg, flower, flush)
  - VPD charts and temperature/humidity interaction
  - Common plant diseases: symptoms, causes, treatments
  - Nutrient deficiency/toxicity visual guide
  - Dosing protocols and feeding schedules
  - Light schedules per stage (DLI, PPFD targets)
- Retrieval: top-3 most relevant chunks per query (cosine similarity)
- Chunk size: 400 tokens, 50-token overlap

**Per-request pipeline:**
1. Embed user message → retrieve top-3 knowledge chunks
2. Build system prompt = greenhouse persona + live Firestore context (rooms, tanks, dosing log, notifications) + retrieved chunks
3. Append conversation history (last 10 messages)
4. Send to Ollama `/api/chat` (Mistral-7B)
5. Stream response back

**Endpoint:** `POST /chat` — unchanged request/response shape.

**Ollama model:** `mistral:7b-instruct-v0.3-q4_K_M`

---

## Module 4 — Recommendations

**New endpoint:** `POST /recommend/{roomId}`

**Two-layer architecture:**

### Layer 1 — Rule Engine (reactive)

Deterministic rules firing in <1ms, always available regardless of training state.

| Condition | Action | Severity |
|---|---|---|
| pH > target_max + 0.2 | "Dose {X}ml pH Down" | warning |
| pH < target_min - 0.2 | "Dose {X}ml pH Up" | warning |
| EC < target_min - 0.3 | "Apply nutrient solution" | warning |
| EC > target_max + 0.3 | "Flush with plain water" | warning |
| temp > target_max + 2 | "Reduce room temperature" | critical |
| temp < target_min - 2 | "Increase room temperature" | critical |
| humidity > target_max + 5 | "Increase ventilation" | warning |
| vpd > 1.6 kPa | "Raise humidity or lower temp" | warning |
| vpd < 0.4 kPa | "Lower humidity or raise temp" | warning |

Dose volumes are calculated from tank capacity and standard dosing ratios stored in the recipe.

### Layer 2 — LightGBM Optimizer (proactive)

Activates after 30 days of room readings. Runs in the background alongside the rule engine.

**Features (per room):**
- 7-day rolling mean, std, trend slope per metric (temp, humidity, pH, EC, CO2, VPD)
- Room stage (encoded: seedling=0, veg=1, flower=2, flush=3)
- Day in grow / total days ratio
- Current setpoint centers per metric
- Time of day, light schedule phase

**Target:** delta adjustments to setpoint centers (continuous regression, one output per metric)

**Training:** `ai/recommend/train.py` — pulls readings from Firestore, engineers features, trains LightGBM with 5-fold CV. Runs as background task every 14 days.

**Response schema:**
```json
{
  "immediate": [
    {"metric": "ph", "action": "Dose 15ml pH Down", "severity": "warning", "current": 6.8, "target_max": 6.5}
  ],
  "optimizations": [
    {"setpoint": "temp", "current": [22.0, 26.0], "suggested": [23.0, 27.0], "confidence": 0.84, "reason": "7-day trend shows better VPD at +1°C"}
  ],
  "model_active": true,
  "generated_at": "2026-05-05T12:00:00Z"
}
```

**Frontend integration:** The "Apply AI Recommendations" button in `rooms.$roomId.tsx` calls `POST /recommend/{roomId}`, maps `optimizations` to setpoint deltas, and calls the existing `saveSetpoints()`.

---

## Training Order & Timeline

| Step | Task | Estimated Time | Prerequisite |
|---|---|---|---|
| 1 | Fine-tune EfficientNet-V2-S on PlantVillage | ~2h on RTX 3050 | Download dataset |
| 2 | Generate synthetic data + train PatchTST (Phase 1) | ~1h | — |
| 3 | Pull `mistral:7b-instruct-v0.3-q4_K_M` via Ollama | ~5min | Ollama installed |
| 4 | Build + embed RAG knowledge base | ~10min | ChromaDB installed |
| 5 | Rule engine: ship immediately | instant | — |
| 6 | Collect 30 days of real Firestore readings | 30 days | Simulation running |
| 7 | Train PatchTST Phase 2 + LightGBM first run | ~30min | Step 6 |

---

## Dependencies (additions to requirements.txt)

```
timm>=1.0.0           # already present
chromadb>=0.5.0
sentence-transformers>=3.0.0
lightgbm>=4.3.0
datasets>=2.19.0      # HuggingFace datasets (for PlantVillage download)
einops>=0.7.0         # PatchTST tensor ops
```

Ollama remains a system-level dependency (not pip). Model: `mistral:7b-instruct-v0.3-q4_K_M`.

---

## What Does NOT Change

- Frontend routes, components, or hooks — zero frontend changes for disease/forecast/chat
- Firestore data model — no new collections needed
- Existing endpoint URLs and response shapes
- Simulation engine

---

_Last updated: 2026-05-05_
