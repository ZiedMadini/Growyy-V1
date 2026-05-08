"""
Train LSTM forecasting models from Firestore simulation readings.

One model per metric (temp, humidity, ph, ec, co2).
Requires at least 14 days of readings per room.

Usage
-----
    cd .worktrees/backend/backend
    python models/train_lstm.py

Outputs (in ./models/):
    lstm_<metric>.pth       — trained checkpoint
    lstm_scalers.json       — per-metric min/max for normalization

After training, the /forecast endpoint automatically switches from linear
regression to LSTM (no restart needed — model loaded on first request).
"""

import asyncio
import json
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Allow imports from the backend root
sys.path.insert(0, str(Path(__file__).parent.parent))

from firebase_client import get_db  # noqa: E402

METRICS = ["temp", "humidity", "ph", "ec", "co2"]
SEQ_IN = 7       # days of history fed to the model
SEQ_OUT = 5      # days to forecast
TICKS_PER_DAY = 144  # 10-min simulation interval
MIN_DAYS = SEQ_IN + SEQ_OUT + 1  # minimum to produce at least one training sample
MODEL_DIR = Path(__file__).parent


# ─── Model ────────────────────────────────────────────────────────────────────

class LSTMModel(nn.Module):
    def __init__(self, hidden=64, layers=2, seq_in=SEQ_IN, seq_out=SEQ_OUT):
        super().__init__()
        self.lstm = nn.LSTM(1, hidden, layers, batch_first=True,
                            dropout=0.2 if layers > 1 else 0.0)
        self.fc = nn.Linear(hidden, seq_out)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, seq_in, 1)
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])   # (B, seq_out)


# ─── Data helpers ─────────────────────────────────────────────────────────────

async def fetch_daily_averages(metric: str) -> list[list[float]]:
    """Return one list of daily averages per room."""
    db = get_db()
    rooms_ref = db.collection("rooms")
    all_sequences: list[list[float]] = []

    async for room_doc in rooms_ref.stream():
        readings_ref = (
            rooms_ref.document(room_doc.id)
            .collection("readings")
            .order_by("timestamp")
        )
        values: list[float] = []
        async for r in readings_ref.stream():
            d = r.to_dict()
            if metric in d:
                values.append(float(d[metric]))

        if len(values) < MIN_DAYS * TICKS_PER_DAY:
            print(f"  Room {room_doc.id}: only {len(values)} readings — need "
                  f"{MIN_DAYS * TICKS_PER_DAY} ({MIN_DAYS} days). Skipping.")
            continue

        daily = [
            sum(values[i:i + TICKS_PER_DAY]) / len(values[i:i + TICKS_PER_DAY])
            for i in range(0, len(values) - (len(values) % TICKS_PER_DAY), TICKS_PER_DAY)
        ]
        print(f"  Room {room_doc.id}: {len(daily)} daily averages")
        all_sequences.append(daily)

    return all_sequences


def make_windows(daily: list[float]) -> tuple[list, list]:
    X, y = [], []
    for i in range(len(daily) - SEQ_IN - SEQ_OUT + 1):
        X.append(daily[i:i + SEQ_IN])
        y.append(daily[i + SEQ_IN:i + SEQ_IN + SEQ_OUT])
    return X, y


def normalize(data: list[float], lo: float, hi: float) -> list[float]:
    span = hi - lo or 1.0
    return [(v - lo) / span for v in data]


# ─── Train one metric ─────────────────────────────────────────────────────────

def train_metric(metric: str, sequences: list[list[float]]) -> tuple[float, float]:
    """Train and save LSTM for one metric. Returns (lo, hi) scaler values."""
    all_vals = [v for seq in sequences for v in seq]
    lo, hi = float(min(all_vals)), float(max(all_vals))

    X_all, y_all = [], []
    for seq in sequences:
        norm = normalize(seq, lo, hi)
        X, y = make_windows(norm)
        X_all.extend(X)
        y_all.extend(y)

    if len(X_all) < 4:
        raise RuntimeError(f"Not enough training windows ({len(X_all)}) for {metric}. "
                           f"Collect more data and re-run.")

    X_t = torch.tensor(X_all, dtype=torch.float32).unsqueeze(-1)  # (N, SEQ_IN, 1)
    y_t = torch.tensor(y_all, dtype=torch.float32)                 # (N, SEQ_OUT)

    # 80/20 split
    n_val = max(1, int(len(X_t) * 0.2))
    X_train, X_val = X_t[:-n_val], X_t[-n_val:]
    y_train, y_val = y_t[:-n_val], y_t[-n_val:]

    loader = DataLoader(TensorDataset(X_train, y_train), batch_size=16, shuffle=True)

    model = LSTMModel()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=200)
    criterion = nn.MSELoss()

    best_val = float("inf")
    patience = 30
    no_improve = 0

    for epoch in range(1, 301):
        model.train()
        for xb, yb in loader:
            optimizer.zero_grad()
            criterion(model(xb), yb).backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        scheduler.step()

        model.train(mode=False)
        with torch.no_grad():
            val_loss = criterion(model(X_val), y_val).item()

        if val_loss < best_val:
            best_val = val_loss
            torch.save(model.state_dict(), MODEL_DIR / f"lstm_{metric}.pth")
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= patience:
                print(f"  Early stop at epoch {epoch} (best val_loss={best_val:.6f})")
                break

        if epoch % 50 == 0:
            print(f"  epoch {epoch:3d}  val_loss={val_loss:.6f}")

    print(f"  ✓ Saved lstm_{metric}.pth  (best val_loss={best_val:.6f}  lo={lo:.3f}  hi={hi:.3f})")
    return lo, hi


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main():
    scalers: dict[str, dict] = {}

    for metric in METRICS:
        print(f"\n── {metric} ──")
        sequences = await fetch_daily_averages(metric)
        if not sequences:
            print(f"  No usable data. Skipping {metric}.")
            continue
        try:
            lo, hi = train_metric(metric, sequences)
            scalers[metric] = {"lo": lo, "hi": hi}
        except RuntimeError as e:
            print(f"  SKIP: {e}")

    if scalers:
        with open(MODEL_DIR / "lstm_scalers.json", "w") as f:
            json.dump(scalers, f, indent=2)
        print(f"\n✓ Scalers saved → {MODEL_DIR}/lstm_scalers.json")
        print("Trained metrics:", list(scalers.keys()))
        print("The /forecast endpoint will now use LSTM automatically.")
    else:
        print("\nNo models trained — collect more simulation data (minimum 14 days/room).")


if __name__ == "__main__":
    asyncio.run(main())
