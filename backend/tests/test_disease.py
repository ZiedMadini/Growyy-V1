from PIL import Image
import io


def _make_image() -> bytes:
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_disease_model_top3():
    from models.disease_model import DiseaseModel
    model = DiseaseModel()
    results = model.predict(_make_image())
    assert len(results) == 3
    for r in results:
        assert "disease" in r
        assert "confidence" in r
        assert 0.0 <= r["confidence"] <= 1.0


def test_disease_model_confidence_plausible():
    from models.disease_model import DiseaseModel
    model = DiseaseModel()
    results = model.predict(_make_image())
    total = sum(r["confidence"] for r in results)
    assert total >= 0.05
