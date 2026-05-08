"""
Disease detection — smart color-analysis classifier.

Analyses dominant hue of the uploaded leaf image and returns the most
plausible diagnosis with expert treatment advice.  No model download required.
"""

import io
import logging
from typing import List, Dict

from PIL import Image

from ai.base import BaseAIModel

logger = logging.getLogger(__name__)


class DiseaseDetectionModel(BaseAIModel):

    def __init__(self) -> None:
        self._ready = False

    @property
    def is_loaded(self) -> bool:
        return self._ready

    def load(self) -> None:
        self._ready = True
        logger.info("Disease model ready")

    def predict(self, image_bytes: bytes) -> List[Dict]:  # type: ignore[override]
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((128, 128))

        pixels = list(img.getdata())
        n = len(pixels)
        avg_r = sum(p[0] for p in pixels) / n
        avg_g = sum(p[1] for p in pixels) / n
        avg_b = sum(p[2] for p in pixels) / n

        # Colour ratios that drive diagnosis
        greenness = avg_g / (avg_r + avg_g + avg_b + 1)
        yellowness = (avg_r + avg_g) / (avg_r + avg_g + avg_b + 1) - greenness
        brownness = avg_r / (avg_g + avg_b + 1)
        paleness = 1.0 - (max(avg_r, avg_g, avg_b) / 255)

        if greenness > 0.38:
            return [
                {
                    "disease": "Healthy",
                    "confidence": round(min(0.97, greenness * 2.4), 3),
                    "treatments": [
                        "No disease detected — plant looks healthy",
                        "Continue current grow schedule",
                        "Monitor VPD and EC to maintain optimal conditions",
                    ],
                },
                {
                    "disease": "Early Nitrogen Deficiency",
                    "confidence": round(max(0.02, 0.18 - greenness * 0.3), 3),
                    "treatments": [
                        "Check EC — increase by 0.2 mS/cm if below target",
                        "Verify pH is between 6.0–6.5 for nitrogen uptake",
                    ],
                },
                {
                    "disease": "Mild Overwatering",
                    "confidence": round(max(0.01, 0.10 - greenness * 0.2), 3),
                    "treatments": [
                        "Allow root zone to dry slightly between feedings",
                        "Check drainage and aeration",
                    ],
                },
            ]

        if yellowness > 0.36 or (avg_r > 160 and avg_g > 140 and avg_b < 100):
            return [
                {
                    "disease": "Nitrogen Deficiency",
                    "confidence": round(min(0.93, yellowness * 2.2), 3),
                    "treatments": [
                        "Increase nitrogen in nutrient solution — raise EC by 0.3–0.5 mS/cm",
                        "Verify pH is 6.0–6.5 for optimal nitrogen absorption",
                        "Check for root problems that may block uptake",
                        "Consider foliar spray of diluted N fertiliser for fast recovery",
                    ],
                },
                {
                    "disease": "Magnesium Deficiency",
                    "confidence": round(min(0.72, yellowness * 1.5), 3),
                    "treatments": [
                        "Add CalMag at 1–2 ml/L to nutrient solution",
                        "Interveinal yellowing on older leaves is the key sign",
                        "Raise pH slightly — Mg uptake improves above 6.0",
                    ],
                },
                {
                    "disease": "Iron Deficiency",
                    "confidence": round(max(0.04, 0.35 - yellowness), 3),
                    "treatments": [
                        "Lower pH to 5.8–6.2 — iron locks out above 6.5",
                        "Add chelated iron supplement if pH is already correct",
                    ],
                },
            ]

        if brownness > 0.85 or (avg_r > 140 and avg_g < 110 and avg_b < 90):
            return [
                {
                    "disease": "Early Blight",
                    "confidence": round(min(0.91, brownness * 0.95), 3),
                    "treatments": [
                        "Remove and destroy all visibly infected leaves immediately",
                        "Increase airflow and reduce humidity below 50%",
                        "Apply copper-based fungicide as preventive spray",
                        "Avoid wetting foliage during watering",
                    ],
                },
                {
                    "disease": "Leaf Septoria",
                    "confidence": round(min(0.65, brownness * 0.7), 3),
                    "treatments": [
                        "Prune affected lower leaves and improve canopy airflow",
                        "Apply neem oil or potassium bicarbonate spray weekly",
                        "Reduce humidity and ensure no standing water",
                    ],
                },
                {
                    "disease": "Root Rot (Pythium)",
                    "confidence": round(max(0.05, 0.40 - brownness * 0.2), 3),
                    "treatments": [
                        "Check roots — brown slime confirms pythium",
                        "Drop reservoir temperature to 18 °C",
                        "Add hydrogen peroxide (3 ml of 3% per litre) or Hydroguard",
                    ],
                },
            ]

        if paleness > 0.45:
            return [
                {
                    "disease": "Powdery Mildew",
                    "confidence": round(min(0.88, paleness * 1.7), 3),
                    "treatments": [
                        "Spray with potassium bicarbonate solution (1 tbsp per litre)",
                        "Reduce humidity below 50% and improve air circulation",
                        "Remove the most affected leaves immediately",
                        "Repeat treatment every 3 days until clear",
                    ],
                },
                {
                    "disease": "Calcium Deficiency",
                    "confidence": round(min(0.60, paleness * 1.1), 3),
                    "treatments": [
                        "Add CalMag supplement at 1.5–2 ml/L",
                        "Check pH — calcium absorbs best between 6.2–7.0",
                        "Tip burn and brown leaf edges confirm calcium issues",
                    ],
                },
                {
                    "disease": "Light Bleaching",
                    "confidence": round(max(0.08, 0.35 - paleness * 0.5), 3),
                    "treatments": [
                        "Raise lights to reduce intensity on canopy",
                        "Target 600–900 µmol/m²/s PPFD at canopy level",
                    ],
                },
            ]

        # Default: mild stress
        return [
            {
                "disease": "Mild Nutrient Stress",
                "confidence": 0.74,
                "treatments": [
                    "Check and correct pH to 5.8–6.5",
                    "Verify EC matches your current growth stage",
                    "Inspect roots for signs of rot or blockage",
                ],
            },
            {
                "disease": "Healthy",
                "confidence": 0.18,
                "treatments": [
                    "No disease detected — plant looks healthy",
                    "Continue current grow schedule",
                ],
            },
            {
                "disease": "Overwatering",
                "confidence": 0.08,
                "treatments": [
                    "Allow medium to dry slightly between feedings",
                    "Ensure adequate drainage",
                ],
            },
        ]
