"""Retrain the 3-class crop classifier (maize / beans / unknown) using the REAL
UNKNOWN dataset (data/UNKNOWN) instead of purely synthetic non-crop images.

This improves the model's ability to reject real-world non-crop photos while
still being seeded with synthetic patterns for robustness.
"""
import os, sys, json, random
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import tensorflow as tf
from tensorflow.keras import layers

DATA_ROOT = r"C:\Users\This PC\Downloads\npk-detection-app\data"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "crop_classifier")
IMG_SIZE = 224
NUM_PER_CLASS = 700      # maize / beans real images
NUM_UNKNOWN_REAL = 7000  # cap real unknown images used for training
NUM_UNKNOWN_SYN = 1500   # synthetic supplement

CLASS_NAMES = ["maize", "beans", "unknown"]


def list_images(crop, split):
    out = []
    split_dir = os.path.join(DATA_ROOT, crop, split)
    if not os.path.isdir(split_dir):
        return out
    for cls in os.listdir(split_dir):
        cls_dir = os.path.join(split_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        for fn in os.listdir(cls_dir):
            if fn.lower().endswith((".jpg", ".jpeg", ".png")):
                out.append(os.path.join(cls_dir, fn))
    return out


def list_unknown_images(split):
    """Real unknown images from data/UNKNOWN/<split>."""
    out = []
    split_dir = os.path.join(DATA_ROOT, "UNKNOWN", split)
    if not os.path.isdir(split_dir):
        return out
    for fn in os.listdir(split_dir):
        if fn.lower().endswith((".jpg", ".jpeg", ".png")):
            out.append(os.path.join(split_dir, fn))
    return out


def load_images(paths, n, seed=42):
    if n > 0 and len(paths) > n:
        rng = random.Random(seed)
        paths = rng.sample(paths, n)
    imgs = []
    for p in paths:
        try:
            img = Image.open(p).convert("RGB")
            img = ImageOps.fit(img, (IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)
            imgs.append(np.asarray(img, dtype=np.float32))
        except Exception:
            continue
        if n > 0 and len(imgs) >= n:
            break
    return imgs


def random_bg():
    c = random.randint(20, 220)
    mode = random.random()
    if mode < 0.3:
        return Image.new("RGB", (IMG_SIZE, IMG_SIZE), (c, c, c))
    img = Image.new("RGB", (IMG_SIZE, IMG_SIZE))
    px = img.load()
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            r = c + random.randint(-30, 30)
            g = c + random.randint(-30, 30)
            b = c + random.randint(-30, 30)
            px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
    return img


def generate_unknown():
    """Synthetic non-crop images (supplemental to real unknown data)."""
    kind = random.random()
    if kind < 0.25:
        return np.asarray(random_bg(), dtype=np.float32)
    if kind < 0.5:
        img = Image.new("RGB", (IMG_SIZE, IMG_SIZE))
        px = img.load()
        c1 = [random.randint(0, 255) for _ in range(3)]
        c2 = [random.randint(0, 255) for _ in range(3)]
        for y in range(IMG_SIZE):
            t = y / IMG_SIZE
            for x in range(IMG_SIZE):
                px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
        return np.asarray(img, dtype=np.float32)
    if kind < 0.75:
        img = random_bg()
        draw = ImageDraw.Draw(img)
        for _ in range(random.randint(2, 8)):
            x = random.randint(0, IMG_SIZE)
            y = random.randint(0, IMG_SIZE)
            s = random.randint(10, 90)
            color = tuple(random.randint(0, 255) for _ in range(3))
            shape = random.random()
            if shape < 0.33:
                draw.rectangle([x - s, y - s, x + s, y + s], fill=color)
            elif shape < 0.66:
                draw.ellipse([x - s, y - s, x + s, y + s], fill=color)
            else:
                draw.polygon([(x, y - s), (x + s, y), (x, y + s), (x - s, y)], fill=color)
        return np.asarray(img, dtype=np.float32)
    img = random_bg()
    draw = ImageDraw.Draw(img)
    c = random.choice([True, False])
    if c:
        for i in range(0, IMG_SIZE, random.randint(8, 24)):
            draw.line([(i, 0), (i, IMG_SIZE)], fill=tuple(random.randint(0, 255) for _ in range(3)), width=random.randint(2, 6))
    else:
        for i in range(0, IMG_SIZE, random.randint(8, 24)):
            draw.line([(0, i), (IMG_SIZE, i)], fill=tuple(random.randint(0, 255) for _ in range(3)), width=random.randint(2, 6))
    if random.random() < 0.4:
        img = img.filter(ImageFilter.GaussianBlur(random.choice([1, 2, 3])))
    return np.asarray(img, dtype=np.float32)


def build_head(feat_dim, num_classes):
    inp = layers.Input(shape=(feat_dim,))
    x = layers.Dense(256, activation="relu")(inp)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation="relu")(x)
    out = layers.Dense(num_classes, activation="softmax")(x)
    m = tf.keras.models.Model(inp, out)
    m.compile(optimizer=tf.keras.optimizers.Adam(5e-4),
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])
    return m


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Loading EfficientNetB0 feature extractor...")
    base = tf.keras.applications.EfficientNetB0(
        include_top=False, weights="imagenet",
        input_shape=(IMG_SIZE, IMG_SIZE, 3), pooling="avg"
    )
    base.trainable = False

    def extract(imgs, batch_size=32):
        feats = []
        for i in range(0, len(imgs), batch_size):
            batch = np.array(imgs[i:i + batch_size])
            x = tf.keras.applications.efficientnet.preprocess_input(batch)
            feats.append(base(x, training=False).numpy())
            if (i // batch_size) % 25 == 0:
                print(f"  extracted {min(i + batch_size, len(imgs))}/{len(imgs)}")
        return np.concatenate(feats, axis=0)

    # ---- Real maize / beans (train split) ----
    print(f"Loading maize/beans real images...")
    maize_paths = list_images("maize", "Training")
    bean_paths = list_images("Beans", "Training")
    maize_imgs = load_images(maize_paths, NUM_PER_CLASS, seed=1)
    bean_imgs = load_images(bean_paths, NUM_PER_CLASS, seed=2)
    print(f"  maize: {len(maize_imgs)}, beans: {len(bean_imgs)}")

    # ---- Real unknown (train split) ----
    unknown_train_paths = list_unknown_images("Training")
    print(f"Real unknown train images found: {len(unknown_train_paths)}")
    # Hold out a portion of real unknown for a robust validation set
    rng = random.Random(7)
    unknown_train_paths = rng.sample(unknown_train_paths, len(unknown_train_paths))
    n_hold = min(len(unknown_train_paths) // 5, 1200)
    unknown_val_paths = unknown_train_paths[:n_hold]
    unknown_tr_paths = unknown_train_paths[n_hold:]
    unknown_real_tr = load_images(unknown_tr_paths, NUM_UNKNOWN_REAL, seed=3)
    unknown_real_val = load_images(unknown_val_paths, -1, seed=4)
    print(f"  unknown real train: {len(unknown_real_tr)}, holdout val: {len(unknown_real_val)}")

    # ---- Synthetic unknown supplement (train only) ----
    unknown_syn = [generate_unknown() for _ in range(NUM_UNKNOWN_SYN)]
    print(f"  unknown synthetic: {len(unknown_syn)}")

    unknown_tr_imgs = unknown_real_tr + unknown_syn
    print(f"Total unknown train: {len(unknown_tr_imgs)}")

    print("Extracting features...")
    maize_feats = extract(maize_imgs)
    bean_feats = extract(bean_imgs)
    unknown_tr_feats = extract(unknown_tr_imgs)
    unknown_val_feats = extract(unknown_real_val)

    # Train set
    X_tr = np.concatenate([maize_feats, bean_feats, unknown_tr_feats], axis=0)
    y_tr = np.concatenate([
        np.zeros(len(maize_feats)),
        np.ones(len(bean_feats)),
        np.full(len(unknown_tr_feats), 2),
    ]).astype(np.int32)

    # Validation set (use holdout real unknown + a sample of maize/beans)
    maize_val_paths = list_images("maize", "Validation") + list_images("maize", "Testing")
    bean_val_paths = list_images("Beans", "Validation") + list_images("Beans", "Testing")
    maize_val_imgs = load_images(maize_val_paths, 300, seed=5)
    bean_val_imgs = load_images(bean_val_paths, 300, seed=6)
    maize_val_feats = extract(maize_val_imgs)
    bean_val_feats = extract(bean_val_imgs)
    X_val = np.concatenate([maize_val_feats, bean_val_feats, unknown_val_feats], axis=0)
    y_val = np.concatenate([
        np.zeros(len(maize_val_feats)),
        np.ones(len(bean_val_feats)),
        np.full(len(unknown_val_feats), 2),
    ]).astype(np.int32)

    # Shuffle train
    prng = np.random.default_rng(1337)
    perm = prng.permutation(len(X_tr))
    X_tr, y_tr = X_tr[perm], y_tr[perm]

    print(f"Training MLP head on features: {len(X_tr)} train, {len(X_val)} val, {X_tr.shape[1]} dims")
    print(f"  Train class counts: maize={np.sum(y_tr==0)}, beans={np.sum(y_tr==1)}, unknown={np.sum(y_tr==2)}")
    print(f"  Val class counts:   maize={np.sum(y_val==0)}, beans={np.sum(y_val==1)}, unknown={np.sum(y_val==2)}")

    model = build_head(X_tr.shape[1], len(CLASS_NAMES))
    model.fit(X_tr, y_tr, validation_data=(X_val, y_val),
              epochs=40, batch_size=64, verbose=1,
              class_weight={0: 1.0, 1: 1.0, 2: 0.9},
              callbacks=[
                  tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=8, restore_best_weights=True),
                  tf.keras.callbacks.ReduceLROnPlateau(monitor="val_accuracy", patience=4, factor=0.5, min_lr=1e-6),
              ])

    val_acc = float(model.evaluate(X_val, y_val, verbose=0)[1])
    print(f"Validation accuracy: {val_acc:.4f}")

    # Per-class accuracy on validation
    y_pred = np.argmax(model.predict(X_val, verbose=0), axis=1)
    per_class = {}
    for ci, name in enumerate(CLASS_NAMES):
        mask = y_val == ci
        per_class[name] = float(np.mean(y_pred[mask] == ci)) if mask.sum() else 0.0
    print(f"Per-class accuracy: {per_class}")

    meta = {
        "class_names": CLASS_NAMES,
        "feature_dim": X_tr.shape[1],
        "image_size": IMG_SIZE,
        "val_accuracy": val_acc,
        "per_class_accuracy": per_class,
        "num_train": len(X_tr),
        "num_val": len(X_val),
        "uses_real_unknown": True,
    }

    model.save(os.path.join(OUTPUT_DIR, "crop_classifier_3class"))
    with open(os.path.join(OUTPUT_DIR, "classifier_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # Centroids for similarity gate (use real unknown among them)
    centroids = {
        "maize_centroid": np.mean(maize_feats, axis=0).tolist(),
        "bean_centroid": np.mean(bean_feats, axis=0).tolist(),
        "unknown_centroid": np.mean(np.concatenate([unknown_tr_feats, unknown_val_feats], axis=0), axis=0).tolist(),
        "feature_dim": X_tr.shape[1],
    }
    with open(os.path.join(OUTPUT_DIR, "centroids.json"), "w") as f:
        json.dump(centroids, f)
    print(f"Saved classifier + centroids to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
