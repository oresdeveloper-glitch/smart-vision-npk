import os, sys, json, random, math
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import tensorflow as tf
from tensorflow.keras import layers

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "crop_classifier")
FEATURES_PATH = os.path.join(OUTPUT_DIR, "centroids.json")
IMG_SIZE = 224
NUM_REF = 80


def random_bg():
    c = random.randint(30, 180)
    return Image.new("RGB", (IMG_SIZE, IMG_SIZE), (c, c, c))


def draw_maize_leaf(draw, cx, cy, lw, lh):
    color = (random.randint(30, 90), random.randint(110, 200), random.randint(20, 60))
    draw.polygon([(cx, cy - lh//2), (cx + lw//2, cy), (cx, cy + lh//2), (cx - lw//2, cy)], fill=color)
    for i in range(-lh//4, lh//4, max(lh//10, 3)):
        yy = cy + i
        spread = int(lw * 0.3 * (1 - abs(i) / (lh//2)))
        draw.line([(cx - spread, yy), (cx + spread, yy + random.randint(-2, 2))], fill=(20, 80, 20), width=1)
    return color


def draw_bean_leaf(draw, cx, cy, lw, lh):
    color = (random.randint(20, 70), random.randint(90, 160), random.randint(15, 50))
    draw.ellipse([cx - lw//2, cy - lh//2, cx + lw//2, cy + lh//2], fill=color)
    for _ in range(random.randint(3, 7)):
        sx = cx + random.randint(-lw//3, lw//3)
        sy = cy + random.randint(-lh//3, lh//3)
        ex = sx + random.randint(-lw//3, lw//3)
        ey = sy + random.randint(-lh//3, lh//3)
        draw.line([(sx, sy), (ex, ey)], fill=(25, 70, 25), width=1)
    return color


def generate_maize():
    img = random_bg()
    draw = ImageDraw.Draw(img)
    cx = random.randint(IMG_SIZE//4, IMG_SIZE*3//4)
    cy = random.randint(IMG_SIZE//4, IMG_SIZE*3//4)
    lw = random.randint(IMG_SIZE//3, IMG_SIZE*2//3)
    lh = random.randint(IMG_SIZE//3, IMG_SIZE*3//5)
    draw_maize_leaf(draw, cx, cy, lw, lh)
    if random.random() < 0.3:
        img = img.filter(ImageFilter.GaussianBlur(random.choice([1, 2])))
    return np.asarray(img, dtype=np.float32)


def generate_bean():
    img = random_bg()
    draw = ImageDraw.Draw(img)
    cx = random.randint(IMG_SIZE//4, IMG_SIZE*3//4)
    cy = random.randint(IMG_SIZE//4, IMG_SIZE*3//4)
    lw = random.randint(IMG_SIZE//3, IMG_SIZE//2)
    lh = random.randint(IMG_SIZE//3, IMG_SIZE//2)
    draw_bean_leaf(draw, cx, cy, lw, lh)
    if random.random() < 0.3:
        img = img.filter(ImageFilter.GaussianBlur(random.choice([1, 2])))
    return np.asarray(img, dtype=np.float32)


def main():
    print(f"Generating {NUM_REF} reference images per class...")
    maize_imgs = [generate_maize() for _ in range(NUM_REF)]
    bean_imgs = [generate_bean() for _ in range(NUM_REF)]

    print("Loading EfficientNetB0 feature extractor...")
    base = tf.keras.applications.EfficientNetB0(
        include_top=False, weights="imagenet",
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        pooling="avg"
    )
    base.trainable = False

    print("Extracting features...")
    def extract_batch(imgs):
        x = tf.keras.applications.efficientnet.preprocess_input(np.array(imgs))
        return base(x, training=False).numpy()

    maize_feats = extract_batch(maize_imgs)
    bean_feats = extract_batch(bean_imgs)

    maize_centroid = np.mean(maize_feats, axis=0).tolist()
    bean_centroid = np.mean(bean_feats, axis=0).tolist()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    data = {
        "maize_centroid": maize_centroid,
        "bean_centroid": bean_centroid,
        "feature_dim": len(maize_centroid),
    }
    with open(FEATURES_PATH, "w") as f:
        json.dump(data, f)

    # Validate
    def cosine_sim(a, b):
        a_np = np.array(a)
        b_np = np.array(b)
        return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np)))

    maize_acc = sum(1 for f in maize_feats if cosine_sim(f, maize_centroid) >= cosine_sim(f, bean_centroid))
    bean_acc = sum(1 for f in bean_feats if cosine_sim(f, bean_centroid) >= cosine_sim(f, maize_centroid))
    total_acc = (maize_acc + bean_acc) / (len(maize_feats) + len(bean_feats))
    print(f"In-self accuracy: {total_acc:.3f} ({maize_acc}/{len(maize_feats)} maize, {bean_acc}/{len(bean_feats)} beans)")
    print(f"Centroids saved to {FEATURES_PATH}")


if __name__ == "__main__":
    main()
