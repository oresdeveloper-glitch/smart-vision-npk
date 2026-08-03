import os
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict

import numpy as np

# Training stack: TensorFlow / Keras
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau


@dataclass(frozen=True)
class DatasetSpec:
    data_root: str
    crop_types: Tuple[str, ...] = ("maize", "Beans")
    classes: Tuple[str, ...] = ("nitrogen", "phosphorus", "potassium", "healthy")
    splits: Tuple[str, ...] = ("Training", "Validation", "Testing")


def list_images(split_dir: str) -> List[Tuple[str, str]]:
    """Return [(image_path, class_name), ...]"""
    out: List[Tuple[str, str]] = []
    for cls in sorted(os.listdir(split_dir)):
        cls_dir = os.path.join(split_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        for fn in os.listdir(cls_dir):
            if fn.lower().endswith((".jpg", ".jpeg", ".png")):
                out.append((os.path.join(cls_dir, fn), cls))
    return out


def build_file_index(spec: DatasetSpec) -> Dict[str, List[Tuple[str, str]]]:
    index: Dict[str, List[Tuple[str, str]]] = {s: [] for s in spec.splits}

    for crop in spec.crop_types:
        for split in spec.splits:
            split_dir = os.path.join(spec.data_root, crop, split)
            if not os.path.isdir(split_dir):
                raise FileNotFoundError(f"Missing split dir: {split_dir}")

            items = list_images(split_dir)
            # Only keep known classes
            items = [(p, c) for (p, c) in items if c in spec.classes]
            index[split].extend(items)

    # Shuffle deterministically
    for split in spec.splits:
        rng = np.random.default_rng(1337)
        rng.shuffle(index[split])

    return index


def limit_items_per_class(items: List[Tuple[str, str]], max_per_class: int) -> List[Tuple[str, str]]:
    if max_per_class <= 0:
        return items

    counts: Dict[str, int] = {}
    limited: List[Tuple[str, str]] = []
    for path, cls in items:
        count = counts.get(cls, 0)
        if count >= max_per_class:
            continue
        counts[cls] = count + 1
        limited.append((path, cls))
    return limited


def decode_and_resize(path: tf.Tensor, label: tf.Tensor, image_size: int, augment: bool):
    img_bytes = tf.io.read_file(path)
    img = tf.image.decode_image(img_bytes, channels=3, expand_animations=False)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, (image_size, image_size))
    img = tf.cast(img, tf.float32) / 255.0

    if augment:
        # Light augmentations suitable for leaf images
        img = tf.image.random_flip_left_right(img)
        img = tf.image.random_brightness(img, max_delta=0.1)
        img = tf.image.random_contrast(img, lower=0.9, upper=1.1)

    return img, label


def make_tf_dataset(items: List[Tuple[str, str]], class_to_idx: Dict[str, int], *,
                     image_size: int, batch_size: int, augment: bool, shuffle: bool):
    paths = [p for (p, _) in items]
    labels = [class_to_idx[c] for (_, c) in items]

    path_ds = tf.data.Dataset.from_tensor_slices(paths)
    label_ds = tf.data.Dataset.from_tensor_slices(labels)
    ds = tf.data.Dataset.zip((path_ds, label_ds))

    def _map(path, label):
        return decode_and_resize(path, label, image_size=image_size, augment=augment)

    ds = ds.map(_map, num_parallel_calls=tf.data.AUTOTUNE)
    if shuffle:
        ds = ds.shuffle(buffer_size=min(len(items), 2048), seed=1337, reshuffle_each_iteration=True)

    ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    return ds


class PatchExtract(layers.Layer):
    def __init__(self, patch_size: int, **kwargs):
        super().__init__(**kwargs)
        self.patch_size = patch_size

    def call(self, images):
        batch_size = tf.shape(images)[0]
        patches = tf.image.extract_patches(
            images=images,
            sizes=[1, self.patch_size, self.patch_size, 1],
            strides=[1, self.patch_size, self.patch_size, 1],
            rates=[1, 1, 1, 1],
            padding="VALID",
        )
        patch_dims = patches.shape[-1]
        patches = tf.reshape(patches, [batch_size, -1, patch_dims])
        return patches


class PatchEmbedding(layers.Layer):
    def __init__(self, num_patches: int, embed_dim: int, **kwargs):
        super().__init__(**kwargs)
        self.num_patches = num_patches
        self.embed_dim = embed_dim
        self.proj = layers.Dense(embed_dim)
        self.pos_embed = layers.Embedding(input_dim=num_patches, output_dim=embed_dim)

    def call(self, patches):
        positions = tf.range(start=0, limit=self.num_patches, delta=1)
        projected = self.proj(patches)
        embedded = projected + self.pos_embed(positions)
        return embedded


class TransformerBlock(layers.Layer):
    def __init__(self, embed_dim: int, num_heads: int, mlp_ratio: float = 2.0, dropout: float = 0.1, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.mlp_ratio = mlp_ratio
        self.dropout = dropout

        self.attn = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.norm1 = layers.LayerNormalization(epsilon=1e-6)
        self.norm2 = layers.LayerNormalization(epsilon=1e-6)

        self.mlp_dense1 = layers.Dense(int(embed_dim * mlp_ratio), activation="gelu")
        self.mlp_dense2 = layers.Dense(embed_dim)
        self.drop1 = layers.Dropout(dropout)
        self.drop2 = layers.Dropout(dropout)

    def call(self, x, training=None):
        attn_out = self.attn(x, x, training=training)
        attn_out = self.drop1(attn_out, training=training)
        x = self.norm1(x + attn_out)

        mlp_out = self.mlp_dense1(x)
        mlp_out = self.mlp_dense2(mlp_out)
        mlp_out = self.drop2(mlp_out, training=training)
        x = self.norm2(x + mlp_out)
        return x


def build_vit_backbone(image_size: int, embed_dim: int, num_heads: int, num_layers: int, patch_size: int):
    if image_size % patch_size != 0:
        raise ValueError(f"ViT requires image_size divisible by patch_size. image_size={image_size}, patch_size={patch_size}")

    num_patches = (image_size // patch_size) ** 2

    inputs = layers.Input(shape=(image_size, image_size, 3))

    patches = PatchExtract(patch_size)(inputs)
    x = PatchEmbedding(num_patches=num_patches, embed_dim=embed_dim)(patches)

    for _ in range(num_layers):
        x = TransformerBlock(embed_dim=embed_dim, num_heads=num_heads)(x)

    x = layers.LayerNormalization(epsilon=1e-6)(x)
    x = layers.GlobalAveragePooling1D()(x)

    model = models.Model(inputs, x, name="vit_backbone")
    return model


def build_backbone(backbone: str, image_size: int):
    b = backbone.lower().strip()

    if b.startswith("efficientnetb"):
        ver = int(b.replace("efficientnetb", ""))
        fn = getattr(tf.keras.applications, f"EfficientNetB{ver}")
        preprocess = tf.keras.applications.efficientnet.preprocess_input
        base = fn(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "densenet169":
        preprocess = tf.keras.applications.densenet.preprocess_input
        base = tf.keras.applications.DenseNet169(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "resnet50":
        preprocess = tf.keras.applications.resnet.preprocess_input
        base = tf.keras.applications.ResNet50(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "mobilenetv2":
        preprocess = tf.keras.applications.mobilenet_v2.preprocess_input
        base = tf.keras.applications.MobileNetV2(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "inceptionv3":
        preprocess = tf.keras.applications.inception_v3.preprocess_input
        # InceptionV3 has historically favored 299; but we will still resize to image_size.
        base = tf.keras.applications.InceptionV3(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "vgg16":
        preprocess = tf.keras.applications.vgg16.preprocess_input
        base = tf.keras.applications.VGG16(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "vgg19":
        preprocess = tf.keras.applications.vgg19.preprocess_input
        base = tf.keras.applications.VGG19(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
        base.trainable = False
        return base, preprocess

    if b == "vit":
        preprocess = lambda x: x  # already scaled to [0,1]
        base = build_vit_backbone(
            image_size=image_size,
            embed_dim=int(os.environ.get("NPK_VIT_EMBED_DIM", "192")),
            num_heads=int(os.environ.get("NPK_VIT_NUM_HEADS", "3")),
            num_layers=int(os.environ.get("NPK_VIT_NUM_LAYERS", "4")),
            patch_size=int(os.environ.get("NPK_VIT_PATCH_SIZE", "16")),
        )
        return base, preprocess

    raise ValueError(f"Unsupported backbone: {backbone}")


def build_model(backbone: str, num_classes: int, image_size: int):
    base, preprocess = build_backbone(backbone, image_size)

    inputs = layers.Input(shape=(image_size, image_size, 3))

    # NOTE: existing pipeline divides by 255. For ImageNet preprocess_input, we re-scale to 0..255 first.
    x = inputs
    if backbone.lower().strip() != "vit":
        x = layers.Lambda(lambda t: t * 255.0)(x)

    x = layers.Lambda(lambda t: preprocess(t))(x)
    feats = base(x, training=False)

    x = layers.Dropout(0.25)(feats)
    x = layers.Dense(128, activation="relu")(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs, name=f"npk_{backbone}")
    return model


def train_and_export(backbone: str, train_items, val_items, test_items, class_to_idx, image_size: int, batch_size: int, epochs: int, max_train_per_class: int, max_eval_per_class: int, artifacts_dir: str):

    num_classes = len(class_to_idx)

    train_ds = make_tf_dataset(train_items, class_to_idx, image_size=image_size, batch_size=batch_size, augment=True, shuffle=True)
    val_ds = make_tf_dataset(val_items, class_to_idx, image_size=image_size, batch_size=batch_size, augment=False, shuffle=False)
    test_ds = make_tf_dataset(test_items, class_to_idx, image_size=image_size, batch_size=batch_size, augment=False, shuffle=False)

    model = build_model(backbone=backbone, num_classes=num_classes, image_size=image_size)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=[tf.keras.metrics.SparseCategoricalAccuracy(name="acc")],
    )

    ckpt_path = os.path.join(artifacts_dir, f"best.ckpt.{backbone}")

    callbacks = [
        EarlyStopping(monitor="val_acc", mode="max", patience=3, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_acc", mode="max", patience=3, factor=0.5, min_lr=1e-6),
        tf.keras.callbacks.ModelCheckpoint(ckpt_path, monitor="val_acc", mode="max", save_best_only=True, save_weights_only=True),
    ]

    print(f"Training backbone: {backbone} ...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1,
    )

    # Save training history per backbone (train vs validation accuracy/loss by epoch)
    history_path = os.path.join(artifacts_dir, f"history_{backbone}.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history.history, f)

    # Ensure we always have explicit per-epoch columns for accuracy/loss (train vs val)
    # even if Keras stores metric names slightly differently.
    train_acc = history.history.get("acc", history.history.get("accuracy", []))
    val_acc = history.history.get("val_acc", history.history.get("val_accuracy", []))
    train_loss = history.history.get("loss", [])
    val_loss = history.history.get("val_loss", [])


    # Also export CSV for easy spreadsheet usage
    try:
        import csv

        csv_path = os.path.join(artifacts_dir, f"training_curves_{backbone}.csv")
        fieldnames = ["epoch", "acc", "val_acc", "loss", "val_loss"]

        n = max(len(train_loss), len(val_loss), len(train_acc), len(val_acc))
        with open(csv_path, "w", newline="", encoding="utf-8") as cf:
            writer = csv.DictWriter(cf, fieldnames=fieldnames)
            writer.writeheader()
            for i in range(n):
                writer.writerow({
                    "epoch": i + 1,
                    "acc": float(train_acc[i]) if i < len(train_acc) else None,
                    "val_acc": float(val_acc[i]) if i < len(val_acc) else None,
                    "loss": float(train_loss[i]) if i < len(train_loss) else None,
                    "val_loss": float(val_loss[i]) if i < len(val_loss) else None,
                })
    except Exception as e:
        print(f"Warning: failed to write training_curves CSV for {backbone}: {e}")



    print("Evaluating on Testing split...")
    results = model.evaluate(test_ds, verbose=1)
    loss = float(results[0])
    acc = float(results[1])
    print(f"Test accuracy ({backbone}): {acc:.4f}")

    export_dir = os.path.join(artifacts_dir, "npk_resnet50_export")
    os.makedirs(export_dir, exist_ok=True)
    model.save(export_dir)

    # Save meta per backbone (so generator can pick correct mapping)
    idx_to_class = {i: c for c, i in class_to_idx.items()}
    meta = {
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "image_size": image_size,
        "model": backbone,
        "test_accuracy": acc,
        "test_loss": loss,
    }
    with open(os.path.join(artifacts_dir, f"meta_{backbone}.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    # Backwards-compat: keep old single meta/history files for the last trained backbone
    with open(os.path.join(artifacts_dir, "history.json"), "w", encoding="utf-8") as f:
        json.dump(history.history, f)
    with open(os.path.join(artifacts_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


    return acc





def main():
    spec = DatasetSpec(data_root=os.path.join(os.path.dirname(__file__), "..", "data"))

    class_to_idx = {c: i for i, c in enumerate(spec.classes)}
    idx_to_class = {i: c for c, i in class_to_idx.items()}

    print("Building dataset index...")
    index = build_file_index(spec)

    print("Dataset sizes:")
    for split in spec.splits:
        print(f"  {split}: {len(index[split])} images")

    image_size = int(os.environ.get("NPK_IMAGE_SIZE", "160"))
    batch_size = int(os.environ.get("NPK_BATCH_SIZE", "32"))
    epochs = int(os.environ.get("NPK_EPOCHS", "30"))

    max_train_per_class = int(os.environ.get("NPK_MAX_TRAIN_PER_CLASS", "800"))
    max_eval_per_class = int(os.environ.get("NPK_MAX_EVAL_PER_CLASS", "200"))

    train_items = limit_items_per_class(index["Training"], max_train_per_class)
    val_items = limit_items_per_class(index["Validation"], max_eval_per_class)
    test_items = limit_items_per_class(index["Testing"], max_eval_per_class)

    print("Using dataset sizes:")
    print(f"  Training: {len(train_items)} images")
    print(f"  Validation: {len(val_items)} images")
    print(f"  Testing: {len(test_items)} images")

    artifacts_dir = os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    backbone_sel = os.environ.get("NPK_BACKBONE", "resnet50").strip().lower()
    if backbone_sel == "all":
        backbones = [
            "densenet169",
            "resnet50",
            "mobilenetv2",
            "efficientnetb0",
            "efficientnetb1",
            "efficientnetb2",
            "efficientnetb3",
            "efficientnetb4",
            "efficientnetb5",
            "efficientnetb6",
            "efficientnetb7",
            "inceptionv3",
            "vgg16",
            "vgg19",
            "vit",
        ]
    else:
        backbones = [backbone_sel]

    print(f"Backbones to train: {backbones}")

    final_accs = {}
    for b in backbones:
        # Clear TF session between runs to reduce memory growth
        tf.keras.backend.clear_session()
        acc = train_and_export(
            backbone=b,
            train_items=train_items,
            val_items=val_items,
            test_items=test_items,
            class_to_idx=class_to_idx,
            image_size=image_size,
            batch_size=batch_size,
            epochs=epochs,
            max_train_per_class=max_train_per_class,
            max_eval_per_class=max_eval_per_class,
            artifacts_dir=artifacts_dir,
        )
        final_accs[b] = acc

    print("=== Training complete ===")
    for b, acc in final_accs.items():
        print(f"  {b}: test_acc={acc:.4f}")



if __name__ == "__main__":
    main()
