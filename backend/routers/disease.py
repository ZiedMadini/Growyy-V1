from fastapi import APIRouter, UploadFile, File, HTTPException

from ai.registry import registry
from ai.disease.model import DiseaseDetectionModel

router = APIRouter(prefix="/disease", tags=["disease"])

registry.register("disease", DiseaseDetectionModel())


@router.post("/analyze")
async def analyze_disease(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, detail="File must be an image (JPEG, PNG, WEBP)")

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, detail="Image too large — max 10 MB")

    results = registry.get("disease").predict(image_bytes)
    return {"topPrediction": results[0], "alternatives": results[1:]}
