import io
from typing import List, Dict
import torch
import timm
from PIL import Image
from torchvision import transforms
from config import settings

DISEASE_LABELS = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca", "Grape___Leaf_blight", "Grape___healthy",
    "Orange___Haunglongbing", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper___Bacterial_spot", "Pepper___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Yellow_Leaf_Curl_Virus", "Tomato___mosaic_virus", "Tomato___healthy",
]

TREATMENTS: Dict[str, List[str]] = {
    "Powdery_mildew": [
        "Reduce humidity below 55%",
        "Increase airflow with circulation fans",
        "Apply potassium bicarbonate spray",
        "Remove and dispose of affected leaves",
    ],
    "Early_blight": [
        "Remove infected lower leaves",
        "Apply copper-based fungicide",
        "Improve air circulation",
        "Avoid overhead watering",
    ],
    "Late_blight": [
        "Remove and destroy infected tissue immediately",
        "Apply mancozeb fungicide",
        "Reduce leaf wetness",
        "Increase plant spacing",
    ],
    "Bacterial_spot": [
        "Apply copper bactericide",
        "Avoid wetting foliage",
        "Remove infected leaves",
        "Disinfect all tools between plants",
    ],
    "healthy": [
        "No disease detected",
        "Continue current grow schedule",
    ],
}

_PREPROCESS = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class DiseaseModel:
    def __init__(self):
        self._model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=38)
        try:
            state = torch.load(settings.disease_model_path, map_location="cpu", weights_only=True)
            self._model.load_state_dict(state)
        except FileNotFoundError:
            pass
        # set model to inference mode (equivalent to .eval())
        self._model.train(mode=False)

    def predict(self, image_bytes: bytes) -> List[Dict]:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _PREPROCESS(img).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self._model(tensor), dim=1)[0]
        top3 = torch.topk(probs, 3)
        results = []
        for score, idx in zip(top3.values.tolist(), top3.indices.tolist()):
            label = DISEASE_LABELS[idx]
            display = label.split("___")[-1].replace("_", " ")
            key = next((k for k in TREATMENTS if k in label), "healthy")
            results.append({"disease": display, "confidence": round(score, 3), "treatments": TREATMENTS[key]})
        return results


_instance: DiseaseModel | None = None


def get_disease_model() -> DiseaseModel:
    global _instance
    if _instance is None:
        _instance = DiseaseModel()
    return _instance
