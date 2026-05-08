from abc import ABC, abstractmethod
from typing import Any


class BaseAIModel(ABC):
    """All AI models inherit from this. Enforces a consistent load/predict interface."""

    @abstractmethod
    def load(self) -> None:
        """Load weights into memory. Called lazily by the registry."""

    @abstractmethod
    def predict(self, *args: Any, **kwargs: Any) -> Any:
        """Run inference. Subclasses define the concrete signature."""

    @property
    def is_loaded(self) -> bool:
        return getattr(self, "_loaded", False)
