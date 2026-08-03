"""Per-class accuracy evaluation on full test set (max N per class)."""
import os, json, sys
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import numpy as np
import tensorflow as tf

export_dir = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts\npk_resnet50_export"
meta_path = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts\meta.json"
max_per_class = int(sys.argv[1]) if len(sys.argv) > 1 else 200

with open(meta_path) as f:
    meta = json.load(f)

idx_to_class = {int(k): v for k, v in meta["idx_to_class"].items()}
image_size = meta["image_size"]
backbone = meta["model"]
test_acc = meta["test_accuracy"]

model = tf.keras.models.load_model(export_dir, compile=False)
print(f"Loaded: backbone={backbone}, image_size={image_size}, test_acc={test_acc:.4f}")

data_root = r"C:\Users\This PC\Downloads\npk-detection-app\data"
classes = ("nitrogen", "phosphorus", "potassium", "healthy")
DEFICIENCIES = ["nitrogen", "phosphorus", "potassium", "healthy"]

correct = {c: 0 for c in classes}
total = {c: 0 for c in classes}
confusion = {c: {c2: 0 for c2 in classes} for c in classes}

for crop in ("maize", "Beans"):
    test_dir = os.path.join(data_root, crop, "Testing")
    if not os.path.isdir(test_dir):
        continue
    for cls in classes:
        cls_dir = os.path.join(test_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        taken = 0
        for fn in sorted(os.listdir(cls_dir)):
            if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            if taken >= max_per_class:
                break
            path = os.path.join(cls_dir, fn)
            img = tf.keras.utils.load_img(path, target_size=(image_size, image_size))
            x = tf.keras.utils.img_to_array(img) / 255.0
            x = np.expand_dims(x, 0)
            y = model(x, training=False).numpy()[0]
            pred = int(np.argmax(y))
            pred_cls = idx_to_class[pred].lower().strip().replace("-", "_")
            for d in DEFICIENCIES:
                if d in pred_cls:
                    pred_cls = d
                    break
            total[cls] += 1
            confusion[cls][pred_cls] += 1
            if pred_cls == cls:
                correct[cls] += 1
            taken += 1

print()
print("Per-class accuracy:")
for cls in classes:
    acc = correct[cls] / max(total[cls], 1) * 100
    print(f"  {cls:15s}: {correct[cls]:3d}/{total[cls]:3d} = {acc:5.1f}%")
overall = sum(correct.values()) / max(sum(total.values()), 1) * 100
print(f"  {'Overall':15s}: {sum(correct.values()):3d}/{sum(total.values()):3d} = {overall:5.1f}%")
print()
print("Confusion matrix (rows=true, cols=predicted):")
print(f"  {'':>15s}", end="")
for c in classes:
    print(f" {c:>12s}", end="")
print()
for t in classes:
    print(f"  {t:>15s}", end="")
    for p in classes:
        print(f" {confusion[t][p]:12d}", end="")
    print()

