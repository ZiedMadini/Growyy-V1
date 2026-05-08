"""
Train LightGBM setpoint optimizer.

Synthetic mode (default — no data needed):
    python -m ai.recommend.train --synthetic

Firestore mode (needs 30+ days of readings):
    python -m ai.recommend.train

Produces per-setpoint models:
    backend/models/lgbm_recommend_temp.txt
    backend/models/lgbm_recommend_humidity.txt
    backend/models/lgbm_recommend_ph.txt
    backend/models/lgbm_recommend_ec.txt
    backend/models/lgbm_feature_stats.json
"""

import argparse
import json
import logging
import math
import sys
from pathlib import Path
from typing import Dict, List, Any

import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

MODELS_DIR = Path(__file__).parent.parent.parent / "models"
FEATURE_STATS_PATH = MODELS_DIR / "lgbm_feature_stats.json"

METRICS = ["temp", "humidity", "ph", "ec", "co2"]
SETPOINTS = ["temp", "humidity", "ph", "ec"]
TICKS_PER_DAY = 144
ROLLING_DAYS = 7

# Realistic target ranges by stage
STAGE_PROFILES = {
    "Propagation": {
        "temp": [22, 26], "humidity": [65, 80], "ph": [5.8, 6.2], "ec": [0.4, 0.8], "co2": [400, 800],
    },
    "Vegetative": {
        "temp": [22, 27], "humidity": [50, 70], "ph": [5.8, 6.3], "ec": [1.0, 1.8], "co2": [800, 1200],
    },
    "Flowering": {
        "temp": [21, 26], "humidity": [40, 60], "ph": [5.8, 6.2], "ec": [1.6, 2.4], "co2": [800, 1200],
    },
    "Flushing": {
        "temp": [21, 25], "humidity": [45, 65], "ph": [6.0, 6.5], "ec": [0.0, 0.4], "co2": [400, 800],
    },
}

STAGE_ENC = {"Propagation": 0, "Vegetative": 1, "Flowering": 2, "Flushing": 3}


# ─── Synthetic data generator ──────────────────────────────────────────────

def _simulate_metric(metric: str, n_ticks: int, base: float, rng: np.random.Generator) -> np.ndarray:
    """Simulate realistic sensor readings for one metric over n_ticks at 10-min resolution."""
    t = np.arange(n_ticks, dtype=np.float32)
    if metric == "temp":
        daily = 2.0 * np.sin(2 * math.pi * t / 144)
        noise = rng.normal(0, 0.3, n_ticks)
        return (base + daily + noise).astype(np.float32)
    elif metric == "humidity":
        daily = -5.0 * np.sin(2 * math.pi * t / 144)
        noise = rng.normal(0, 1.0, n_ticks)
        return np.clip(base + daily + noise, 20, 95).astype(np.float32)
    elif metric == "ph":
        drift = np.cumsum(rng.normal(0.001, 0.01, n_ticks))
        return np.clip(base + drift % 1.0 - 0.5, 4.5, 8.0).astype(np.float32)
    elif metric == "ec":
        weekly = 0.3 * np.sin(2 * math.pi * t / (144 * 7))
        noise = rng.normal(0, 0.05, n_ticks)
        return np.clip(base + weekly + noise, 0.0, 3.5).astype(np.float32)
    elif metric == "co2":
        daily = -200 * np.abs(np.sin(math.pi * t / 144))
        noise = rng.normal(0, 30, n_ticks)
        return np.clip(base + daily + noise, 300, 1800).astype(np.float32)
    return np.full(n_ticks, base, dtype=np.float32)


def _build_features(current: Dict[str, float], rolling: Dict[str, Dict],
                    stage: str, day: int, total_days: int,
                    targets: Dict[str, List[float]], sp: str) -> List[float]:
    tgt = targets.get(sp, [0, 1])
    center = (tgt[0] + tgt[1]) / 2
    half = max((tgt[1] - tgt[0]) / 2, 1e-3)
    features = []
    for m in METRICS:
        rs = rolling.get(m, {})
        features += [
            current.get(m, 0),
            rs.get("mean_7d", current.get(m, 0)),
            rs.get("std_7d", 0),
            rs.get("min_7d", current.get(m, 0)),
            rs.get("max_7d", current.get(m, 0)),
        ]
    features += [float(STAGE_ENC.get(stage, 1)), day / max(total_days, 1), center, half]
    return features


def generate_synthetic_samples(n_scenarios: int = 800, rng_seed: int = 42) -> List[Dict[str, Any]]:
    """Generate synthetic grow-room histories without Firestore."""
    rng = np.random.default_rng(rng_seed)
    stages = list(STAGE_PROFILES.keys())
    samples = []

    for i in range(n_scenarios):
        stage = stages[i % len(stages)]
        profile = STAGE_PROFILES[stage]
        total_days = rng.integers(30, 90)
        day = rng.integers(ROLLING_DAYS + 1, max(ROLLING_DAYS + 2, total_days))

        # Base metric values: vary ±20% from ideal center
        bases = {
            m: (profile[m][0] + profile[m][1]) / 2 * rng.uniform(0.85, 1.15)
            for m in METRICS
        }
        n_ticks = (ROLLING_DAYS + 1) * TICKS_PER_DAY
        readings_arr = {m: _simulate_metric(m, n_ticks, bases[m], rng) for m in METRICS}

        window_ticks = ROLLING_DAYS * TICKS_PER_DAY
        window = {m: readings_arr[m][:window_ticks] for m in METRICS}
        current_day_ticks = readings_arr

        rolling: Dict[str, Dict] = {}
        for m in METRICS:
            v = window[m]
            rolling[m] = {
                "mean_7d": float(np.mean(v)),
                "std_7d": float(np.std(v)),
                "min_7d": float(np.min(v)),
                "max_7d": float(np.max(v)),
            }

        current = {m: float(np.mean(readings_arr[m][window_ticks:])) for m in METRICS}

        # Targets: profile range, optionally shifted slightly to simulate setpoint drift
        targets = {m: [
            profile[m][0] + rng.uniform(-0.1, 0.1) * (profile[m][1] - profile[m][0]),
            profile[m][1] + rng.uniform(-0.1, 0.1) * (profile[m][1] - profile[m][0]),
        ] for m in SETPOINTS}
        targets["co2"] = profile["co2"]

        for sp in SETPOINTS:
            tgt = targets[sp]
            center = (tgt[0] + tgt[1]) / 2
            actual = current[sp]
            # Label: delta needed to keep metric centered in target band
            # Positive delta = setpoint should move up
            delta = actual - center
            if abs(delta) < 1e-3:
                continue

            feats = _build_features(current, rolling, stage, int(day), int(total_days), targets, sp)
            samples.append({"setpoint": sp, "features": feats, "target": float(delta)})

    logger.info("Synthetic: generated %d training samples", len(samples))
    return samples


# ─── Firestore data collection ─────────────────────────────────────────────

async def _fetch_firestore_samples() -> List[Dict[str, Any]]:
    import asyncio
    from firebase_client import get_db
    db = get_db()
    samples = []

    async for room_doc in db.collection("rooms").stream():
        room = room_doc.to_dict()
        targets = room.get("targets", {})
        stage = room.get("stage", "Vegetative")
        day = room.get("day", 0)
        total_days = room.get("totalDays", 60)

        readings: List[Dict] = []
        async for r in (
            db.collection("rooms").document(room_doc.id)
            .collection("readings").order_by("timestamp").stream()
        ):
            readings.append(r.to_dict())

        if len(readings) < (ROLLING_DAYS + 1) * TICKS_PER_DAY:
            logger.info("Room %s: only %d readings, skipping", room_doc.id, len(readings))
            continue

        n_days = len(readings) // TICKS_PER_DAY
        for d in range(ROLLING_DAYS, n_days):
            window_slice = readings[(d - ROLLING_DAYS) * TICKS_PER_DAY: d * TICKS_PER_DAY]
            current_slice = readings[d * TICKS_PER_DAY: (d + 1) * TICKS_PER_DAY]
            if not window_slice or not current_slice:
                continue

            rolling: Dict[str, Dict] = {}
            for m in METRICS:
                vals = [float(r[m]) for r in window_slice if m in r]
                if vals:
                    rolling[m] = {
                        "mean_7d": float(np.mean(vals)),
                        "std_7d": float(np.std(vals)),
                        "min_7d": float(np.min(vals)),
                        "max_7d": float(np.max(vals)),
                    }

            current = {
                m: float(np.mean([float(r[m]) for r in current_slice if m in r]) or 0)
                for m in METRICS
            }

            for sp in SETPOINTS:
                tgt = targets.get(sp)
                if not tgt or len(tgt) < 2:
                    continue
                center = (float(tgt[0]) + float(tgt[1])) / 2
                actual = current.get(sp, center)
                delta = actual - center
                if abs(delta) < 0.01:
                    continue
                feats = _build_features(current, rolling, stage, day, total_days, targets, sp)
                samples.append({"setpoint": sp, "features": feats, "target": delta})

    logger.info("Firestore: collected %d samples", len(samples))
    return samples


# ─── Training ──────────────────────────────────────────────────────────────

def _train_and_save(samples: List[Dict[str, Any]]) -> None:
    import lightgbm as lgb

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    feature_stats: Dict[str, Any] = {}

    for sp in SETPOINTS:
        sp_samples = [s for s in samples if s["setpoint"] == sp]
        if len(sp_samples) < 20:
            logger.warning("Not enough samples for %s (%d) — skipping", sp, len(sp_samples))
            continue

        X = np.array([s["features"] for s in sp_samples], dtype=np.float32)
        y = np.array([s["target"] for s in sp_samples], dtype=np.float32)

        mu = X.mean(axis=0).tolist()
        sigma = np.maximum(X.std(axis=0), 1e-6).tolist()
        feature_stats[f"{sp}_mu"] = mu
        feature_stats[f"{sp}_sigma"] = sigma

        X_norm = (X - np.array(mu)) / np.array(sigma)
        n_val = max(1, int(len(X_norm) * 0.2))
        X_train, X_val = X_norm[:-n_val], X_norm[-n_val:]
        y_train, y_val = y[:-n_val], y[-n_val:]

        train_ds = lgb.Dataset(X_train, label=y_train)
        val_ds = lgb.Dataset(X_val, label=y_val, reference=train_ds)

        params = {
            "objective": "regression_l1",
            "metric": "mae",
            "num_leaves": 31,
            "learning_rate": 0.05,
            "feature_fraction": 0.8,
            "bagging_fraction": 0.8,
            "bagging_freq": 5,
            "verbose": -1,
            "n_jobs": -1,
        }

        booster = lgb.train(
            params, train_ds,
            num_boost_round=500,
            valid_sets=[val_ds],
            callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(50)],
        )

        ckpt = MODELS_DIR / f"lgbm_recommend_{sp}.txt"
        booster.save_model(str(ckpt))
        logger.info("Saved %s  best_iter=%d  val_mae=%.4f", sp, booster.best_iteration,
                    booster.best_score["valid_0"]["l1"])

    feature_stats["trained_setpoints"] = SETPOINTS
    with open(FEATURE_STATS_PATH, "w") as f:
        json.dump(feature_stats, f, indent=2)
    logger.info("Feature stats saved -> %s", FEATURE_STATS_PATH)


# ─── Entry point ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", action="store_true", default=False,
                        help="Use synthetic data (no Firestore needed)")
    parser.add_argument("--n-scenarios", type=int, default=800,
                        help="Number of synthetic grow scenarios (default 800)")
    args = parser.parse_args()

    if args.synthetic:
        samples = generate_synthetic_samples(n_scenarios=args.n_scenarios)
    else:
        import asyncio
        samples = asyncio.run(_fetch_firestore_samples())
        if not samples:
            logger.warning("No Firestore samples — falling back to synthetic data")
            samples = generate_synthetic_samples(n_scenarios=args.n_scenarios)

    _train_and_save(samples)


if __name__ == "__main__":
    main()
