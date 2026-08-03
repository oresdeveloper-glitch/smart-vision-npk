"""Hyperparameter tuning using Keras Tuner to maximize validation accuracy.

Run from the `ml` folder after activating the venv:

python hyperparameter_tune.py

This script performs a RandomSearch over a few key hyperparameters
and saves the best model to `ml/artifacts/npk_resnet50_export_tuned` and
updates `ml/artifacts/meta.json` with the new test accuracy.
"""
import os
import json
import numpy as np
import tensorflow as tf

try:
    import keras_tuner as kt
except Exception as e:
    raise RuntimeError("keras-tuner is required. Install via `pip install keras-tuner`")

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
DATA_ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
DATA_ROOT = os.path.normpath(DATA_ROOT)
IMAGE_SIZE = 160
BATCH_SIZE = 32
CLASSES = ("nitrogen", "phosphorus", "potassium", "healthy")
CROPS = ("maize", "Beans")
SPLITS = ("Training", "Validation", "Testing")


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


def build_index():
    index = {s: [] for s in SPLITS}
    for crop in CROPS:
        for split in SPLITS:
            split_dir = os.path.join(DATA_ROOT, crop, split)
            if not os.path.isdir(split_dir):
                continue
            items = [(p, c) for (p, c) in list_images(split_dir) if c in CLASSES]
            index[split].extend(items)
    rng = np.random.default_rng(1337)
    for split in SPLITS:
        rng.shuffle(index[split])
    return index


def decode_and_resize(path, label, augment=False):
    img = tf.io.read_file(path)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, (IMAGE_SIZE, IMAGE_SIZE))
    img = tf.cast(img, tf.float32) / 255.0
    if augment:
        img = tf.image.random_flip_left_right(img)
        img = tf.image.random_brightness(img, max_delta=0.12)
        img = tf.image.random_contrast(img, lower=0.9, upper=1.1)
    return img, label


def make_ds(items, class_to_idx, augment=False, shuffle=False):
    paths = [p for p, _ in items]
    labels = [class_to_idx[c] for _, c in items]
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(lambda p, l: decode_and_resize(p, l, augment), num_parallel_calls=tf.data.AUTOTUNE)
    if shuffle:
        ds = ds.shuffle(min(len(items), 4096), seed=1337, reshuffle_each_iteration=True)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def model_builder(hp):
    # Tune dropout, dense units, learning rate, and whether to fine-tune backbone
    dropout = hp.Float("dropout", 0.2, 0.6, step=0.1, default=0.3)
    dense_units = hp.Choice("dense_units", [64, 128, 256], default=128)
    lr = hp.Choice("lr", [1e-3, 5e-4, 1e-4, 5e-5], default=5e-4)
    unfreeze = hp.Boolean("unfreeze_backbone", default=False)

    preprocess = tf.keras.applications.mobilenet_v2.preprocess_input
    base = tf.keras.applications.MobileNetV2(include_top=False, weights="imagenet",
                                             input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3), pooling="avg")
    base.trainable = False

    inputs = tf.keras.layers.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))
    x = tf.keras.layers.Lambda(lambda t: t * 255.0)(inputs)
    x = tf.keras.layers.Lambda(preprocess)(x)
    feats = base(x, training=False)
    x = tf.keras.layers.Dropout(dropout)(feats)
    x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
    outputs = tf.keras.layers.Dense(len(CLASSES), activation="softmax")(x)
    model = tf.keras.models.Model(inputs, outputs)

    if unfreeze:
        base.trainable = True
        # keep most layers frozen except last 30
        for layer in base.layers[:-30]:
            layer.trainable = False

    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                  loss="sparse_categorical_crossentropy",
                  metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")])
    return model


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    class_to_idx = {c: i for i, c in enumerate(CLASSES)}
    print("Building dataset index...")
    index = build_index()

    # Use balanced subset to speed tuning
    def balanced(items, max_per_class):
        counts = {}
        out = []
        for p, c in items:
            cnt = counts.get(c, 0)
            if cnt >= max_per_class:
                continue
            counts[c] = cnt + 1
            out.append((p, c))
        return out

    train_items = balanced(index["Training"], 1200)
    val_items = balanced(index["Validation"], 800)
    test_items = balanced(index["Testing"], 400)

    train_ds = make_ds(train_items, class_to_idx, augment=True, shuffle=True)
    val_ds = make_ds(val_items, class_to_idx, augment=False, shuffle=False)
    test_ds = make_ds(test_items, class_to_idx, augment=False, shuffle=False)

    tuner = kt.RandomSearch(
        model_builder,
        objective=kt.Objective("val_acc", direction="max"),
        max_trials=12,
        executions_per_trial=1,
        directory=os.path.join(ARTIFACTS_DIR, "kt_logs"),
        project_name="npk_tuning",
    )

    stop_cb = tf.keras.callbacks.EarlyStopping(monitor="val_acc", mode="max", patience=4, restore_best_weights=True)

    print("Starting hyperparameter search (this may take a while)...")
    tuner.search(train_ds, validation_data=val_ds, epochs=8, callbacks=[stop_cb], verbose=1)

    best_hp = tuner.get_best_hyperparameters(num_trials=1)[0]
    print("Best hyperparameters:", best_hp.values)

    # Build best model and train longer
    model = tuner.hypermodel.build(best_hp)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_acc", mode="max", patience=6, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_acc", mode="max", patience=3, factor=0.5, min_lr=1e-7),
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=30, callbacks=callbacks, verbose=1)

    # Save tuned model
    export_dir = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export_tuned")
    model.save(export_dir)
    print(f"Saved tuned model to {export_dir}")

    # Evaluate on test set
    results = model.evaluate(test_ds, verbose=1)
    test_acc = float(results[1])
    print(f"Tuned test accuracy: {test_acc:.4f}")

    # Update meta.json
    meta_path = os.path.join(ARTIFACTS_DIR, "meta.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            try:
                meta = json.load(f)
            except Exception:
                meta = {}

    meta.update({
        "test_accuracy": test_acc,
        "model": "mobilenetv2-tuned",
        "tuned": True,
    })
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("meta.json updated")


if __name__ == "__main__":
    main()
