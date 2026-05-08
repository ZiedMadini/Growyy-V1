"""
Train PatchTST per metric.

Phase 1 (--phase 1, default): synthetic data from the simulation physics engine.
  - Generates ~90 virtual days of readings per metric per room config
  - Runs in ~1h on RTX 3050, no Firestore needed

Phase 2 (--phase 2): real readings from Firestore.
  - Run after 30+ days of simulation data have accumulated
  - Auto-schedules retraining every 14 days when called with --schedule

Usage
-----
    cd .worktrees/backend/backend
    python -m ai.forecast.train            # Phase 1 synthetic
    python -m ai.forecast.train --phase 2  # Phase 2 real data
"""

import argparse
import asyncio
import json
import logging
import random
import sys
from pathlib import Path
from typing import List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai.forecast.patch_tst import PatchTST

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

METRICS = ["temp", "humidity", "ph", "ec", "co2"]
SEQ_LEN = 1008         # 7 days × 144 ticks
PRED_LEN = 5           # 5 daily forecast values
TICKS_PER_DAY = 144
CHECKPOINT_DIR = Path(__file__).parent.parent.parent / "models"
SCALER_PATH = CHECKPOINT_DIR / "patchtst_scalers.json"

EPOCHS = 100
BATCH = 64
LR = 1e-3
PATIENCE = 15          # early stopping


# ─── Synthetic data generation ────────────────────────────────────────────────

# Realistic target ranges per metric (used to sample diverse room configs)
_RANGES = {
    "temp":     (18.0, 28.0),
    "humidity": (50.0, 80.0),
    "ph":       (5.5,  6.8),
    "ec":       (0.8,  2.8),
    "co2":      (600., 1400.),
}

_DRIFT = {
    "temp":     0.0,
    "humidity": 0.0,
    "ph":       0.015,   # pH drifts up over time
    "ec":       -0.003,  # EC slowly decays
    "co2":      0.0,
}


def _generate_synthetic_series(metric: str, n_days: int = 90) -> List[float]:
    """Generate one continuous synthetic time series of n_days × 144 ticks."""
    lo, hi = _RANGES[metric]
    center = random.uniform(lo + (hi - lo) * 0.2, hi - (hi - lo) * 0.2)
    drift = _DRIFT[metric]
    noise_std = (hi - lo) * 0.015

    # Light schedule: lights on 6:00–20:00 (hours 6–20 out of 24)
    light_on, light_off = 6, 20

    series: List[float] = []
    val = center

    for tick in range(n_days * TICKS_PER_DAY):
        hour = (tick % TICKS_PER_DAY) * (24 / TICKS_PER_DAY)
        lights = light_on <= hour < light_off

        # Metric-specific physics
        if metric == "temp":
            target = center + (1.5 if lights else -1.5)
            val += 0.05 * (target - val) + random.gauss(0, noise_std)
        elif metric == "humidity":
            target = center - (3.0 if lights else 3.0)
            val += 0.04 * (target - val) + random.gauss(0, noise_std)
        elif metric == "ph":
            val += drift / TICKS_PER_DAY + random.gauss(0, noise_std * 0.5)
            if val > hi:
                val = center  # dosing event resets pH
        elif metric == "ec":
            val += drift / TICKS_PER_DAY + random.gauss(0, noise_std * 0.3)
            if random.random() < 0.002:
                val = center  # random dosing event
        elif metric == "co2":
            target = center - (200 if lights else -200)
            val += 0.03 * (target - val) + random.gauss(0, noise_std * 2)

        val = max(lo * 0.85, min(hi * 1.15, val))
        series.append(round(val, 3))

    return series


def make_windows(
    series: List[float], scaler_lo: float, scaler_hi: float
) -> Tuple[List[List[float]], List[List[float]]]:
    """Sliding-window dataset: input=SEQ_LEN raw ticks, target=PRED_LEN daily averages."""
    span = scaler_hi - scaler_lo or 1.0
    norm = [(v - scaler_lo) / span for v in series]

    X, y = [], []
    step = TICKS_PER_DAY // 4   # stride = 6h to create overlapping windows
    end = len(norm) - SEQ_LEN - PRED_LEN * TICKS_PER_DAY + 1

    for i in range(0, end, step):
        x_win = norm[i: i + SEQ_LEN]
        future_raw = series[i + SEQ_LEN: i + SEQ_LEN + PRED_LEN * TICKS_PER_DAY]
        # Average each TICKS_PER_DAY chunk → one daily value
        y_win = [
            (sum(future_raw[d * TICKS_PER_DAY: (d + 1) * TICKS_PER_DAY]) /
             TICKS_PER_DAY - scaler_lo) / span
            for d in range(PRED_LEN)
        ]
        X.append(x_win)
        y.append(y_win)

    return X, y


# ─── Phase 2: fetch real Firestore readings ───────────────────────────────────

async def _fetch_firestore(metric: str) -> List[float]:
    from firebase_client import get_db
    db = get_db()
    values: List[float] = []
    async for room_doc in db.collection("rooms").stream():
        readings_ref = (
            db.collection("rooms").document(room_doc.id)
            .collection("readings")
            .order_by("timestamp")
        )
        async for r in readings_ref.stream():
            d = r.to_dict()
            if metric in d:
                values.append(float(d[metric]))
    logger.info("Fetched %d readings from Firestore for %s", len(values), metric)
    return values


# ─── Train one metric ─────────────────────────────────────────────────────────

def _train_metric(metric: str, all_series: List[List[float]]) -> Tuple[float, float]:
    all_vals = [v for s in all_series for v in s]
    lo, hi = float(min(all_vals)), float(max(all_vals))

    X_all, y_all = [], []
    for series in all_series:
        X, y = make_windows(series, lo, hi)
        X_all.extend(X)
        y_all.extend(y)

    if len(X_all) < 10:
        raise RuntimeError(f"Not enough windows for {metric}: {len(X_all)}")

    logger.info("%s: %d training windows  lo=%.3f  hi=%.3f", metric, len(X_all), lo, hi)

    X_t = torch.tensor(X_all, dtype=torch.float32)   # (N, SEQ_LEN)
    y_t = torch.tensor(y_all, dtype=torch.float32)   # (N, PRED_LEN)

    # 85/15 split
    n_val = max(1, int(len(X_t) * 0.15))
    X_train, X_val = X_t[:-n_val], X_t[-n_val:]
    y_train, y_val = y_t[:-n_val], y_t[-n_val:]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = PatchTST(seq_len=SEQ_LEN, pred_len=PRED_LEN).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    criterion = nn.HuberLoss()

    loader = DataLoader(
        TensorDataset(X_train.to(device), y_train.to(device)),
        batch_size=BATCH, shuffle=True,
    )

    best_val = float("inf")
    no_improve = 0
    ckpt_path = CHECKPOINT_DIR / f"patchtst_{metric}.pth"

    for epoch in range(1, EPOCHS + 1):
        model.train()
        for xb, yb in loader:
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        scheduler.step()

        model.train(mode=False)
        with torch.no_grad():
            val_loss = criterion(
                model(X_val.to(device)), y_val.to(device)
            ).item()

        if val_loss < best_val:
            best_val = val_loss
            torch.save(model.state_dict(), ckpt_path)
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                logger.info("  Early stop at epoch %d", epoch)
                break

        if epoch % 20 == 0:
            logger.info("  epoch %3d  val_loss=%.6f  best=%.6f", epoch, val_loss, best_val)

    logger.info("✓ %s  best_val=%.6f → %s", metric, best_val, ckpt_path)
    return lo, hi


# ─── Entry point ──────────────────────────────────────────────────────────────

def run_phase1() -> None:
    """Generate synthetic data and train PatchTST for each metric."""
    logger.info("=== Phase 1: synthetic data training ===")
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    scalers: dict = {}

    N_ROOMS = 8    # simulate 8 distinct room configs for diversity
    N_DAYS = 90    # 90 virtual days each

    for metric in METRICS:
        logger.info("── %s ──", metric)
        all_series = [_generate_synthetic_series(metric, N_DAYS) for _ in range(N_ROOMS)]
        try:
            lo, hi = _train_metric(metric, all_series)
            scalers[metric] = {"lo": lo, "hi": hi, "phase": 1}
        except RuntimeError as e:
            logger.error("SKIP %s: %s", metric, e)

    with open(SCALER_PATH, "w") as f:
        json.dump(scalers, f, indent=2)
    logger.info("Scalers → %s", SCALER_PATH)
    logger.info("Phase 1 complete. PatchTST models ready for inference.")


async def run_phase2() -> None:
    """Fetch real Firestore data and retrain PatchTST."""
    logger.info("=== Phase 2: real Firestore data retraining ===")
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    existing_scalers: dict = {}
    if SCALER_PATH.exists():
        with open(SCALER_PATH) as f:
            existing_scalers = json.load(f)

    scalers: dict = {}
    for metric in METRICS:
        logger.info("── %s ──", metric)
        values = await _fetch_firestore(metric)
        if len(values) < SEQ_LEN + PRED_LEN * TICKS_PER_DAY:
            logger.warning(
                "Not enough Firestore data for %s (%d readings, need %d). Skipping.",
                metric, len(values), SEQ_LEN + PRED_LEN * TICKS_PER_DAY,
            )
            if metric in existing_scalers:
                scalers[metric] = existing_scalers[metric]
            continue
        try:
            lo, hi = _train_metric(metric, [values])
            scalers[metric] = {"lo": lo, "hi": hi, "phase": 2}
        except RuntimeError as e:
            logger.error("SKIP %s: %s", metric, e)

    with open(SCALER_PATH, "w") as f:
        json.dump(scalers, f, indent=2)
    logger.info("Phase 2 complete. PatchTST retrained on real data.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", type=int, default=1, choices=[1, 2])
    args = parser.parse_args()

    if args.phase == 1:
        run_phase1()
    else:
        asyncio.run(run_phase2())
