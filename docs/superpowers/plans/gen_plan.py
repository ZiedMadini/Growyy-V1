import pathlib
out = pathlib.Path("docs/superpowers/plans/2026-05-05-ai-system.md")
lines = []
lines.append("""## Phase 0 - AI Package Foundation

### Task 2: BaseAIModel and ModelRegistry

**Files:** Create backend/ai/__init__.py, base.py, registry.py | Test: backend/tests/ai/test_registry.py

""")
lines.append(r"""```python
# backend/ai/base.py
from abc import ABC, abstractmethod
from typing import Any

class BaseAIModel(ABC):
    vram_mb: int = 0

    @abstractmethod
    def load(self) -> None: ...

    @abstractmethod
    def predict(self, *args, **kwargs) -> Any: ...

    def unload(self) -> None:
        pass

    @property
    @abstractmethod
    def is_loaded(self) -> bool: ...
```

""")
