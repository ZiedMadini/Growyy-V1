# Growy Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Growy backend — Firebase project, FastAPI server, per-room sensor simulation, AI chat (Ollama), disease detection (EfficientNet-B0), and linear forecast endpoint.

**Architecture:** FastAPI server runs on the user's PC, exposed publicly via Cloudflare Tunnel. Firebase handles auth, real-time Firestore, and FCM push. The FastAPI server writes simulated sensor readings to Firestore every 10 minutes and serves all AI inference endpoints. No external AI APIs — everything runs locally.

**Tech Stack:** Python 3.11, FastAPI, firebase-admin SDK, Ollama (local LLM via HTTP), timm + PyTorch CPU (EfficientNet-B0), numpy (linear forecast), pytest + pytest-asyncio.

---

## File Map

```
backend/
  requirements.txt          — all Python dependencies
  .env.example              — env var template
  .env                      — local secrets (gitignored)
  main.py                   — FastAPI app, startup/shutdown, mounts routers
  config.py                 — reads .env into Settings dataclass
  firebase_client.py        — initialises firebase-admin, exports db + messaging
  simulation/
    __init__.py
    physics.py              — pure functions: simulate_tick, compute_vpd, compute_status, is_light_on
    engine.py               — SimulationEngine: asyncio task per room
    manager.py              — SimulationManager: watches Firestore, spawns/stops engines
  routers/
    __init__.py
    chat.py                 — POST /chat
    disease.py              — POST /disease/analyze
    forecast.py             — GET /forecast/{room_id}/{metric}
  models/
    __init__.py
    disease_model.py        — EfficientNet-B0 loader + inference wrapper
    forecast_model.py       — linear_forecast() function
  tests/
    __init__.py
    conftest.py             — shared fixtures
    test_physics.py         — unit tests for simulation/physics.py
    test_forecast.py        — unit tests for models/forecast_model.py
    test_chat.py            — unit tests for chat context builder
    test_disease.py         — unit test for disease model inference
    test_health.py          — integration test for GET /health
```

Frontend additions (done in a follow-up plan — Frontend Integration):

```
src/lib/firebase.ts         — Firebase SDK init
src/lib/auth.ts             — signIn / signOut helpers
src/contexts/AuthContext.tsx
src/hooks/useRooms.ts       — real-time rooms listener
src/hooks/useTanks.ts
src/hooks/useNotifications.ts
src/routes/login.tsx        — login screen
```

---

## Task 1: Project scaffold and dependencies

**Files:**

- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/__init__.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
firebase-admin==6.5.0
python-dotenv==1.0.1
pydantic-settings==2.3.0
httpx==0.27.0
python-multipart==0.0.9
Pillow==10.4.0
timm==1.0.3
torch==2.3.1
torchvision==0.18.1
numpy==1.26.4
pytest==8.2.0
pytest-asyncio==0.23.7
```

> **Note on PyTorch:** Install CPU-only build to avoid a 2 GB download.
> Run: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`
> Then install the rest: `pip install -r requirements.txt`

- [ ] **Step 2: Create `backend/.env.example`**

```
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
DISEASE_MODEL_PATH=./models/efficientnet_plantvillage.pth
SIMULATION_INTERVAL_SECONDS=600
```

- [ ] **Step 3: Create `backend/__init__.py`** (empty file)

- [ ] **Step 4: Create Python virtual environment and install dependencies**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Expected: no errors, all packages installed.

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/.env.example backend/__init__.py
git commit -m "feat(backend): scaffold Python project with dependencies"
```

---

## Task 2: Config and Firebase admin init

**Files:**

- Create: `backend/config.py`
- Create: `backend/firebase_client.py`

- [ ] **Step 1: Add `backend/.env` to `.gitignore`**

Append to `.gitignore` in the repo root:

```
backend/.env
backend/serviceAccountKey.json
backend/.venv/
backend/__pycache__/
backend/**/__pycache__/
```

- [ ] **Step 2: Create `backend/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    firebase_credentials_path: str = "./serviceAccountKey.json"
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    disease_model_path: str = "./models/efficientnet_plantvillage.pth"
    simulation_interval_seconds: int = 600

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 3: Set up Firebase project**

1. Go to https://console.firebase.google.com → create project `growy-mvp`
2. Enable **Firestore** (production mode, nearest region)
3. Enable **Authentication** → Email/Password provider
4. Enable **Storage** (default bucket)
5. Enable **Cloud Messaging** (FCM)
6. Project Settings → Service accounts → Generate new private key
7. Save the JSON as `backend/serviceAccountKey.json`

- [ ] **Step 4: Create `backend/firebase_client.py`**

```python
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from config import settings

_app = None


def get_firebase_app():
    global _app
    if _app is None:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        _app = firebase_admin.initialize_app(cred)
    return _app


def get_db():
    get_firebase_app()
    return firestore.client()


def send_push(token: str, title: str, body: str) -> None:
    get_firebase_app()
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=token,
    )
    messaging.send(message)
```

- [ ] **Step 5: Verify Firebase connection**

Create `backend/check_firebase.py`:

```python
from firebase_client import get_db
db = get_db()
print("Firestore connected:", db.project)
```

Run: `python check_firebase.py`
Expected: `Firestore connected: growy-mvp`

Delete `check_firebase.py` after verifying.

- [ ] **Step 6: Commit**

```bash
git add backend/config.py backend/firebase_client.py .gitignore
git commit -m "feat(backend): config and Firebase admin client"
```

---

## Task 3: FastAPI app entry point and health endpoint

**Files:**

- Create: `backend/main.py`
- Create: `backend/routers/__init__.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: Create `backend/routers/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/tests/__init__.py`** (empty)

- [ ] **Step 3: Write failing test — `backend/tests/test_health.py`**

```python
from fastapi.testclient import TestClient
import pytest


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ollama" in data
    assert "simulation" in data
```

- [ ] **Step 4: Run to verify it fails**

```bash
cd backend
pytest tests/test_health.py -v
```

Expected: ImportError — `main` does not exist yet.

- [ ] **Step 5: Create `backend/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Growy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_host}/api/tags")
            ollama_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "status": "ok",
        "ollama": "connected" if ollama_ok else "unavailable",
        "simulation": "idle",
    }
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pytest tests/test_health.py -v
```

Expected: `PASSED`

- [ ] **Step 7: Commit**

```bash
git add backend/main.py backend/routers/__init__.py backend/tests/__init__.py backend/tests/test_health.py
git commit -m "feat(backend): FastAPI app with health endpoint"
```

---

## Task 4: Simulation physics — pure functions

**Files:**

- Create: `backend/simulation/__init__.py`
- Create: `backend/simulation/physics.py`
- Create: `backend/tests/test_physics.py`

- [ ] **Step 1: Create `backend/simulation/__init__.py`** (empty)

- [ ] **Step 2: Write failing tests — `backend/tests/test_physics.py`**

```python
from simulation.physics import compute_vpd, compute_status, is_light_on, simulate_tick


def test_compute_vpd_warm_humid():
    vpd = compute_vpd(25.0, 60.0)
    assert 1.2 <= vpd <= 1.35


def test_compute_vpd_cool_dry():
    vpd = compute_vpd(20.0, 40.0)
    assert 1.3 <= vpd <= 1.5


def test_compute_status_healthy():
    metrics = {"temp": 24.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "healthy"


def test_compute_status_warning():
    metrics = {"temp": 26.5, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "warning"


def test_compute_status_critical():
    metrics = {"temp": 32.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    assert compute_status(metrics, targets) == "critical"


def test_is_light_on_daytime():
    assert is_light_on({"onHour": 6, "offHour": 20}, current_hour=12.0) is True


def test_is_light_on_night():
    assert is_light_on({"onHour": 6, "offHour": 20}, current_hour=22.0) is False


def test_simulate_tick_returns_all_metrics():
    current = {"temp": 24.0, "humidity": 65.0, "ph": 6.0, "ec": 1.8, "co2": 900, "vpd": 1.2}
    config = {"baseTemp": 24.0, "baseHumidity": 65.0, "phDriftRate": 0.01, "ecDecayRate": 0.005}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    result = simulate_tick(current, config, targets, light_on=True)
    for key in ["temp", "humidity", "ph", "ec", "co2", "vpd"]:
        assert key in result
        assert isinstance(result[key], float)


def test_simulate_tick_ph_drifts():
    import random
    random.seed(42)
    current = {"temp": 24.0, "humidity": 65.0, "ph": 5.9, "ec": 1.8, "co2": 900, "vpd": 1.2}
    config = {"baseTemp": 24.0, "baseHumidity": 65.0, "phDriftRate": 0.06, "ecDecayRate": 0.005}
    targets = {"temp": [22, 26], "humidity": [60, 70], "ph": [5.8, 6.2], "ec": [1.4, 2.2], "co2": [800, 1200]}
    result = simulate_tick(current, config, targets, light_on=False)
    assert result["ph"] > current["ph"] - 0.05
```

- [ ] **Step 3: Run to verify tests fail**

```bash
pytest tests/test_physics.py -v
```

Expected: ImportError.

- [ ] **Step 4: Create `backend/simulation/physics.py`**

```python
import math
import random
from datetime import datetime
from typing import Optional


def compute_vpd(temp: float, humidity: float) -> float:
    svp = 0.6108 * math.exp(17.27 * temp / (temp + 237.3))
    return round(svp * (1.0 - humidity / 100.0), 2)


def compute_status(metrics: dict, targets: dict) -> str:
    critical = 0
    warning = 0
    for key in ["temp", "humidity", "ph", "ec", "co2"]:
        if key not in targets or key not in metrics:
            continue
        val = float(metrics[key])
        lo, hi = float(targets[key][0]), float(targets[key][1])
        margin = (hi - lo) * 0.10
        if val < lo - margin or val > hi + margin:
            critical += 1
        elif val < lo or val > hi:
            warning += 1
    if critical > 0:
        return "critical"
    if warning > 0:
        return "warning"
    return "healthy"


def is_light_on(light_schedule: dict, current_hour: Optional[float] = None) -> bool:
    if current_hour is None:
        now = datetime.now()
        current_hour = now.hour + now.minute / 60.0
    on = float(light_schedule["onHour"])
    off = float(light_schedule["offHour"])
    if on < off:
        return on <= current_hour < off
    return current_hour >= on or current_hour < off


def simulate_tick(current: dict, config: dict, targets: dict, light_on: bool) -> dict:
    base_temp = float(config.get("baseTemp", 24.0))
    base_humidity = float(config.get("baseHumidity", 65.0))
    ph_drift_rate = float(config.get("phDriftRate", 0.01))
    ec_decay_rate = float(config.get("ecDecayRate", 0.005))
    tick_hours = 10.0 / 60.0

    temp_target = base_temp + (2.0 if light_on else -2.0)
    new_temp = current["temp"] + 0.2 * (temp_target - current["temp"]) + random.gauss(0, 0.3)

    humidity_effect = -0.5 * (new_temp - base_temp)
    humidity_target = base_humidity + humidity_effect
    new_humidity = current["humidity"] + 0.15 * (humidity_target - current["humidity"]) + random.gauss(0, 1.0)
    new_humidity = max(20.0, min(95.0, new_humidity))

    ph_centre = (float(targets["ph"][0]) + float(targets["ph"][1])) / 2.0
    drift = ph_drift_rate * tick_hours
    if current["ph"] > ph_centre:
        drift *= 0.3
    new_ph = current["ph"] + drift + random.gauss(0, 0.02)

    new_ec = current["ec"] - ec_decay_rate * tick_hours + random.gauss(0, 0.02)
    if random.random() < 0.02:
        ec_centre = (float(targets["ec"][0]) + float(targets["ec"][1])) / 2.0
        new_ec = ec_centre + random.gauss(0, 0.1)

    co2_target = (float(targets["co2"][0]) + float(targets["co2"][1])) / 2.0 if light_on else 400.0
    new_co2 = current["co2"] + 0.1 * (co2_target - current["co2"]) + random.gauss(0, 15.0)
    new_co2 = max(350.0, min(2000.0, new_co2))

    new_vpd = compute_vpd(new_temp, new_humidity)

    return {
        "temp": round(new_temp, 1),
        "humidity": round(new_humidity, 1),
        "ph": round(new_ph, 2),
        "ec": round(new_ec, 2),
        "co2": round(new_co2, 0),
        "vpd": new_vpd,
    }
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_physics.py -v
```

Expected: all 8 `PASSED`.

- [ ] **Step 6: Commit**

```bash
git add backend/simulation/__init__.py backend/simulation/physics.py backend/tests/test_physics.py
git commit -m "feat(backend): simulation physics with tests"
```

---

## Task 5: SimulationEngine — asyncio task per room

**Files:**

- Create: `backend/simulation/engine.py`

- [ ] **Step 1: Create `backend/simulation/engine.py`**

```python
import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from simulation.physics import simulate_tick, compute_status, is_light_on
from config import settings

logger = logging.getLogger(__name__)


class SimulationEngine:
    def __init__(self, room_id: str, db):
        self.room_id = room_id
        self.db = db
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._running = True
            self._task = asyncio.create_task(self._loop(), name=f"sim-{self.room_id}")
            logger.info("Started simulation for room %s", self.room_id)

    def stop(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()

    async def _loop(self) -> None:
        while self._running:
            try:
                await self._tick()
            except Exception as exc:
                logger.exception("Tick error room %s: %s", self.room_id, exc)
            await asyncio.sleep(settings.simulation_interval_seconds)

    async def _tick(self) -> None:
        room_ref = self.db.collection("rooms").document(self.room_id)
        snap = await room_ref.get()
        if not snap.exists:
            self.stop()
            return

        room = snap.to_dict()
        current = room.get("currentMetrics", {})
        config = room.get("simulationConfig", {})
        targets = room.get("targets", {})
        light_schedule = room.get("lightSchedule", {"onHour": 6, "offHour": 20})

        if not current or not targets:
            return

        light_on = is_light_on(light_schedule)
        new_metrics = simulate_tick(current, config, targets, light_on)
        new_status = compute_status(new_metrics, targets)
        now = datetime.now(timezone.utc)

        await room_ref.collection("readings").add({**new_metrics, "timestamp": now})
        await room_ref.update({"currentMetrics": new_metrics, "status": new_status, "updatedAt": now})

        if new_status != "healthy":
            await self._write_alert(room, new_metrics, targets, new_status, now)

        if random.random() < 0.01:
            await self._purge_old_readings(room_ref, now)

    async def _write_alert(self, room, metrics, targets, status, now):
        user_id = room.get("userId")
        room_name = room.get("name", self.room_id)
        title = f"{room_name}: {status}"
        unit_map = {"temp": "°C", "humidity": "%", "ph": "", "ec": " mS", "co2": " ppm"}
        for key in ["temp", "humidity", "ph", "ec", "co2"]:
            if key not in targets or key not in metrics:
                continue
            val = float(metrics[key])
            lo, hi = float(targets[key][0]), float(targets[key][1])
            if val < lo or val > hi:
                title = f"{key.upper()} out of range in {room_name}: {val}{unit_map.get(key, '')}"
                break

        await self.db.collection("notifications").add({
            "userId": user_id,
            "roomId": self.room_id,
            "title": title,
            "severity": status,
            "read": False,
            "timestamp": now,
        })
        room_ref = self.db.collection("rooms").document(self.room_id)
        await room_ref.collection("events").add({"type": "alert", "text": title, "timestamp": now})

    async def _purge_old_readings(self, room_ref, now):
        cutoff = now - timedelta(days=30)
        async for doc in room_ref.collection("readings").where("timestamp", "<", cutoff).limit(100).stream():
            await doc.reference.delete()
```

- [ ] **Step 2: Verify import**

```bash
python -c "from simulation.engine import SimulationEngine; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/simulation/engine.py
git commit -m "feat(backend): SimulationEngine asyncio task"
```

---

## Task 6: SimulationManager

**Files:**

- Create: `backend/simulation/manager.py`

- [ ] **Step 1: Create `backend/simulation/manager.py`**

```python
import logging
from typing import Dict

from simulation.engine import SimulationEngine

logger = logging.getLogger(__name__)


class SimulationManager:
    def __init__(self, db):
        self.db = db
        self._engines: Dict[str, SimulationEngine] = {}
        self._watch = None

    async def start(self) -> None:
        rooms = self.db.collection("rooms").stream()
        async for room_doc in rooms:
            self._spawn(room_doc.id)
        logger.info("SimulationManager: %d engines started", len(self._engines))
        self._watch = self.db.collection("rooms").on_snapshot(self._on_snapshot)

    def stop(self) -> None:
        if self._watch:
            self._watch.unsubscribe()
        for engine in self._engines.values():
            engine.stop()
        self._engines.clear()

    def _spawn(self, room_id: str) -> None:
        if room_id not in self._engines:
            engine = SimulationEngine(room_id=room_id, db=self.db)
            engine.start()
            self._engines[room_id] = engine

    def _on_snapshot(self, snapshots, changes, read_time) -> None:
        for change in changes:
            room_id = change.document.id
            if change.type.name == "ADDED":
                self._spawn(room_id)
            elif change.type.name == "REMOVED":
                if room_id in self._engines:
                    self._engines[room_id].stop()
                    del self._engines[room_id]

    @property
    def active_count(self) -> int:
        return len(self._engines)
```

- [ ] **Step 2: Verify import**

```bash
python -c "from simulation.manager import SimulationManager; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/simulation/manager.py
git commit -m "feat(backend): SimulationManager spawns engines per room"
```

---

## Task 7: Wire simulation into FastAPI startup

**Files:**

- Modify: `backend/main.py`

- [ ] **Step 1: Replace `backend/main.py` with the following**

```python
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from config import settings
from firebase_client import get_db
from simulation.manager import SimulationManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_manager: SimulationManager | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _manager
    db = get_db()
    _manager = SimulationManager(db)
    await _manager.start()
    logger.info("Simulation started: %d engines", _manager.active_count)
    yield
    if _manager:
        _manager.stop()


app = FastAPI(title="Growy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_host}/api/tags")
            ollama_ok = resp.status_code == 200
    except Exception:
        pass
    active = _manager.active_count if _manager else 0
    return {
        "status": "ok",
        "ollama": "connected" if ollama_ok else "unavailable",
        "simulation": f"{active} engines running",
    }
```

- [ ] **Step 2: Seed a room in Firestore console and start the server**

In the Firebase console, Firestore → create collection `rooms` → add document:

```json
{
  "userId": "YOUR_FIREBASE_UID",
  "name": "Veg Room A",
  "stage": "Vegetative",
  "day": 18,
  "totalDays": 28,
  "status": "healthy",
  "currentMetrics": { "temp": 24.2, "humidity": 65, "ph": 5.9, "ec": 1.6, "co2": 820, "vpd": 1.0 },
  "targets": {
    "temp": [22, 26],
    "humidity": [60, 70],
    "ph": [5.8, 6.2],
    "ec": [1.4, 1.8],
    "co2": [800, 1000]
  },
  "lightSchedule": { "onHour": 6, "offHour": 20, "curve": [] },
  "irrigation": { "intervalHours": 4, "durationMin": 2 },
  "simulationConfig": {
    "baseTemp": 24.0,
    "baseHumidity": 65.0,
    "phDriftRate": 0.01,
    "ecDecayRate": 0.005
  }
}
```

Then set `SIMULATION_INTERVAL_SECONDS=30` in `.env` for quick testing. Run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check http://localhost:8000/health → `{"simulation": "1 engines running"}`

After 30 seconds, verify in Firestore console that `rooms/{roomId}/readings` has a new document.

- [ ] **Step 3: Restore `SIMULATION_INTERVAL_SECONDS=600` in `.env` after testing**

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat(backend): wire SimulationManager into FastAPI lifespan"
```

---

## Task 8: Forecast endpoint

**Files:**

- Create: `backend/models/__init__.py`
- Create: `backend/models/forecast_model.py`
- Create: `backend/routers/forecast.py`
- Create: `backend/tests/test_forecast.py`

- [ ] **Step 1: Create `backend/models/__init__.py`** (empty)

- [ ] **Step 2: Write failing tests — `backend/tests/test_forecast.py`**

```python
from models.forecast_model import linear_forecast


def test_forecast_returns_five_values():
    result = linear_forecast([24.0, 24.2, 24.5, 24.3, 24.8, 24.6, 24.9], days=5)
    assert len(result) == 5


def test_forecast_values_are_floats():
    result = linear_forecast([6.0, 6.0, 5.95, 6.1, 6.0, 5.95, 5.9])
    assert all(isinstance(v, float) for v in result)


def test_forecast_upward_trend():
    result = linear_forecast([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0], days=3)
    assert result[0] > 7.0
    assert result[1] > result[0]


def test_forecast_single_value():
    result = linear_forecast([24.0], days=5)
    assert len(result) == 5
    assert all(v == 24.0 for v in result)
```

- [ ] **Step 3: Run to verify tests fail**

```bash
pytest tests/test_forecast.py -v
```

Expected: ImportError.

- [ ] **Step 4: Create `backend/models/forecast_model.py`**

```python
import numpy as np
from typing import List


def linear_forecast(history: List[float], days: int = 5) -> List[float]:
    if len(history) < 2:
        return [float(history[0])] * days

    x = np.arange(len(history), dtype=float)
    y = np.array(history, dtype=float)
    n = float(len(x))
    m = (n * float(np.sum(x * y)) - float(np.sum(x)) * float(np.sum(y))) / (
        n * float(np.sum(x ** 2)) - float(np.sum(x)) ** 2
    )
    b = (float(np.sum(y)) - m * float(np.sum(x))) / n
    last_x = float(x[-1])
    return [round(float(m * (last_x + i + 1) + b), 2) for i in range(days)]
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_forecast.py -v
```

Expected: all 4 `PASSED`.

- [ ] **Step 6: Create `backend/routers/forecast.py`**

```python
from fastapi import APIRouter, HTTPException
from firebase_client import get_db
from models.forecast_model import linear_forecast

router = APIRouter(prefix="/forecast", tags=["forecast"])
VALID_METRICS = {"temp", "humidity", "ph", "ec", "co2"}


@router.get("/{room_id}/{metric}")
async def get_forecast(room_id: str, metric: str):
    if metric not in VALID_METRICS:
        raise HTTPException(400, detail=f"metric must be one of {VALID_METRICS}")

    db = get_db()
    docs = (
        db.collection("rooms").document(room_id)
        .collection("readings")
        .order_by("timestamp", direction="DESCENDING")
        .limit(1008)
        .stream()
    )

    values = []
    async for doc in docs:
        d = doc.to_dict()
        if metric in d:
            values.append(float(d[metric]))

    if len(values) < 2:
        raise HTTPException(404, detail="Not enough readings to forecast")

    values.reverse()

    chunk = 144
    daily = [
        round(sum(values[i:i+chunk]) / len(values[i:i+chunk]), 2)
        for i in range(0, len(values), chunk)
    ]

    return {
        "roomId": room_id,
        "metric": metric,
        "history": daily[-7:],
        "forecast": linear_forecast(daily, days=5),
    }
```

- [ ] **Step 7: Register router in `main.py`**

Add after the existing imports in `backend/main.py`:

```python
from routers import forecast
app.include_router(forecast.router)
```

- [ ] **Step 8: Test the endpoint manually**

```bash
curl http://localhost:8000/forecast/ROOM_ID/temp
```

Expected: JSON with `history` and `forecast` arrays.

- [ ] **Step 9: Commit**

```bash
git add backend/models/__init__.py backend/models/forecast_model.py backend/routers/forecast.py backend/tests/test_forecast.py backend/main.py
git commit -m "feat(backend): linear forecast endpoint"
```

---

## Task 9: Chat endpoint

**Files:**

- Create: `backend/routers/chat.py`
- Create: `backend/tests/test_chat.py`

- [ ] **Step 1: Install and run Ollama**

Download: https://ollama.com/download

```bash
ollama serve
ollama pull llama3.2:3b
```

Verify: `curl http://localhost:11434/api/tags` → JSON list including `llama3.2:3b`.

- [ ] **Step 2: Write test — `backend/tests/test_chat.py`**

```python
from models.forecast_model import linear_forecast


def test_chat_module_imports():
    from routers.chat import build_grow_context
    assert callable(build_grow_context)
```

- [ ] **Step 3: Create `backend/routers/chat.py`**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from datetime import datetime, timezone

from config import settings
from firebase_client import get_db

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    userId: str
    message: str
    sessionId: str | None = None


async def build_grow_context(user_id: str) -> str:
    db = get_db()
    lines = [
        "You are Growy, an expert hydroponics AI assistant. "
        "Answer questions based on the live grow data below. "
        "Be specific, concise, and actionable.\n"
    ]

    async for room_doc in db.collection("rooms").where("userId", "==", user_id).stream():
        r = room_doc.to_dict()
        m = r.get("currentMetrics", {})
        t = r.get("targets", {})
        lines.append(
            f"Room '{r.get('name')}': {r.get('stage')}, "
            f"day {r.get('day')}/{r.get('totalDays')}, status={r.get('status')}"
        )
        lines.append(
            f"  Metrics: temp={m.get('temp')}C hum={m.get('humidity')}% "
            f"pH={m.get('ph')} EC={m.get('ec')}mS CO2={m.get('co2')}ppm VPD={m.get('vpd')}kPa"
        )
        lines.append(f"  Targets: temp={t.get('temp')} pH={t.get('ph')} EC={t.get('ec')}")

    tank_parts = []
    async for tank_doc in db.collection("tanks").where("userId", "==", user_id).stream():
        t = tank_doc.to_dict()
        tank_parts.append(f"{t.get('name')} {t.get('level')}%")
    if tank_parts:
        lines.append(f"Tanks: {', '.join(tank_parts)}")

    dosing_lines = []
    async for log_doc in (
        db.collection("dosingLog")
        .where("userId", "==", user_id)
        .order_by("timestamp", direction="DESCENDING")
        .limit(5)
        .stream()
    ):
        l = log_doc.to_dict()
        dosing_lines.append(f"  {l.get('recipeName')} applied in {l.get('roomName')}")
    if dosing_lines:
        lines.append("Recent dosing:\n" + "\n".join(dosing_lines))

    alert_lines = []
    async for notif_doc in (
        db.collection("notifications")
        .where("userId", "==", user_id)
        .where("read", "==", False)
        .order_by("timestamp", direction="DESCENDING")
        .limit(5)
        .stream()
    ):
        n = notif_doc.to_dict()
        alert_lines.append(f"  [{n.get('severity', '').upper()}] {n.get('title')}")
    if alert_lines:
        lines.append("Active alerts:\n" + "\n".join(alert_lines))

    return "\n".join(lines)


@router.post("")
async def chat(req: ChatRequest):
    db = get_db()
    now = datetime.now(timezone.utc)

    history = []
    session_ref = None
    if req.sessionId:
        session_ref = db.collection("chatSessions").document(req.sessionId)
        snap = await session_ref.get()
        if snap.exists:
            history = snap.to_dict().get("messages", [])

    system_prompt = await build_grow_context(req.userId)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        role = "assistant" if msg["role"] == "ai" else msg["role"]
        messages.append({"role": role, "content": msg["text"]})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.ollama_host}/api/chat",
                json={"model": settings.ollama_model, "messages": messages, "stream": False},
            )
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {exc}")

    ai_text = resp.json()["message"]["content"]

    user_msg = {"id": f"u{int(now.timestamp()*1000)}", "role": "user", "text": req.message, "timestamp": now}
    ai_msg = {"id": f"a{int(now.timestamp()*1000)+1}", "role": "ai", "text": ai_text, "timestamp": now}
    new_messages = (history + [user_msg, ai_msg])[-50:]

    if session_ref is None:
        session_ref = db.collection("chatSessions").document()

    await session_ref.set({"userId": req.userId, "messages": new_messages, "updatedAt": now}, merge=True)

    return {"sessionId": session_ref.id, "reply": ai_text}
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_chat.py -v
```

Expected: `PASSED`

- [ ] **Step 5: Register router in `main.py`**

```python
from routers import chat, disease, forecast
app.include_router(chat.router)
```

- [ ] **Step 6: Manual smoke test**

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"YOUR_UID\", \"message\": \"How is Veg Room A doing?\"}"
```

Expected: JSON with `sessionId` and `reply` with a contextual answer.

- [ ] **Step 7: Commit**

```bash
git add backend/routers/chat.py backend/tests/test_chat.py backend/main.py
git commit -m "feat(backend): chat endpoint with Ollama and grow context"
```

---

## Task 10: Disease detection endpoint

**Files:**

- Create: `backend/models/disease_model.py`
- Create: `backend/routers/disease.py`
- Create: `backend/tests/test_disease.py`
- Create: `backend/models/download_model.py` (one-time script)

- [ ] **Step 1: Create and run `backend/models/download_model.py`**

```python
import torch
import timm
import os

os.makedirs("models", exist_ok=True)
model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=38)
torch.save(model.state_dict(), "models/efficientnet_plantvillage.pth")
print("Saved to models/efficientnet_plantvillage.pth")
```

```bash
python models/download_model.py
```

Expected: `Saved to models/efficientnet_plantvillage.pth`

> **Note:** These are ImageNet pretrained weights as an MVP placeholder.
> For accurate disease detection, replace with a checkpoint fine-tuned on PlantVillage data.
> This is the ML phase that follows the backend phase.

- [ ] **Step 2: Write failing test — `backend/tests/test_disease.py`**

```python
from PIL import Image
import io


def _make_image() -> bytes:
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_disease_model_top3():
    from models.disease_model import DiseaseModel
    model = DiseaseModel()
    results = model.predict(_make_image())
    assert len(results) == 3
    for r in results:
        assert "disease" in r
        assert "confidence" in r
        assert 0.0 <= r["confidence"] <= 1.0


def test_disease_model_confidence_plausible():
    from models.disease_model import DiseaseModel
    model = DiseaseModel()
    results = model.predict(_make_image())
    total = sum(r["confidence"] for r in results)
    assert total >= 0.3
```

- [ ] **Step 3: Run to verify tests fail**

```bash
pytest tests/test_disease.py -v
```

Expected: ImportError.

- [ ] **Step 4: Create `backend/models/disease_model.py`**

```python
import io
from typing import List, Dict
import torch
import timm
from PIL import Image
from torchvision import transforms
from config import settings

DISEASE_LABELS = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca", "Grape___Leaf_blight", "Grape___healthy",
    "Orange___Haunglongbing", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper___Bacterial_spot", "Pepper___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Yellow_Leaf_Curl_Virus", "Tomato___mosaic_virus", "Tomato___healthy",
]

TREATMENTS: Dict[str, List[str]] = {
    "Powdery_mildew": [
        "Reduce humidity below 55%",
        "Increase airflow with circulation fans",
        "Apply potassium bicarbonate spray",
        "Remove and dispose of affected leaves",
    ],
    "Early_blight": [
        "Remove infected lower leaves",
        "Apply copper-based fungicide",
        "Improve air circulation",
        "Avoid overhead watering",
    ],
    "Late_blight": [
        "Remove and destroy infected tissue immediately",
        "Apply mancozeb fungicide",
        "Reduce leaf wetness",
        "Increase plant spacing",
    ],
    "Bacterial_spot": [
        "Apply copper bactericide",
        "Avoid wetting foliage",
        "Remove infected leaves",
        "Disinfect all tools between plants",
    ],
    "healthy": [
        "No disease detected",
        "Continue current grow schedule",
    ],
}

_PREPROCESS = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class DiseaseModel:
    def __init__(self):
        self._model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=38)
        try:
            state = torch.load(settings.disease_model_path, map_location="cpu")
            self._model.load_state_dict(state)
        except FileNotFoundError:
            pass
        self._model.eval()

    def predict(self, image_bytes: bytes) -> List[Dict]:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _PREPROCESS(img).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self._model(tensor), dim=1)[0]
        top3 = torch.topk(probs, 3)
        results = []
        for score, idx in zip(top3.values.tolist(), top3.indices.tolist()):
            label = DISEASE_LABELS[idx]
            display = label.split("___")[-1].replace("_", " ")
            key = next((k for k in TREATMENTS if k in label), "healthy")
            results.append({"disease": display, "confidence": round(score, 3), "treatments": TREATMENTS[key]})
        return results


_instance: DiseaseModel | None = None


def get_disease_model() -> DiseaseModel:
    global _instance
    if _instance is None:
        _instance = DiseaseModel()
    return _instance
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_disease.py -v
```

Expected: both `PASSED`.

- [ ] **Step 6: Create `backend/routers/disease.py`**

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.disease_model import get_disease_model

router = APIRouter(prefix="/disease", tags=["disease"])


@router.post("/analyze")
async def analyze_disease(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, detail="File must be an image (jpeg/png)")

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, detail="Image too large — max 10 MB")

    results = get_disease_model().predict(image_bytes)
    return {"topPrediction": results[0], "alternatives": results[1:]}
```

- [ ] **Step 7: Register router in `main.py`**

```python
from routers import chat, disease, forecast
app.include_router(disease.router)
```

- [ ] **Step 8: Manual smoke test**

```bash
curl -X POST http://localhost:8000/disease/analyze \
  -F "image=@path/to/leaf.jpg"
```

Expected: `{"topPrediction": {"disease": "...", "confidence": ..., "treatments": [...]}, "alternatives": [...]}`

- [ ] **Step 9: Commit**

```bash
git add backend/models/disease_model.py backend/routers/disease.py backend/tests/test_disease.py backend/main.py
git commit -m "feat(backend): disease detection with EfficientNet-B0"
```

---

## Task 11: Firestore security rules

**Files:**

- Create: `firestore.rules`

- [ ] **Step 1: Create `firestore.rules` in the repo root**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /rooms/{roomId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;

      match /readings/{readingId} {
        allow read: if request.auth != null
          && request.auth.uid ==
            get(/databases/$(database)/documents/rooms/$(roomId)).data.userId;
        allow write: if false;
      }

      match /events/{eventId} {
        allow read: if request.auth != null
          && request.auth.uid ==
            get(/databases/$(database)/documents/rooms/$(roomId)).data.userId;
        allow write: if false;
      }

      match /devices/{deviceId} {
        allow read, write: if request.auth != null
          && request.auth.uid ==
            get(/databases/$(database)/documents/rooms/$(roomId)).data.userId;
      }

      match /sensors/{sensorId} {
        allow read, write: if request.auth != null
          && request.auth.uid ==
            get(/databases/$(database)/documents/rooms/$(roomId)).data.userId;
      }
    }

    match /tanks/{tankId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /recipes/{recipeId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /dosingLog/{logId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /notifications/{notifId} {
      allow read: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create, delete: if false;
    }

    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

- [ ] **Step 2: Deploy rules**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(backend): Firestore security rules"
```

---

## Task 12: Cloudflare Tunnel for public HTTPS

- [ ] **Step 1: Install cloudflared on Windows**

```powershell
winget install --id Cloudflare.cloudflared
```

- [ ] **Step 2: Authenticate**

```bash
cloudflared tunnel login
```

Browser opens — authorise with your Cloudflare account (free tier).

- [ ] **Step 3: Start the tunnel**

```bash
cloudflared tunnel --url http://localhost:8000
```

Copy the generated URL (e.g. `https://xxxxx.trycloudflare.com`).

- [ ] **Step 4: Set VITE_API_URL in frontend**

Create or update `.env.local` in the repo root:

```
VITE_API_URL=https://xxxxx.trycloudflare.com
```

- [ ] **Step 5: Verify from a phone on mobile data**

Open on phone: `https://xxxxx.trycloudflare.com/health`
Expected: `{"status":"ok","ollama":"connected","simulation":"N engines running"}`

- [ ] **Step 6: Commit**

```bash
git add .env.example
git commit -m "docs: add VITE_API_URL to .env.example"
```

---

## Task 13: Full test suite and final smoke test

- [ ] **Step 1: Run complete test suite**

```bash
cd backend
pytest tests/ -v
```

Expected: all tests in `test_physics`, `test_forecast`, `test_chat`, `test_disease`, `test_health` pass.

- [ ] **Step 2: Start all services**

```
Terminal 1: ollama serve
Terminal 2: uvicorn main:app --host 0.0.0.0 --port 8000  (in backend/)
Terminal 3: cloudflared tunnel --url http://localhost:8000
```

- [ ] **Step 3: Verify each endpoint**

1. `GET /health` → `{"status":"ok","ollama":"connected","simulation":"N engines running"}`
2. After 30s (with short interval) → Firestore shows new readings in `rooms/{id}/readings`
3. `POST /chat` with `userId` and a message → receives contextual AI reply
4. `POST /disease/analyze` with a leaf image → receives disease prediction JSON
5. `GET /forecast/{roomId}/temp` → receives `history` and `forecast` arrays

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(backend): complete backend MVP — simulation, chat, disease, forecast"
```

---

## What comes next

1. **Frontend Integration Plan** — wire the React app to Firebase Auth + Firestore, replace all mock data with real listeners, add CRUD forms for rooms/tanks/recipes, hook up the FastAPI AI endpoints.

2. **Machine Learning Plan** — collect real (simulated) training data from Firestore, train LSTM models per metric, replace the linear forecast with LSTM inference, fine-tune EfficientNet-B0 on PlantVillage for accurate disease detection.
