"""Improved CNN training: Frozen MobileNetV2 with strong regularization, best checkpoint saving."""
import os, json
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

DATA_ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
CLASSES = ("nitrogen", "phosphorus", "potassium", "healthy")
CROPS = ("maize", "Beans")
SPLITS = ("Training", "Validation", "Testing")
IMAGE_SIZE = 160
BATCH_SIZE = 32
MAX_PER_CLASS = 1500
EPOCHS = 20
INITIAL_EPOCH = int(os.environ.get("NPK_INITIAL_EPOCH", "0"))
TOTAL_EPOCHS = int(os.environ.get("NPK_TOTAL_EPOCHS", str(EPOCHS + INITIAL_EPOCH)))
RESUME_FROM_CHECKPOINT = os.environ.get("NPK_RESUME_FROM_CHECKPOINT", "1").lower() not in {"0", "false", "no"}

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
        img = tf.image.random_crop(img, (IMAGE_SIZE, IMAGE_SIZE, 3))
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
    preprocess = tf.keras.applications.mobilenet_v2.preprocess_input
    base = tf.keras.applications.MobileNetV2(
        include_top=False, weights="imagenet",
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3), pooling="avg"
    )
    base.trainable = False

    inputs = layers.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    x = layers.Lambda(lambda t: t * 255.0)(inputs)
    x = layers.Lambda(preprocess)(x)
    feats = base(x, training=False)
    x = layers.Dropout(0.5)(feats)
    x = layers.Dense(128, kernel_regularizer=regularizers.l2(1e-3))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax",
                           kernel_regularizer=regularizers.l2(1e-3))(x)

    model = models.Model(inputs, outputs, name="npk_mobilenetv2")
    return model

def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    class_to_idx = {c: i for i, c in enumerate(CLASSES)}
    idx_to_class = {i: c for c, i in class_to_idx.items()}
    num_classes = len(CLASSES)

    print("Building dataset index...")
    index = build_index()
    for split in SPLITS:
        print(f"  {split}: {len(index[split])} total")

    train_all = balanced_sample(index["Training"], MAX_PER_CLASS)
    val_all = balanced_sample(index["Validation"], MAX_PER_CLASS)
    test_all = balanced_sample(index["Testing"], MAX_PER_CLASS)

    print(f"  Training: {len(train_all)}")
    print(f"  Validation: {len(val_all)}")
    print(f"  Testing: {len(test_all)}")

    train_ds = make_ds(train_all, class_to_idx, augment=True, shuffle=True)
    val_ds = make_ds(val_all, class_to_idx, augment=False, shuffle=False)
    test_ds = make_ds(test_all, class_to_idx, augment=False, shuffle=False)

    model = build_model(num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=3e-3),
        loss="sparse_categorical_crossentropy",
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")],
    )

    ckpt_path = os.path.join(ARTIFACTS_DIR, "best_model.weights.h5")
    if RESUME_FROM_CHECKPOINT and os.path.exists(ckpt_path):
        print(f"Loading existing weights from {ckpt_path}")
        model.load_weights(ckpt_path)

    callbacks = [
        EarlyStopping(monitor="val_acc", mode="max", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_acc", mode="max", patience=3, factor=0.5, min_lr=1e-6),
        ModelCheckpoint(ckpt_path, monitor="val_acc", mode="max", save_best_only=True, save_weights_only=True),
    ]

    print(f"\n=== Training frozen MobileNetV2 (epochs {INITIAL_EPOCH}-{TOTAL_EPOCHS-1}, total {TOTAL_EPOCHS - INITIAL_EPOCH}) ===")
    model.fit(train_ds, validation_data=val_ds, epochs=TOTAL_EPOCHS, initial_epoch=INITIAL_EPOCH, callbacks=callbacks, verbose=1)

    # Restore best weights and evaluate
    if os.path.exists(ckpt_path):
        model.load_weights(ckpt_path)
    print("\n=== Evaluating on test set ===")
    results = model.evaluate(test_ds, verbose=1)
    test_acc = float(results[1])
    print(f"Test accuracy: {test_acc:.4f}")

    export_dir = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export")
    os.makedirs(export_dir, exist_ok=True)
    model.save(export_dir)

    meta = {
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "image_size": IMAGE_SIZE,
        "model": "mobilenetv2",
        "test_accuracy": test_acc,
        "test_loss": float(results[0]),
    }
    with open(os.path.join(ARTIFACTS_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved to {export_dir} | acc={test_acc:.4f}")

if __name__ == "__main__":
    main()
