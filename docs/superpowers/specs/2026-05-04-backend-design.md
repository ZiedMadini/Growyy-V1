# Growy Backend — Design Spec

**Date:** 2026-05-04
**MVP target:** 2026-05-10 (demo with ~10 users on phones)

---

## Context

Growy is a hydroponics management mobile app (React 19 + Vite + TanStack Router).
All data is currently static mock data. This spec defines the backend to replace it.

The app has these features that need a real backend:

- Auth (sign in / sign out)
- Rooms: CRUD, live sensor readings, 7-day history, forecasts
- Tanks, recipes, dosing log: full CRUD
- Setpoints: lighting schedule, environment targets, irrigation per room
- Devices and sensors per room: CRUD
- AI chat (GrowyBot) with full grow context
- AI disease detection from leaf photos (ephemeral — no persistence)
- Push notifications for out-of-range sensors
- Sensor simulation per user (replaces real sensors until hardware is ready)

---

## Architecture

```
Mobile App (React/Vite)
       │
       ├── Firebase SDK ─────────────────────────────────────┐
       │   Auth, Firestore real-time listeners, FCM           │
       │   Direct CRUD for all entities                       │
       │                                                      ▼
       │                                             Firestore DB
       │                                                      ▲
       └── HTTP → FastAPI (user's PC, Cloudflare Tunnel)     │
                    ├── POST /chat      → Ollama (local LLM) ─┘
                    ├── POST /disease   → EfficientNet-B0 (local, ephemeral)
                    ├── GET  /forecast/:roomId/:metric → linear trend (MVP)
                    └── Simulation Engine
                         async tasks per room → writes readings to Firestore
```

**Key principles:**

- The app writes all CRUD directly through the Firebase SDK (no server roundtrip)
- FastAPI handles AI inference and simulation only
- No Firebase Functions (not available on free Spark plan)
- All AI is self-hosted — no external AI APIs

---

## Users & Scope

- Small team, ~10 users for MVP demo
- No teams or shared workspaces — each user owns their own rooms, tanks, recipes, etc.
- Auth: Firebase email/password
- Every Firestore document carries a `userId` field; security rules enforce user isolation

---

## Firestore Data Model

### `users/{userId}`

```
displayName    string
email          string
photoURL       string | null
preferences:
  tempUnit               "C" | "F"
  volUnit                "ml" | "oz"
  notificationsEnabled   boolean
createdAt      timestamp
```

### `rooms/{roomId}`

```
userId         string
name           string
stage          "Vegetative" | "Flowering" | "Propagation" | "Flushing"
day            number
totalDays      number
status         "healthy" | "warning" | "critical"

currentMetrics:
  temp, humidity, ph, ec, co2, vpd   (numbers)

targets:
  temp, humidity, ph, ec, co2        ([min, max] pairs)

lightSchedule:
  onHour, offHour   number
  curve             [{h: number, v: number}]   (24-point intensity, matches frontend lightingCurve)

irrigation:
  intervalHours   number
  durationMin     number

simulationConfig:
  baseTemp        number
  baseHumidity    number
  phDriftRate     number   (default 0.01 per hour)
  ecDecayRate     number   (default 0.005 per hour)

createdAt, updatedAt   timestamp
```

### `rooms/{roomId}/readings/{readingId}`

Time-series. One document per simulation tick (every 10 min). Kept 30 days.

```
temp, humidity, ph, ec, co2, vpd   number
timestamp                           timestamp
```

### `rooms/{roomId}/events/{eventId}`

Activity feed for the Active Run screen.

```
type        "dose" | "irrigation" | "alert" | "light"
text        string
timestamp   timestamp
```

### `rooms/{roomId}/devices/{deviceId}`

```
name, type   string   ("pump"|"light"|"fan"|"heater"|"cooler"|"camera")
online       boolean
status       "on" | "off"
battery      number | null
settings     map
createdAt    timestamp
```

### `rooms/{roomId}/sensors/{sensorId}`

```
name, type         string   ("temp"|"humidity"|"ph"|"ec"|"co2"|"vpd")
online             boolean
battery            number | null
lastReading        number
lastReadingAt      timestamp
```

### `tanks/{tankId}`

```
userId        string
name          string
type          "nutrient" | "ph" | "additive"
level         number (0–100 %)
volume        number (litres)
capacity      number (litres)
color         "primary" | "warning" | "destructive"
solutionName  string
createdAt, updatedAt   timestamp
```

### `recipes/{recipeId}`

```
userId      string
name        string
stage       string
week        number
roomId      string | null
doses       [{tankId, tankName, ml}]
createdAt   timestamp
```

### `dosingLog/{logId}`

```
userId, roomId, roomName     string
recipeId, recipeName         string
doses                        [{tankId, tankName, ml}]
timestamp                    timestamp
```

### `notifications/{notifId}`

```
userId, roomId   string
title            string
severity         "info" | "warning" | "critical"
read             boolean
timestamp        timestamp
```

### `chatSessions/{sessionId}`

```
userId     string
messages   [{id, role: "user"|"ai", text, timestamp}]   (capped at 50 messages; new session doc created after)
createdAt, updatedAt   timestamp
```

---

## FastAPI Server

### Folder structure

```
backend/
  main.py                    FastAPI app, startup/shutdown, simulation launch
  config.py                  env vars
  firebase_client.py         Firestore + FCM admin SDK init
  routers/
    chat.py                  POST /chat
    disease.py               POST /disease/analyze
    forecast.py              GET /forecast/{roomId}/{metric}
  simulation/
    engine.py                SimulationEngine — one asyncio task per room
    manager.py               Watches Firestore, spawns/stops engines
  models/
    disease_model.py         EfficientNet-B0 loader + inference
    forecast_model.py        Linear trend (MVP) / LSTM (phase 2)
```

### Endpoints

| Method | Path                          | Description                                                                                              |
| ------ | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| POST   | `/chat`                       | `{userId, message, sessionId?}`. Fetches grow context from Firestore, sends to Ollama, returns AI reply. |
| POST   | `/disease/analyze`            | Multipart image. Returns `{disease, confidence, treatments[]}`. Nothing written to DB.                   |
| GET    | `/forecast/{roomId}/{metric}` | Returns 5-day forecast for metric. MVP: linear trend from last 7 days.                                   |
| GET    | `/health`                     | Returns FastAPI + Ollama + model status.                                                                 |

---

## Simulation Engine

`SimulationEngine` runs as an asyncio background task, one instance per room.

**Tick (every 10 minutes):**

1. Read room state from Firestore (targets, lightSchedule, simulationConfig, currentMetrics)
2. Compute new readings:
   - **Temp**: oscillates around `baseTemp`; +1–2°C when lights on, falls at night; Gaussian noise
   - **Humidity**: inversely correlated with temp; drifts toward target range with noise
   - **pH**: drifts up at `phDriftRate`/hr; mean-reverts when within target
   - **EC**: decays at `ecDecayRate`/hr; occasional step-drop simulating a dosing event
   - **CO₂**: drops during light period (photosynthesis), rises at night
   - **VPD**: `0.6108 × exp(17.27×T / (T+237.3)) × (1 − RH/100)`
3. Write to `readings` subcollection + update `currentMetrics` (2 Firestore writes)
4. Evaluate status vs targets → update `status` field
5. If out of range → create `notifications` document + send FCM push

`SimulationManager` starts on FastAPI startup, reads all rooms for all users from Firestore, and spawns one `SimulationEngine` per room. Listens for new rooms being added and spawns engines on the fly.

---

## AI Components

### Chat — Ollama

- Model: `llama3.2:3b` (default) or `phi3.5:mini`
- Context injected into system prompt before each request:
  - All rooms: name, stage, day/totalDays, status, currentMetrics vs targets
  - Last 7 days daily averages per metric
  - Tank names + levels
  - Last 5 dosing events
  - Unread notifications (active alerts)
- Conversation history from `chatSessions` for continuity within a session

### Disease Detection — EfficientNet-B0

- Fine-tuned on PlantVillage (38 disease classes)
- Loaded via `timm` library from local checkpoint
- Input: JPEG/PNG, resized to 224×224
- Output: top-3 predictions with confidence + treatment list per class
- Runs on CPU (~200ms); no GPU required
- No data persisted

### Forecasting — MVP placeholder

- Linear extrapolation from last 7 days of readings
- Produces 5-day daily forecast matching the `forecastData` shape used by the frontend charts
- LSTM replacement is phase 2 (requires collected training data)

---

## Deployment (Demo — May 10)

1. `cloudflared tunnel --url http://localhost:8000` → stable public HTTPS URL
2. Set `VITE_API_URL` in frontend `.env`
3. `ollama serve` + `ollama pull llama3.2:3b`
4. `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
5. Firebase project: Firestore, Auth (email/password), Storage, FCM enabled
6. `serviceAccountKey.json` in backend root

PC must stay on and connected during the demo.
Firebase handles auth, real-time sync, and push notifications independently.

---

## Firestore Security Rules (summary)

All collections locked by `userId`. Subcollections (readings, events, devices, sensors) inherit the parent room's `userId` via a `get()` call.

---

## Out of Scope (MVP)

- LSTM forecasting (linear placeholder used instead)
- Photo storage / scan history
- Multi-user shared rooms
- Real sensor hardware integration (simulation is the placeholder)
- Subscription / billing logic
