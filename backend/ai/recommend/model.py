"""
Recommendation orchestrator.

Layer 1 — Rule engine (always active, deterministic, <1ms).
Layer 2 — LightGBM setpoint optimizer (one booster per setpoint).

The LightGBM models are trained by ai/recommend/train.py.
Until trained, only rule-engine recommendations are returned.

Model files (one per setpoint):
    backend/models/lgbm_recommend_temp.txt
    backend/models/lgbm_recommend_humidity.txt
    backend/models/lgbm_recommend_ph.txt
    backend/models/lgbm_recommend_ec.txt
    backend/models/lgbm_feature_stats.json
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from ai.recommend.rules import run_rules

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent.parent / "models"
FEATURE_STATS_PATH = MODELS_DIR / "lgbm_feature_stats.json"

METRICS = ["temp", "humidity", "ph", "ec", "co2"]
SETPOINTS = ["temp", "humidity", "ph", "ec"]
STAGE_MAP = {"Propagation": 0, "Vegetative": 1, "Flowering": 2, "Flushing": 3}


class RecommendationEngine:
    def __init__(self) -> None:
        self._boosters: Dict[str, Any] = {}
        self._feature_stats: Dict[str, Any] = {}
        self._lgbm_active = False

    def load(self) -> None:
        if not FEATURE_STATS_PATH.exists():
            logger.info("No LightGBM feature stats — rule engine only")
            return
        try:
            import lightgbm as lgb
            with open(FEATURE_STATS_PATH) as f:
                self._feature_stats = json.load(f)

            loaded = []
            for sp in SETPOINTS:
                ckpt = MODELS_DIR / f"lgbm_recommend_{sp}.txt"
                if ckpt.exists():
                    self._boosters[sp] = lgb.Booster(model_file=str(ckpt))
                    loaded.append(sp)

            if loaded:
                self._lgbm_active = True
                logger.info("LightGBM boosters loaded for: %s", ", ".join(loaded))
            else:
                logger.warning("Feature stats exist but no booster files found")
        except Exception as e:
            logger.warning("LightGBM load failed: %s — using rule engine only", e)

    def recommend(
        self,
        metrics: Dict[str, float],
        targets: Dict[str, List[float]],
        stage: str,
        day: int,
        total_days: int,
        rolling_stats: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        immediate = run_rules(metrics, targets)

        optimizations: List[Dict] = []
        if self._lgbm_active:
            optimizations = self._lgbm_optimize(
                metrics, targets, stage, day, total_days, rolling_stats or {}
            )

        return {
            "immediate": immediate,
            "optimizations": optimizations,
            "model_active": self._lgbm_active,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    def _lgbm_optimize(
        self,
        metrics: Dict[str, float],
        targets: Dict[str, List[float]],
        stage: str,
        day: int,
        total_days: int,
        rolling_stats: Dict[str, Any],
    ) -> List[Dict]:
        import numpy as np

        day_ratio = day / max(total_days, 1)
        stage_enc = float(STAGE_MAP.get(stage, 1))
        optimizations = []
        stats = self._feature_stats

        for sp in SETPOINTS:
            booster = self._boosters.get(sp)
            if booster is None:
                continue
            tgt = targets.get(sp)
            if not tgt or len(tgt) < 2:
                continue

            current_center = (float(tgt[0]) + float(tgt[1])) / 2
            current_half = (float(tgt[1]) - float(tgt[0])) / 2

            features = []
            for m in METRICS:
                rs = rolling_stats.get(m, {})
                features += [
                    float(metrics.get(m, 0)),
                    float(rs.get("mean_7d", metrics.get(m, 0))),
                    float(rs.get("std_7d", 0)),
                    float(rs.get("min_7d", metrics.get(m, 0))),
                    float(rs.get("max_7d", metrics.get(m, 0))),
                ]
            features += [stage_enc, day_ratio, current_center, current_half]

            mu = stats.get(f"{sp}_mu", [0.0] * len(features))
            sigma = stats.get(f"{sp}_sigma", [1.0] * len(features))
            normed = [(f - m) / max(s, 1e-6) for f, m, s in zip(features, mu, sigma)]

            try:
                pred = booster.predict(np.array([normed]))[0]
                delta = float(pred)
                confidence = min(0.95, max(0.50, 0.5 + abs(delta) * 0.3))

                if abs(delta) > 0.05:
                    suggested = [
                        round(float(tgt[0]) + delta, 2),
                        round(float(tgt[1]) + delta, 2),
                    ]
                    optimizations.append({
                        "setpoint": sp,
                        "current": [round(float(tgt[0]), 2), round(float(tgt[1]), 2)],
                        "suggested": suggested,
                        "confidence": round(confidence, 2),
                        "reason": f"7-day trend suggests {sp} center shift of {delta:+.2f}",
                    })
            except Exception as e:
                logger.debug("LightGBM predict error for %s: %s", sp, e)

        return optimizations


engine = RecommendationEngine()
