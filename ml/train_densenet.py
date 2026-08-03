"""Train DenseNet169 from scratch: frozen head first, then full fine-tune."""
import os, json
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, regularizers
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

DATA_ROOT = r"C:\Users\This PC\Downloads\npk-detection-app\data"
ARTIFACTS_DIR = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts"
CLASSES = ("nitrogen", "phosphorus", "potassium", "healthy")
CROPS = ("maize", "Beans")
SPLITS = ("Training", "Validation", "Testing")
IMAGE_SIZE = 160
BATCH_SIZE = 32
MAX_PER_CLASS = 1000

def list_images(split_dir):
    out = []
    for cls in os.listdir(split_dir):
        cls_dir = os.path.join(split_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        for fn in os.listdir(cls_dir):
            if fn.lower().endswith((".jpg", ".jpeg", ".png")):
                out.append((os.path.join(cls_dir, fn), cls))
    return out

def balanced_sample(items, max_per_class):
    counts = {}
    out = []
    for path, cls in items:
        c = counts.get(cls, 0)
        if c >= max_per_class:
            continue
        counts[cls] = c + 1
        out.append((path, cls))
    return out

def build_index():
    index = {s: [] for s in SPLITS}
    for crop in CROPS:
        for split in SPLITS:
            split_dir = os.path.join(DATA_ROOT, crop, split)
            if not os.path.isdir(split_dir):
                continue
            items = [(p, c) for (p, c) in list_images(split_dir) if c in CLASSES]
            index[split].extend(items)
    for split in SPLITS:
        rng = np.random.default_rng(1337)
        rng.shuffle(index[split])
    return index

def decode_and_resize(path, label, augment):
    img = tf.io.read_file(path)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, (IMAGE_SIZE, IMAGE_SIZE))
    img = tf.cast(img, tf.float32) / 255.0
    if augment:
        img = tf.image.random_flip_left_right(img)
        img = tf.image.random_flip_up_down(img)
        img = tf.image.random_brightness(img, max_delta=0.2)
        img = tf.image.random_contrast(img, lower=0.8, upper=1.2)
        img = tf.image.random_saturation(img, lower=0.8, upper=1.2)
        img = tf.image.random_hue(img, max_delta=0.05)
    return img, label

def make_ds(items, class_to_idx, augment, shuffle):
    paths = [p for p, _ in items]
    labels = [class_to_idx[c] for _, c in items]
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(lambda p, l: decode_and_resize(p, l, augment), num_parallel_calls=tf.data.AUTOTUNE)
    if shuffle:
        ds = ds.shuffle(min(len(items), 4096), seed=1337, reshuffle_each_iteration=True)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

def build_model(num_classes):
    preprocess = tf.keras.applications.densenet.preprocess_input
    base = tf.keras.applications.DenseNet169(
        include_top=False, weights="imagenet",
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3), pooling="avg"
    )
    base.trainable = False

    inputs = layers.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    x = layers.Lambda(lambda t: t * 255.0)(inputs)
    x = layers.Lambda(preprocess)(x)
    feats = base(x, training=False)
    x = layers.Dropout(0.5)(feats)
    x = layers.Dense(256, kernel_regularizer=regularizers.l2(5e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax",
                           kernel_regularizer=regularizers.l2(5e-4))(x)

    model = tf.keras.models.Model(inputs, outputs, name="npk_densenet169")
    return model, base

def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    class_to_idx = {c: i for i, c in enumerate(CLASSES)}
    idx_to_class = {i: c for c, i in class_to_idx.items()}
    num_classes = len(CLASSES)

    print("Building dataset index...")
    index = build_index()
    train_all = balanced_sample(index["Training"], MAX_PER_CLASS)
    val_all = balanced_sample(index["Validation"], 800)
    test_all = balanced_sample(index["Testing"], 400)

    print(f"Train: {len(train_all)}, Val: {len(val_all)}, Test: {len(test_all)}")

    train_ds = make_ds(train_all, class_to_idx, augment=True, shuffle=True)
    val_ds = make_ds(val_all, class_to_idx, augment=False, shuffle=False)
    test_ds = make_ds(test_all, class_to_idx, augment=False, shuffle=False)

    model, base = build_model(num_classes)

    # Stage 1: Train head only (frozen backbone)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=3e-3),
        loss="sparse_categorical_crossentropy",
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")],
    )

    ckpt = os.path.join(ARTIFACTS_DIR, "best_stage1.weights.h5")
    callbacks = [
        EarlyStopping(monitor="val_acc", mode="max", patience=4, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_acc", mode="max", patience=2, factor=0.5, min_lr=1e-6),
        ModelCheckpoint(ckpt, monitor="val_acc", mode="max", save_best_only=True, save_weights_only=True),
    ]

    print("\n=== Stage 1: Frozen backbone ===")
    model.fit(train_ds, validation_data=val_ds, epochs=12, callbacks=callbacks, verbose=1)

    # Stage 2: Fine-tune last 50 layers
    print("\n=== Stage 2: Fine-tuning ===")
    base.trainable = True
    for layer in base.layers[:-50]:
        layer.trainable = False
    for layer in base.layers[-50:]:
        layer.trainable = True

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=5e-5),
        loss="sparse_categorical_crossentropy",
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")],
    )

    callbacks2 = [
        EarlyStopping(monitor="val_acc", mode="max", patience=4, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_acc", mode="max", patience=2, factor=0.5, min_lr=1e-7),
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=15, callbacks=callbacks2, verbose=1)

    # Save
    base.trainable = False
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy",
                  metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")])

    export_dir = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export")
    model.save(export_dir)

    # Evaluate
    results = model.evaluate(test_ds, verbose=1)
    test_acc = float(results[1])

    meta = {
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "image_size": IMAGE_SIZE,
        "model": "densenet169",
        "test_accuracy": test_acc,
        "test_loss": float(results[0]),
    }
    with open(os.path.join(ARTIFACTS_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nTest accuracy: {test_acc:.4f}")
    print(f"Model saved to {export_dir}")

if __name__ == "__main__":
    main()
