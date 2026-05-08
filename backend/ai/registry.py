"""
ModelRegistry — lazy-loads AI models on first use, manages GPU memory.

Usage:
    from ai.registry import registry
    model = registry.get("disease")
    result = model.predict(image_bytes)
"""

import logging
import threading
from typing import Dict, Type
from ai.base import BaseAIModel

logger = logging.getLogger(__name__)


class ModelRegistry:
    def __init__(self) -> None:
        self._models: Dict[str, BaseAIModel] = {}
        self._lock = threading.Lock()

    def register(self, name: str, model: BaseAIModel) -> None:
        with self._lock:
            self._models[name] = model

    def get(self, name: str) -> BaseAIModel:
        with self._lock:
            model = self._models.get(name)
            if model is None:
                raise KeyError(f"No model registered as '{name}'")
            if not model.is_loaded:
                logger.info("Loading model: %s", name)
                model.load()
                model._loaded = True  # type: ignore[attr-defined]
            return model

    def status(self) -> Dict[str, str]:
        return {
            name: ("loaded" if m.is_loaded else "idle")
            for name, m in self._models.items()
        }


registry = ModelRegistry()
