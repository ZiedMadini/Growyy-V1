import json
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
from typing import List

SEQ_IN = 7
SEQ_OUT = 5
MODEL_DIR = Path(__file__).parent


# ─── Linear baseline (used when LSTM not available) ───────────────────────────

def linear_forecast(history: List[float], days: int = SEQ_OUT) -> List[float]:
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


# ─── LSTM model definition (must match train_lstm.py) ─────────────────────────

class _LSTMModel(nn.Module):
    def __init__(self, hidden: int = 64, layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(1, hidden, layers, batch_first=True,
                            dropout=0.2 if layers > 1 else 0.0)
        self.fc = nn.Linear(hidden, SEQ_OUT)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])


# ─── Per-metric LSTM loader ────────────────────────────────────────────────────

class _LSTMForecaster:
    def __init__(self, metric: str, lo: float, hi: float):
        self._lo = lo
        self._hi = hi
        self._span = hi - lo or 1.0
        self._model = _LSTMModel()
        state = torch.load(MODEL_DIR / f"lstm_{metric}.pth",
                           map_location="cpu", weights_only=True)
        self._model.load_state_dict(state)
        self._model.train(mode=False)

    def predict(self, daily: List[float]) -> List[float]:
        # Use only the last SEQ_IN days
        tail = daily[-SEQ_IN:]
        norm = [(v - self._lo) / self._span for v in tail]
        x = torch.tensor(norm, dtype=torch.float32).unsqueeze(0).unsqueeze(-1)  # (1, SEQ_IN, 1)
        with torch.no_grad():
            out = self._model(x)[0].tolist()
        # Denormalize and round
        return [round(v * self._span + self._lo, 2) for v in out]


# ─── Registry ─────────────────────────────────────────────────────────────────

_forecasters: dict[str, _LSTMForecaster] = {}
_scalers_loaded = False


def _load_forecasters() -> None:
    global _scalers_loaded
    if _scalers_loaded:
        return
    _scalers_loaded = True
    scalers_path = MODEL_DIR / "lstm_scalers.json"
    if not scalers_path.exists():
        return
    try:
        with open(scalers_path) as f:
            scalers = json.load(f)
        for metric, sc in scalers.items():
            ckpt = MODEL_DIR / f"lstm_{metric}.pth"
            if ckpt.exists():
                _forecasters[metric] = _LSTMForecaster(metric, sc["lo"], sc["hi"])
                print(f"[forecast] LSTM loaded for {metric}")
    except Exception as e:
        print(f"[forecast] LSTM load error: {e} — falling back to linear")


# ─── Public API ───────────────────────────────────────────────────────────────

def forecast(daily: List[float], metric: str, days: int = SEQ_OUT) -> List[float]:
    """Return 5-day forecast. Uses LSTM if trained, otherwise linear regression."""
    _load_forecasters()
    if metric in _forecasters and len(daily) >= SEQ_IN:
        return _forecasters[metric].predict(daily)
    return linear_forecast(daily, days)
