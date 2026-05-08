from typing import Dict, List

DISEASE_LABELS: List[str] = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca", "Grape___Leaf_blight", "Grape___healthy",
    "Orange___Haunglongbing",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper___Bacterial_spot", "Pepper___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Yellow_Leaf_Curl_Virus", "Tomato___mosaic_virus", "Tomato___healthy",
]

NUM_CLASSES = len(DISEASE_LABELS)  # 38

TREATMENTS: Dict[str, List[str]] = {
    "Powdery_mildew": [
        "Reduce humidity below 55% — mildew thrives above 70% RH",
        "Increase airflow and space between canopy leaves",
        "Apply potassium bicarbonate spray (1 tbsp/gallon) at lights-off",
        "Remove affected leaves and quarantine plant if severe",
    ],
    "Early_blight": [
        "Remove lower infected leaves immediately — dispose, do not compost",
        "Apply copper-based fungicide every 7 days",
        "Reduce leaf wetness — drip-irrigate rather than overhead spray",
        "Ensure EC and Cal-Mag are in range to strengthen cell walls",
    ],
    "Late_blight": [
        "Remove and destroy all infected tissue immediately",
        "Apply mancozeb or chlorothalonil fungicide — very aggressive treatment",
        "Lower humidity to <60% and increase airflow drastically",
        "Inspect neighbouring plants — late blight spreads rapidly",
    ],
    "Bacterial_spot": [
        "Apply copper bactericide (copper hydroxide) as a foliar spray",
        "Avoid wetting foliage during irrigation",
        "Remove infected leaves and sanitise all tools between cuts",
        "Lower nitrogen — excess N increases susceptibility",
    ],
    "Leaf_Mold": [
        "Increase airflow — Leaf Mold is caused by Cladosporium in stagnant air",
        "Reduce humidity below 70%",
        "Apply fungicide (thiram or mancozeb)",
        "Remove heavily infected leaves",
    ],
    "Septoria_leaf_spot": [
        "Remove infected lower leaves",
        "Apply copper or mancozeb fungicide",
        "Avoid overhead watering and improve spacing",
    ],
    "Spider_mites": [
        "Introduce predatory mites (Phytoseiulus persimilis) for biological control",
        "Spray with neem oil or insecticidal soap — coat undersides of leaves",
        "Raise humidity above 60% — mites prefer dry conditions",
        "Remove heavily infested leaves",
    ],
    "Yellow_Leaf_Curl_Virus": [
        "No cure — remove and destroy infected plants immediately",
        "Control whitefly population (the vector) with yellow sticky traps + neem oil",
        "Quarantine — do not let tools or hands touch healthy plants after contact",
    ],
    "mosaic_virus": [
        "No cure — remove and destroy infected plants",
        "Sanitise all equipment with 10% bleach solution",
        "Control aphids (the vector) with insecticidal soap",
        "Avoid working with tobacco near grow room (TMV source)",
    ],
    "Black_rot": [
        "Remove infected leaves and fruit immediately",
        "Apply copper-based fungicide",
        "Improve air circulation and reduce humidity",
    ],
    "Esca": [
        "Prune infected wood at least 30cm below visible symptoms",
        "Seal pruning wounds with pruning paste",
        "No effective chemical cure — focus on prevention",
    ],
    "Leaf_blight": [
        "Apply copper fungicide",
        "Remove infected leaves and improve drainage",
    ],
    "Haunglongbing": [
        "No cure — this is a bacterial disease spread by psyllid insects",
        "Remove and destroy infected trees",
        "Control the Asian citrus psyllid vector",
    ],
    "Cercospora_leaf_spot": [
        "Apply fungicide containing azoxystrobin or tebuconazole",
        "Remove infected leaves",
        "Improve air circulation",
    ],
    "Common_rust": [
        "Apply fungicide at first sign of rust pustules",
        "Remove heavily infected leaves",
    ],
    "Northern_Leaf_Blight": [
        "Apply foliar fungicide (azoxystrobin + propiconazole)",
        "Remove infected leaves",
    ],
    "Cedar_apple_rust": [
        "Apply myclobutanil or propiconazole fungicide",
        "Remove infected tissue",
    ],
    "Apple_scab": [
        "Apply captan or myclobutanil fungicide every 7–10 days",
        "Remove fallen infected leaves — they harbour overwintering spores",
    ],
    "Bacterial_spot_peach": [
        "Apply copper bactericide during dormancy and early growth",
        "Remove infected tissue",
        "Improve drainage and air circulation",
    ],
    "Leaf_scorch": [
        "Check irrigation — leaf scorch often indicates drought stress or salt buildup",
        "Flush growing medium to reduce EC if above target",
        "Ensure roots are not pot-bound",
    ],
    "healthy": [
        "No disease detected — plant looks healthy",
        "Continue current grow schedule",
    ],
}


def get_treatment(label: str) -> List[str]:
    """Return treatment advice for a DISEASE_LABELS entry."""
    key = next((k for k in TREATMENTS if k in label), "healthy")
    return TREATMENTS[key]
