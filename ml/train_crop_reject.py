"""Train a 3-class crop classifier (maize / beans / unknown) on EfficientNetB0 features.
Unknown class is built from synthetic non-crop images so the app can reject photos
that are not a maize or bean leaf."""
import os, sys, json, random
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import tensorflow as tf
from tensorflow.keras import layers

DATA_ROOT = r"C:\Users\This PC\Downloads\npk-detection-app\data"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "crop_classifier")
IMG_SIZE = 224
NUM_PER_CLASS = 600
NUM_UNKNOWN = 900

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


def sample_real(crop, n):
    paths = list_images(crop, "Training") + list_images(crop, "Validation") + list_images(crop, "Testing")
    if len(paths) > n:
        random.seed(42)
        paths = random.sample(paths, n)
    imgs = []
    for p in paths:
        try:
            img = Image.open(p).convert("RGB")
            img = ImageOps.fit(img, (IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)
            imgs.append(np.asarray(img, dtype=np.float32))
        except Exception:
            continue
        if len(imgs) >= n:
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
    kind = random.random()
    if kind < 0.25:
        # pure noise
        return np.asarray(random_bg(), dtype=np.float32)
    if kind < 0.5:
        # gradient
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
        # random shapes (not leaf-like)
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
    # textured checker / stripes
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
    x = layers.Dense(128, activation="relu")(inp)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation="relu")(x)
    out = layers.Dense(num_classes, activation="softmax")(x)
    m = tf.keras.models.Model(inp, out)
    m.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
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

    def extract(imgs):
        x = tf.keras.applications.efficientnet.preprocess_input(np.array(imgs))
        return base(x, training=False).numpy()

    print(f"Sampling real maize ({NUM_PER_CLASS}) and beans ({NUM_PER_CLASS})...")
    maize_imgs = sample_real("maize", NUM_PER_CLASS)
    bean_imgs = sample_real("Beans", NUM_PER_CLASS)
    print(f"  maize: {len(maize_imgs)} images, beans: {len(bean_imgs)} images")

    print(f"Generating unknown (non-crop) images ({NUM_UNKNOWN})...")
    unknown_imgs = [generate_unknown() for _ in range(NUM_UNKNOWN)]

    print("Extracting features...")
    maize_feats = extract(maize_imgs)
    bean_feats = extract(bean_imgs)
    unknown_feats = extract(unknown_imgs)

    X = np.concatenate([maize_feats, bean_feats, unknown_feats], axis=0)
    y = np.concatenate([
        np.zeros(len(maize_feats)),
        np.ones(len(bean_feats)),
        np.full(len(unknown_feats), 2),
    ]).astype(np.int32)

    rng = np.random.default_rng(1337)
    perm = rng.permutation(len(X))
    X, y = X[perm], y[perm]
    n_val = int(len(X) * 0.15)
    X_val, y_val = X[:n_val], y[:n_val]
    X_tr, y_tr = X[n_val:], y[n_val:]

    print(f"Training MLP head on features: {len(X_tr)} train, {len(X_val)} val, {X.shape[1]} dims")
    model = build_head(X.shape[1], len(CLASS_NAMES))
    model.fit(X_tr, y_tr, validation_data=(X_val, y_val),
              epochs=30, batch_size=32, verbose=1,
              callbacks=[
                  tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=6, restore_best_weights=True),
                  tf.keras.callbacks.ReduceLROnPlateau(monitor="val_accuracy", patience=3, factor=0.5, min_lr=1e-6),
              ])

    val_acc = float(model.evaluate(X_val, y_val, verbose=0)[1])
    print(f"Validation accuracy: {val_acc:.4f}")

    # Evaluate rejection quality: unknown recall and crop precision
    y_pred = np.argmax(model.predict(X, verbose=0), axis=1)
    per_class = {}
    for ci, name in enumerate(CLASS_NAMES):
        mask = y == ci
        per_class[name] = float(np.mean(y_pred[mask] == ci)) if mask.sum() else 0.0
    print(f"Per-class accuracy: {per_class}")

    meta = {
        "class_names": CLASS_NAMES,
        "feature_dim": X.shape[1],
        "image_size": IMG_SIZE,
        "val_accuracy": val_acc,
        "per_class_accuracy": per_class,
        "num_train": len(X_tr),
        "num_val": len(X_val),
    }

    model.save(os.path.join(OUTPUT_DIR, "crop_classifier_3class"))
    with open(os.path.join(OUTPUT_DIR, "classifier_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # Also save centroids for the 3 classes for a fallback similarity gate
    centroids = {
        "maize_centroid": np.mean(maize_feats, axis=0).tolist(),
        "bean_centroid": np.mean(bean_feats, axis=0).tolist(),
        "unknown_centroid": np.mean(unknown_feats, axis=0).tolist(),
        "feature_dim": X.shape[1],
    }
    with open(os.path.join(OUTPUT_DIR, "centroids.json"), "w") as f:
        json.dump(centroids, f)
    print(f"Saved classifier + centroids to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
