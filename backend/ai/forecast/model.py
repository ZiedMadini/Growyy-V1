"""
PatchTSTForecaster — loads trained checkpoints, falls back to linear regression.

Used by routers/forecast.py. Stateless after load().
"""

import json
import logging
from pathlib import Path
from typing import List

import numpy as np
import torch

from ai.base import BaseAIModel
from ai.forecast.patch_tst import PatchTST

logger = logging.getLogger(__name__)

SEQ_LEN = 1008
PRED_LEN = 5
TICKS_PER_DAY = 144
CHECKPOINT_DIR = Path(__file__).parent.parent.parent / "models"
SCALER_PATH = CHECKPOINT_DIR / "patchtst_scalers.json"


def _linear_forecast(daily: List[float], days: int = PRED_LEN) -> List[float]:
    if len(daily) == 0:
        return [0.0] * days
    if len(daily) < 2:
        return [float(daily[0])] * days
    x = np.arange(len(daily), dtype=float)
    y = np.array(daily, dtype=float)
    n = float(len(x))
    m = (n * float(np.sum(x * y)) - float(np.sum(x)) * float(np.sum(y))) / (
        n * float(np.sum(x ** 2)) - float(np.sum(x)) ** 2
    )
    b = (float(np.sum(y)) - m * float(np.sum(x))) / n
    return [round(float(m * (len(daily) + i) + b), 2) for i in range(days)]


class PatchTSTForecaster(BaseAIModel):
    """
    Per-metric PatchTST inference.

    Input:  raw 10-min readings as a flat list (at least SEQ_LEN=1008 values)
    Output: 5 daily forecast values
    Falls back to linear regression if no checkpoint exists.
    """

    def __init__(self, metric: str) -> None:
        self._metric = metric
        self._model: PatchTST | None = None
        self._lo: float = 0.0
        self._hi: float = 1.0
        self._has_checkpoint = False

    def load(self) -> None:
        ckpt = CHECKPOINT_DIR / f"patchtst_{self._metric}.pth"
        if not ckpt.exists() or not SCALER_PATH.exists():
            logger.info("No PatchTST checkpoint for %s — will use linear fallback", self._metric)
            return

        with open(SCALER_PATH) as f:
            scalers = json.load(f)
        if self._metric not in scalers:
            return

        sc = scalers[self._metric]
        self._lo, self._hi = sc["lo"], sc["hi"]

        self._model = PatchTST(seq_len=SEQ_LEN, pred_len=PRED_LEN)
        state = torch.load(ckpt, map_location="cpu", weights_only=True)
        self._model.load_state_dict(state)
        self._model.train(mode=False)
        self._has_checkpoint = True
        phase = sc.get("phase", "?")
        logger.info("PatchTST loaded for %s (phase %s)", self._metric, phase)

    def predict(self, raw_readings: List[float], daily_fallback: List[float] | None = None) -> List[float]:  # type: ignore[override]
        if not self._has_checkpoint or self._model is None or len(raw_readings) < SEQ_LEN:
            # Fall back to linear regression when no checkpoint or not enough raw history
            fallback = daily_fallback or _daily_averages(raw_readings)
            return _linear_forecast(fallback)

        # Use last SEQ_LEN readings
        tail = raw_readings[-SEQ_LEN:]
        span = self._hi - self._lo or 1.0
        norm = [(v - self._lo) / span for v in tail]

        x = torch.tensor(norm, dtype=torch.float32).unsqueeze(0)  # (1, SEQ_LEN)
        with torch.no_grad():
            out = self._model(x)[0].tolist()   # (PRED_LEN,)

        return [round(v * span + self._lo, 2) for v in out]


def _daily_averages(readings: List[float]) -> List[float]:
    chunk = TICKS_PER_DAY
    return [
        round(sum(readings[i: i + chunk]) / len(readings[i: i + chunk]), 2)
        for i in range(0, len(readings) - (len(readings) % chunk), chunk)
        if len(readings[i: i + chunk]) > 0
    ]
