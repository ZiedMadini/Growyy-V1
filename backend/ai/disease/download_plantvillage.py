"""
Download PlantVillage dataset from HuggingFace and convert to ImageFolder layout.

Run once before training:
    python -m ai.disease.download_plantvillage

Produces: backend/data/plantvillage/<ClassName>/<image>.jpg
Expected: ~54,000 images across 38 classes.
"""

import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

OUT_DIR = Path(__file__).parent.parent.parent / "data" / "plantvillage"

# Known HuggingFace PlantVillage dataset IDs to try in order
HF_CANDIDATES = [
    "Ashraf-Minhaj/plant-village",
    "planted/plantvillage",
    "mrlab/PlantVillage",
    "jainr3/diffusiondb-plantvillage",
]


def _convert_hf_to_imagefolder(dataset, out_dir: Path, split: str = "train") -> int:
    """Save HuggingFace dataset split as ImageFolder on disk. Returns image count."""
    from PIL import Image as PILImage
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0

    # Detect label column
    label_col = None
    for col in ["label", "labels", "class", "disease_class", "Label"]:
        if col in dataset.column_names:
            label_col = col
            break

    # Detect image column
    img_col = None
    for col in ["image", "img", "Image", "pixel_values"]:
        if col in dataset.column_names:
            img_col = col
            break

    if label_col is None or img_col is None:
        logger.error("Could not find image/label columns. Columns: %s", dataset.column_names)
        return 0

    # Get class names
    features = dataset.features
    if hasattr(features[label_col], "names"):
        class_names = features[label_col].names
    else:
        # Derive from unique values
        unique_labels = sorted(set(dataset[label_col]))
        class_names = [str(x) for x in unique_labels]

    logger.info("Classes (%d): %s ...", len(class_names), class_names[:5])

    for i, sample in enumerate(dataset):
        label_idx = sample[label_col]
        class_name = class_names[label_idx] if isinstance(label_idx, int) else str(label_idx)
        class_dir = out_dir / class_name
        class_dir.mkdir(parents=True, exist_ok=True)

        img = sample[img_col]
        if not isinstance(img, PILImage.Image):
            try:
                img = PILImage.fromarray(img)
            except Exception:
                continue

        img_path = class_dir / f"{i:06d}.jpg"
        if not img_path.exists():
            img.convert("RGB").save(img_path, quality=90)
        count += 1
        if count % 1000 == 0:
            logger.info("  Saved %d images...", count)

    return count


def download() -> bool:
    try:
        from datasets import load_dataset
    except ImportError:
        logger.error("datasets library not installed. Run: pip install datasets")
        return False

    for hf_id in HF_CANDIDATES:
        logger.info("Trying HuggingFace dataset: %s", hf_id)
        try:
            ds = load_dataset(hf_id, trust_remote_code=True)
            split = "train" if "train" in ds else list(ds.keys())[0]
            logger.info("Dataset loaded — split '%s' has %d samples", split, len(ds[split]))
            count = _convert_hf_to_imagefolder(ds[split], OUT_DIR, split)
            if count > 100:
                logger.info("PlantVillage ready: %d images in %s", count, OUT_DIR)
                return True
            logger.warning("Only %d images saved — trying next source", count)
        except Exception as e:
            logger.warning("Failed %s: %s", hf_id, e)

    # Last resort: try downloading segmented version
    try:
        logger.info("Trying plantvillage segmented dataset...")
        ds = load_dataset("Hughes/plantvillage-dataset", trust_remote_code=True)
        split = list(ds.keys())[0]
        count = _convert_hf_to_imagefolder(ds[split], OUT_DIR, split)
        if count > 100:
            logger.info("PlantVillage ready: %d images", count)
            return True
    except Exception as e:
        logger.warning("Failed last-resort: %s", e)

    logger.error("Could not download PlantVillage from any HuggingFace source.")
    logger.error("Manual download: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset")
    logger.error("Extract to: %s", OUT_DIR)
    return False


if __name__ == "__main__":
    success = download()
    sys.exit(0 if success else 1)
