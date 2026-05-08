import pytest
from PIL import Image
import numpy as np
from ai.disease.model import DiseaseDetectionModel
import io


@pytest.fixture
def model():
    m = DiseaseDetectionModel()
    m.load()
    return m


def _random_image_bytes() -> bytes:
    arr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_loads_without_checkpoint(model):
    assert model.is_loaded


def test_predict_returns_list(model):
    result = model.predict(_random_image_bytes())
    assert isinstance(result, list)
    assert len(result) >= 1


def test_predict_structure(model):
    result = model.predict(_random_image_bytes())
    top = result[0]
    assert "disease" in top
    assert "confidence" in top
    assert "treatments" in top


def test_confidence_in_range(model):
    result = model.predict(_random_image_bytes())
    for item in result:
        assert 0.0 <= item["confidence"] <= 1.0
