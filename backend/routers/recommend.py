from fastapi import APIRouter, HTTPException
from firebase_client import get_db
from ai.recommend.model import engine

router = APIRouter(prefix="/recommend", tags=["recommend"])

# Load LightGBM on import (no-op if checkpoint doesn't exist yet)
engine.load()

TICKS_PER_DAY = 144
ROLLING_DAYS = 7


@router.post("/{room_id}")
async def get_recommendations(room_id: str):
    db = get_db()
    room_ref = db.collection("rooms").document(room_id)
    snap = await room_ref.get()
    if not snap.exists:
        raise HTTPException(404, detail="Room not found")

    room = snap.to_dict()
    metrics = room.get("currentMetrics", {})
    targets = room.get("targets", {})
    stage = room.get("stage", "Vegetative")
    day = room.get("day", 0)
    total_days = room.get("totalDays", 60)

    # Build rolling stats from last 7 days of readings (for LightGBM layer)
    rolling_stats = {}
    if True:  # always fetch — LightGBM uses it when active, rule engine ignores it
        docs = (
            room_ref.collection("readings")
            .order_by("timestamp", direction="DESCENDING")
            .limit(ROLLING_DAYS * TICKS_PER_DAY)
            .stream()
        )
        import numpy as np
        vals: dict[str, list[float]] = {m: [] for m in ["temp", "humidity", "ph", "ec", "co2"]}
        async for doc in docs:
            d = doc.to_dict()
            for m in vals:
                if m in d:
                    vals[m].append(float(d[m]))
        for m, v in vals.items():
            if v:
                rolling_stats[m] = {
                    "mean_7d": float(np.mean(v)),
                    "std_7d": float(np.std(v)),
                    "min_7d": float(np.min(v)),
                    "max_7d": float(np.max(v)),
                }

    return engine.recommend(
        metrics=metrics,
        targets=targets,
        stage=stage,
        day=day,
        total_days=total_days,
        rolling_stats=rolling_stats or None,
    )
