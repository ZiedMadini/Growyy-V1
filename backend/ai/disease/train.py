"""
Fine-tune EfficientNet-V2-S on PlantVillage (38 classes).

Downloads data directly from HuggingFace — no manual download needed.

Run:
    python -m ai.disease.train

Produces: backend/models/efficientnet_v2s_plantvillage.pth
Estimated time: ~2h on RTX 3050 (GPU), ~8h on CPU
"""

import logging
import sys
from pathlib import Path

import torch
import timm
from PIL import Image as PILImage
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

OUT_PATH = Path(__file__).parent.parent.parent / "models" / "efficientnet_v2s_plantvillage.pth"
EPOCHS = 20
BATCH = 32
LR = 1e-4

# HuggingFace dataset candidates in priority order
HF_CANDIDATES = [
    "aymen31/PlantVillage",
    "imadhajaz/plantvillage",
    "LamTNguyen/PlantVillage",
    "manoela/plantvillage",
    "hope04302/plantVillageDataset",
    "dpdl-benchmark/plant_village",
    "BrandonFors/Plant-Diseases-PlantVillage-Dataset",
]

from ai.disease.classes import DISEASE_LABELS  # noqa: E402
NUM_CLASSES = len(DISEASE_LABELS)

TRAIN_TF = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.2, 0.2, 0.2, 0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
VAL_TF = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


class HFPlantVillageDataset(Dataset):
    def __init__(self, hf_split, img_col: str, label_col: str,
                 class_names: list, transform=None):
        self._data = hf_split
        self._img_col = img_col
        self._label_col = label_col
        self._transform = transform
        self._label_remap = self._build_remap(class_names)

    def _build_remap(self, src_names: list) -> dict:
        remap: dict = {}
        for src_idx, src_name in enumerate(src_names):
            norm = src_name.lower().replace(" ", "_").replace("-", "_")
            best = -1
            for tgt_idx, tgt_name in enumerate(DISEASE_LABELS):
                tgt_norm = tgt_name.lower().replace(" ", "_")
                if norm == tgt_norm or norm in tgt_norm or tgt_norm in norm:
                    best = tgt_idx
                    break
            remap[src_idx] = best if best >= 0 else (src_idx % NUM_CLASSES)
        return remap

    def __len__(self) -> int:
        return len(self._data)

    def __getitem__(self, idx):
        item = self._data[idx]
        img = item[self._img_col]
        if not isinstance(img, PILImage.Image):
            img = PILImage.fromarray(img)
        img = img.convert("RGB")
        if self._transform:
            img = self._transform(img)
        raw_label = item[self._label_col]
        label = self._label_remap.get(int(raw_label), int(raw_label) % NUM_CLASSES)
        return img, label


def _detect_columns(ds):
    img_col = next((c for c in ["image", "img", "Image", "pixel_values"] if c in ds.column_names), None)
    lbl_col = next((c for c in ["label", "labels", "class", "Label", "disease_class"] if c in ds.column_names), None)
    if img_col is None or lbl_col is None:
        raise ValueError(f"Cannot detect columns in {ds.column_names}")
    return img_col, lbl_col


def _get_class_names(ds, label_col: str) -> list:
    feat = ds.features[label_col]
    if hasattr(feat, "names"):
        return feat.names
    return [str(i) for i in range(NUM_CLASSES)]


def load_hf_dataset():
    from datasets import load_dataset
    for hf_id in HF_CANDIDATES:
        logger.info("Trying %s ...", hf_id)
        try:
            ds = load_dataset(hf_id)
            split = "train" if "train" in ds else list(ds.keys())[0]
            raw = ds[split]
            img_col, lbl_col = _detect_columns(raw)
            class_names = _get_class_names(raw, lbl_col)
            logger.info("Loaded %s: %d samples, %d classes", hf_id, len(raw), len(class_names))
            return raw, img_col, lbl_col, class_names
        except Exception as e:
            logger.warning("Failed %s: %s", hf_id, str(e)[:100])

    raise RuntimeError(
        "Could not load PlantVillage from HuggingFace.\n"
        "Manual download: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset\n"
        f"Extract to: {Path(__file__).parent.parent.parent / 'data' / 'plantvillage'}"
    )


def mixup(x, y, alpha: float = 0.2):
    lam = torch.distributions.Beta(torch.tensor(alpha), torch.tensor(alpha)).sample().item()
    idx = torch.randperm(x.size(0), device=x.device)
    return lam * x + (1 - lam) * x[idx], y, y[idx], lam


def train():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info("Training on %s", device)

    raw, img_col, lbl_col, class_names = load_hf_dataset()

    full_ds = HFPlantVillageDataset(raw, img_col, lbl_col, class_names, transform=TRAIN_TF)
    n_total = len(full_ds)
    n_val = max(100, int(n_total * 0.1))
    n_train = n_total - n_val
    train_ds, val_ds = random_split(full_ds, [n_train, n_val],
                                    generator=torch.Generator().manual_seed(42))

    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True,
                              num_workers=0, pin_memory=(device == "cuda"))
    val_loader = DataLoader(val_ds, batch_size=BATCH, shuffle=False,
                            num_workers=0, pin_memory=(device == "cuda"))

    model = timm.create_model("efficientnetv2_s", pretrained=False, num_classes=NUM_CLASSES)
    model = model.to(device)

    opt = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-2)
    sched = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
    crit = nn.CrossEntropyLoss(label_smoothing=0.1)

    best_acc = 0.0
    patience_count = 0
    PATIENCE = 5

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            xm, ya, yb, lam = mixup(x, y)
            loss = lam * crit(model(xm), ya) + (1 - lam) * crit(model(xm), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
            train_loss += loss.item()
        sched.step()

        model.train(mode=False)
        correct = total = 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                correct += (model(x).argmax(1) == y).sum().item()
                total += y.size(0)
        acc = correct / total if total > 0 else 0.0
        logger.info("Epoch %d/%d  train_loss=%.4f  val_acc=%.4f",
                    epoch + 1, EPOCHS, train_loss / len(train_loader), acc)

        if acc > best_acc:
            best_acc = acc
            patience_count = 0
            OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), OUT_PATH)
            logger.info("  Saved checkpoint (best=%.4f)", best_acc)
        else:
            patience_count += 1
            if patience_count >= PATIENCE:
                logger.info("Early stop — no improvement for %d epochs", PATIENCE)
                break

    logger.info("Done. Best val_acc=%.4f | Checkpoint: %s", best_acc, OUT_PATH)


if __name__ == "__main__":
    train()
