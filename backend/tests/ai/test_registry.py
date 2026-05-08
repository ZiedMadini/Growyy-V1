import pytest
from ai.registry import ModelRegistry
from ai.base import BaseAIModel


class DummyModel(BaseAIModel):
    def __init__(self):
        self.load_count = 0
        self._loaded = False

    def load(self):
        self.load_count += 1
        self._loaded = True

    def predict(self, x):
        return x * 2

    @property
    def is_loaded(self) -> bool:
        return self._loaded


def test_registry_lazy_loads_on_first_get():
    reg = ModelRegistry()
    m = DummyModel()
    reg.register("dummy", m)
    assert m.load_count == 0
    reg.get("dummy")
    assert m.load_count == 1


def test_registry_does_not_reload_if_already_loaded():
    reg = ModelRegistry()
    m = DummyModel()
    reg.register("dummy", m)
    reg.get("dummy")
    reg.get("dummy")
    assert m.load_count == 1


def test_registry_raises_on_unknown_model():
    reg = ModelRegistry()
    with pytest.raises(KeyError):
        reg.get("nonexistent")


def test_registry_status():
    reg = ModelRegistry()
    m = DummyModel()
    reg.register("dummy", m)
    assert reg.status()["dummy"] == "idle"
    reg.get("dummy")
    assert reg.status()["dummy"] == "loaded"
