"""
Fine-tune EfficientNet-B0 on PlantVillage dataset.

Usage
-----
1. Download PlantVillage (color images, 38 classes):
   - Kaggle: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
     Extract so that ./PlantVillage/color/<ClassName>/*.jpg exists.
   - Or HuggingFace: `huggingface-cli download --repo-type dataset mbonfardin/PlantVillage --local-dir ./PlantVillage`

2. Run:
   python models/train_disease.py --data-dir ./PlantVillage/color

3. Checkpoint is saved to the path in .env (DISEASE_MODEL_PATH), default:
   ./models/efficientnet_plantvillage.pth

No code changes needed in the app after the checkpoint is replaced.
"""

import argparse
import os
import sys
import json
from pathlib import Path

import torch
import torch.nn as nn
import timm
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from torch.optim.lr_scheduler import CosineAnnealingLR

# Labels must match disease_model.py DISEASE_LABELS order exactly
REQUIRED_CLASSES = 38


def build_transforms(train: bool):
    if train:
        return transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def train(args):
    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"ERROR: data dir not found: {data_dir}")
        print("Download PlantVillage first — see the docstring at the top of this file.")
        sys.exit(1)

    full_dataset = datasets.ImageFolder(data_dir)
    num_classes = len(full_dataset.classes)
    if num_classes != REQUIRED_CLASSES:
        print(f"WARNING: found {num_classes} classes, expected {REQUIRED_CLASSES}.")
        print("Make sure you're pointing at the color/ subdirectory with 38 leaf disease classes.")

    # Save class-to-index mapping so we can verify label order matches DISEASE_LABELS
    mapping_path = Path(args.out).parent / "plantvillage_class_map.json"
    with open(mapping_path, "w") as f:
        json.dump(full_dataset.class_to_idx, f, indent=2)
    print(f"Class mapping saved → {mapping_path}")

    val_size = max(1, int(len(full_dataset) * 0.15))
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    # Apply different transforms to each split
    train_ds.dataset.transform = build_transforms(train=True)
    val_transform = build_transforms(train=False)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,
                              num_workers=args.workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False,
                            num_workers=args.workers, pin_memory=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_acc = 0.0
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        # ── Train ──────────────────────────────────────────────
        model.train()
        train_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(imgs), labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        scheduler.step()

        # ── Validate ───────────────────────────────────────────
        model.train(mode=False)
        correct = total = 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                # Apply val transform per-sample (DataLoader uses train dataset's transform)
                imgs_val = torch.stack([val_transform(
                    transforms.ToPILImage()(img.cpu())) for img in imgs]).to(device)
                preds = model(imgs_val).argmax(1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)
        acc = correct / total if total > 0 else 0.0

        print(f"Epoch {epoch}/{args.epochs}  loss={train_loss/len(train_loader):.4f}  val_acc={acc:.3f}")

        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), out_path)
            print(f"  ✓ Checkpoint saved (best val_acc={best_acc:.3f})")

    print(f"\nTraining complete. Best val_acc: {best_acc:.3f}")
    print(f"Checkpoint: {out_path}")
    print("Restart the FastAPI server to load the new weights.")


if __name__ == "__main__":
    # Try to load .env from backend dir so DISEASE_MODEL_PATH is available
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parent.parent / ".env")
    except ImportError:
        pass

    default_out = os.getenv("DISEASE_MODEL_PATH", "./models/efficientnet_plantvillage.pth")

    parser = argparse.ArgumentParser(description="Fine-tune EfficientNet-B0 on PlantVillage")
    parser.add_argument("--data-dir", required=True,
                        help="Path to PlantVillage color directory (38 class folders)")
    parser.add_argument("--out", default=default_out,
                        help=f"Output checkpoint path (default: {default_out})")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--workers", type=int, default=2)
    train(parser.parse_args())
