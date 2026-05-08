from fastapi import APIRouter, HTTPException
from firebase_client import get_db
from ai.registry import registry
from ai.forecast.model import PatchTSTForecaster, _daily_averages, _linear_forecast, PRED_LEN

router = APIRouter(prefix="/forecast", tags=["forecast"])
VALID_METRICS = {"temp", "humidity", "ph", "ec", "co2"}

# Register one PatchTST model per metric (lazy-loaded on first request)
for _m in VALID_METRICS:
    registry.register(f"forecast_{_m}", PatchTSTForecaster(_m))

# Typical baseline values used when a room has no sensor history yet
_TYPICAL = {
    "temp":     {"base": 24.0, "var": 1.5},
    "humidity": {"base": 65.0, "var": 4.0},
    "ph":       {"base": 6.0,  "var": 0.15},
    "ec":       {"base": 1.8,  "var": 0.2},
    "co2":      {"base": 1100.0, "var": 60.0},
}

def _demo_history_and_forecast(metric: str) -> tuple[list[float], list[float]]:
    """Generate plausible-looking demo history + forecast when no real data exists."""
    import math
    t = _TYPICAL[metric]
    base, var = t["base"], t["var"]
    # 7-day history with a gentle sine wave
    history = [round(base + var * math.sin(i * 0.9), 2) for i in range(7)]
    forecast = _linear_forecast(history, PRED_LEN)
    return history, forecast


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

    raw: list[float] = []
    async for doc in docs:
        d = doc.to_dict()
        if metric in d:
            raw.append(float(d[metric]))

    # Not enough real data — return labelled demo values so UI remains useful
    if len(raw) < 2:
        history, forecast = _demo_history_and_forecast(metric)
        return {
            "roomId": room_id,
            "metric": metric,
            "history": history,
            "forecast": forecast,
            "demo": True,
        }

    raw.reverse()   # oldest → newest

    daily = _daily_averages(raw)

    # Fall back to demo if we don't have enough daily points to make a meaningful chart
    if len(daily) < 2:
        history, forecast = _demo_history_and_forecast(metric)
        return {
            "roomId": room_id,
            "metric": metric,
            "history": history,
            "forecast": forecast,
            "demo": True,
        }

    forecaster: PatchTSTForecaster = registry.get(f"forecast_{metric}")  # type: ignore
    forecast = forecaster.predict(raw, daily_fallback=daily)

    return {
        "roomId": room_id,
        "metric": metric,
        "history": daily[-7:],
        "forecast": forecast,
        "demo": False,
    }
