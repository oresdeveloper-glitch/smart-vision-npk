"""Fine-tune the saved model for better per-class accuracy, with class weighting."""
import os, json
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

DATA_ROOT = r"C:\Users\This PC\Downloads\npk-detection-app\data"
ARTIFACTS_DIR = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts"
CLASSES = ("nitrogen", "phosphorus", "potassium", "healthy")
CROPS = ("maize", "Beans")
SPLITS = ("Training", "Validation", "Testing")
IMAGE_SIZE = 160
BATCH_SIZE = int(os.environ.get("NPK_BATCH_SIZE", "8"))
FINETUNE_PER_CLASS = 800
FINETUNE_EPOCHS = 12
FINETUNE_LR = 3e-5
# Higher weight for nitrogen and healthy (harder classes)
CLASS_WEIGHTS = {0: 2.5, 1: 1.5, 2: 1.0, 3: 2.0}

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

def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    class_to_idx = {c: i for i, c in enumerate(CLASSES)}

    print("Building dataset index...")
    index = build_index()
    train_all = balanced_sample(index["Training"], 1500)
    val_all = balanced_sample(index["Validation"], 1000)

    train_ft = balanced_sample(train_all, FINETUNE_PER_CLASS)
    val_ft = balanced_sample(val_all, FINETUNE_PER_CLASS)

    print(f"Training: {len(train_ft)}, Validation: {len(val_ft)}")
    print(f"Class weights: {CLASS_WEIGHTS}")

    train_ds = make_ds(train_ft, class_to_idx, augment=True, shuffle=True)
    val_ds = make_ds(val_ft, class_to_idx, augment=False, shuffle=False)

    export_dir = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export")
    model = tf.keras.models.load_model(export_dir, compile=False)
    print("Loaded saved model")

    # Unfreeze last 40 layers of backbone
    backbone = model.get_layer("mobilenetv2_1.00_160")
    backbone.trainable = True
    for layer in backbone.layers[:-40]:
        layer.trainable = False
    for layer in backbone.layers[-40:]:
        layer.trainable = True
    print(f"Unfroze last 40 layers of {backbone.name}")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=FINETUNE_LR),
        loss="sparse_categorical_crossentropy",
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")],
    )

    callbacks = [
        EarlyStopping(monitor="val_acc", mode="max", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_acc", mode="max", patience=3, factor=0.5, min_lr=1e-7),
    ]

    print(f"\n=== Fine-tuning ({FINETUNE_EPOCHS} epochs, lr={FINETUNE_LR}) ===")
    model.fit(train_ds, validation_data=val_ds, epochs=FINETUNE_EPOCHS,
              class_weight=CLASS_WEIGHTS, callbacks=callbacks, verbose=1)

    # Freeze backbone and save first (before eval)
    backbone.trainable = False
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy",
                  metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")])
    model.save(export_dir)
    print(f"\nModel saved to {export_dir}")

    # Evaluate on test set
    test_all = balanced_sample(index["Testing"], 300)
    test_ds = make_ds(test_all, class_to_idx, augment=False, shuffle=False)
    results = model.evaluate(test_ds, verbose=1)
    test_acc = float(results[1])

    # Update meta.json
    meta_path = os.path.join(ARTIFACTS_DIR, "meta.json")
    with open(meta_path) as f:
        meta = json.load(f)
    meta["test_accuracy"] = test_acc
    meta["test_loss"] = float(results[0])
    meta["finetuned"] = True
    meta["class_weights"] = CLASS_WEIGHTS
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"meta.json updated")

if __name__ == "__main__":
    main()
