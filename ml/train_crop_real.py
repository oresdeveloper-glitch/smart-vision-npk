import os, sys, json, random
import numpy as np
from PIL import Image

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import tensorflow as tf
tf.get_logger().setLevel("ERROR")

DATA_ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts", "crop_classifier")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

IMG_SIZE = 224
MAX_PER_CLASS = 500
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

def list_images(crop_dir: str, max_count: int):
    paths = []
    for split in ("Training", "Validation", "Testing"):
        split_dir = os.path.join(crop_dir, split)
        if not os.path.isdir(split_dir):
            continue
        for cls in sorted(os.listdir(split_dir)):
            cls_dir = os.path.join(split_dir, cls)
            if not os.path.isdir(cls_dir):
                continue
            for fn in os.listdir(cls_dir):
                if fn.lower().endswith((".jpg", ".jpeg", ".png")):
                    paths.append(os.path.join(cls_dir, fn))
    random.shuffle(paths)
    return paths[:max_count]

print("Loading EfficientNetB0 feature extractor...")
extractor = tf.keras.applications.EfficientNetB0(
    include_top=False, weights="imagenet",
    input_shape=(IMG_SIZE, IMG_SIZE, 3), pooling="avg"
)

def batch_extract(paths: list, batch_size: int = 32):
    feats = []
    for i in range(0, len(paths), batch_size):
        batch_paths = paths[i:i+batch_size]
        batch = []
        for p in batch_paths:
            img = Image.open(p).convert("RGB").resize((IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)
            batch.append(np.asarray(img, dtype=np.float32))
        x = tf.keras.applications.efficientnet.preprocess_input(np.array(batch))
        feats.extend(extractor(x, training=False).numpy())
        print(f"  processed {min(i+batch_size, len(paths))}/{len(paths)}")
    return feats

print("Scanning dataset...")
maize_paths = list_images(os.path.join(DATA_ROOT, "maize"), MAX_PER_CLASS)
bean_paths = list_images(os.path.join(DATA_ROOT, "Beans"), MAX_PER_CLASS)
print(f"Maize: {len(maize_paths)} images, Beans: {len(bean_paths)} images")

print("Extracting maize features...")
maize_feats = batch_extract(maize_paths)

print("Extracting bean features...")
bean_feats = batch_extract(bean_paths)

maize_centroid = np.mean(maize_feats, axis=0).tolist()
bean_centroid = np.mean(bean_feats, axis=0).tolist()

def cosine_sim(a, b):
    a_np = np.array(a, dtype=np.float64)
    b_np = np.array(b, dtype=np.float64)
    na = np.linalg.norm(a_np)
    nb = np.linalg.norm(b_np)
    if na < 1e-10 or nb < 1e-10:
        return 0.0
    return float(np.dot(a_np, b_np) / (na * nb))

# In-self accuracy
m_correct = sum(1 for f in maize_feats if cosine_sim(f, maize_centroid) > cosine_sim(f, bean_centroid))
b_correct = sum(1 for f in bean_feats if cosine_sim(f, bean_centroid) >= cosine_sim(f, maize_centroid))
total_acc = (m_correct + b_correct) / (len(maize_feats) + len(bean_feats))
print(f"\nIn-self accuracy: {total_acc:.4f} ({m_correct}/{len(maize_feats)} maize, {b_correct}/{len(bean_feats)} beans)")

centroids = {
    "maize_centroid": maize_centroid,
    "bean_centroid": bean_centroid,
}
path = os.path.join(ARTIFACTS_DIR, "centroids.json")
with open(path, "w") as f:
    json.dump(centroids, f)
print(f"Centroids saved to {path}")
