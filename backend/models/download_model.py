"""
Run this once to download pretrained EfficientNet-B0 weights as a starting checkpoint.
Replace with a PlantVillage fine-tuned checkpoint for accurate disease detection.
"""
import torch
import timm
import os

os.makedirs("models", exist_ok=True)
model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=38)
torch.save(model.state_dict(), "models/efficientnet_plantvillage.pth")
print("Saved to models/efficientnet_plantvillage.pth")
