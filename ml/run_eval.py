"""Full evaluation: per-class metrics, confusion matrix, ROC, F1 — prints data + saves graphs."""
import os, json, sys
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import numpy as np
import tensorflow as tf
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_curve, auc, precision_recall_curve)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

ARTIFACTS = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts"
DATA = r"C:\Users\This PC\Downloads\npk-detection-app\data"
CLASSES = ("nitrogen", "phosphorus", "potassium", "healthy")
CLASSES_PLOT = ("Nitrogen\n(N)", "Phosphorus\n(P)", "Potassium\n(K)", "Healthy")
MAX_PER_CLASS = 300

with open(os.path.join(ARTIFACTS, "meta.json")) as f:
    meta = json.load(f)
model = tf.keras.models.load_model(os.path.join(ARTIFACTS, "npk_resnet50_export"), compile=False)
image_size = meta["image_size"]
print(f"Model: {meta['model']}, image_size: {image_size}, test_acc: {meta['test_accuracy']:.4f}")

idx_to_class = {int(k): v for k, v in meta["idx_to_class"].items()}
class_to_idx = {v: k for k, v in idx_to_class.items()}
CLASS_ORDER = [class_to_idx[c] for c in CLASSES]

def collect_test_data():
    y_true, y_pred, y_prob = [], [], []
    counts = {c: 0 for c in CLASSES}
    for crop in ("maize", "Beans"):
        td = os.path.join(DATA, crop, "Testing")
        if not os.path.isdir(td):
            continue
        for cls in CLASSES:
            cd = os.path.join(td, cls)
            if not os.path.isdir(cd):
                continue
            taken = 0
            for fn in sorted(os.listdir(cd)):
                if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                if taken >= MAX_PER_CLASS:
                    break
                path = os.path.join(cd, fn)
                img = tf.keras.utils.load_img(path, target_size=(image_size, image_size))
                x = tf.keras.utils.img_to_array(img) / 255.0
                x = np.expand_dims(x, 0)
                prob = model(x, training=False).numpy()[0]
                pred = int(np.argmax(prob))
                pred_cls = idx_to_class[pred]
                y_true.append(class_to_idx[cls])
                y_pred.append(pred)
                y_prob.append(prob)
                counts[cls] += 1
                taken += 1
    return np.array(y_true), np.array(y_pred), np.array(y_prob), counts

print("Collecting test data...")
y_true, y_pred, y_prob, per_class_counts = collect_test_data()

overall = np.mean(y_true == y_pred) * 100
print(f"\n{'='*60}")
print(f"{'METRIC':<25} {'VALUE':<10}")
print(f"{'='*60}")

# Per-class accuracy
print(f"\n{'--- Per-Class Accuracy ---':<60}")
print(f"{'Class':<20} {'Correct':<10} {'Total':<10} {'Accuracy':<10}")
print(f"{'-'*50}")
per_class_acc = {}
for cls in CLASSES:
    mask = y_true == class_to_idx[cls]
    correct = np.sum(y_pred[mask] == class_to_idx[cls])
    total = np.sum(mask)
    acc = correct / total * 100 if total > 0 else 0
    per_class_acc[cls] = acc
    print(f"{cls:<20} {correct:<10} {total:<10} {acc:<10.2f}%")
print(f"{'Overall':<20} {np.sum(y_true == y_pred):<10} {len(y_true):<10} {overall:<10.2f}%")

# Classification report
print(f"\n{'--- Classification Report (Precision, Recall, F1) ---':<60}")
report = classification_report(y_true, y_pred, target_names=CLASSES, output_dict=True, zero_division=0)
print(f"{'Class':<20} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<10}")
print(f"{'-'*66}")
for cls in CLASSES:
    r = report[cls]
    print(f"{cls:<20} {r['precision']:<12.4f} {r['recall']:<12.4f} {r['f1-score']:<12.4f} {r['support']:<10.0f}")
print(f"{'Weighted Avg':<20} {report['weighted avg']['precision']:<12.4f} {report['weighted avg']['recall']:<12.4f} {report['weighted avg']['f1-score']:<12.4f} {report['weighted avg']['support']:<10.0f}")

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)
print(f"\n{'--- Confusion Matrix (rows=true, cols=predicted) ---':<60}")
print(f"{'':>18}", end="")
for c in CLASSES:
    print(f"{c:>14}", end="")
print()
for i, t in enumerate(CLASSES):
    print(f"{t:>18}", end="")
    for j in range(len(CLASSES)):
        print(f"{cm[i,j]:>14}", end="")
    print()

# Per-class AUC (one-vs-rest)
print(f"\n{'--- Per-Class AUC ---':<60}")
y_onehot = np.zeros((len(y_true), len(CLASSES)))
for i, lbl in enumerate(y_true):
    y_onehot[i, lbl] = 1
per_class_auc = {}
for i, cls in enumerate(CLASSES):
    fpr, tpr, _ = roc_curve(y_onehot[:, i], y_prob[:, i])
    roc_auc = auc(fpr, tpr)
    per_class_auc[cls] = roc_auc
    print(f"  {cls:<20} AUC = {roc_auc:.4f}")

# ============================================================
# SAVE GRAPHS
# ============================================================
print(f"\nSaving graphs to {ARTIFACTS}...")

# 1. Confusion Matrix
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Nitrogen\n(N)", "Phosphorus\n(P)", "Potassium\n(K)", "Healthy"],
            yticklabels=["Nitrogen\n(N)", "Phosphorus\n(P)", "Potassium\n(K)", "Healthy"])
plt.title("Confusion Matrix — NPK Deficiency Detection", fontsize=14, fontweight="bold")
plt.ylabel("True Class")
plt.xlabel("Predicted Class")
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS, "confusion_matrix.png"), dpi=300)
plt.close()

# 2. F1-Score Bar Chart
f1_scores = [report[c]["f1-score"] for c in CLASSES]
plt.figure(figsize=(8, 5))
colors = ["#e74c3c", "#f39c12", "#9b59b6", "#2ecc71"]
bars = plt.bar(CLASSES_PLOT, f1_scores, color=colors, edgecolor="white", linewidth=1.5)
plt.ylim(0, 1.1)
plt.title("F1-Score per Deficiency Class", fontsize=14, fontweight="bold")
plt.ylabel("F1-Score")
for bar, val in zip(bars, f1_scores):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
             f"{val:.2f}", ha="center", fontweight="bold", fontsize=12)
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS, "f1_scores.png"), dpi=300)
plt.close()

# 3. ROC Curves
plt.figure(figsize=(8, 6))
colors_roc = ["#e74c3c", "#f39c12", "#9b59b6", "#2ecc71"]
for i, cls in enumerate(CLASSES):
    fpr, tpr, _ = roc_curve(y_onehot[:, i], y_prob[:, i])
    roc_auc = auc(fpr, tpr)
    plt.plot(fpr, tpr, color=colors_roc[i], lw=2,
             label=f"{cls.title()} (AUC = {roc_auc:.3f})")
plt.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel("False Positive Rate", fontsize=12)
plt.ylabel("True Positive Rate", fontsize=12)
plt.title("ROC Curves — NPK Deficiency Detection", fontsize=14, fontweight="bold")
plt.legend(loc="lower right", fontsize=10)
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS, "roc_curves.png"), dpi=300)
plt.close()

# 4. Per-Class Accuracy Bar Chart
accuracies = [per_class_acc[c] for c in CLASSES]
plt.figure(figsize=(8, 5))
bars = plt.bar(CLASSES_PLOT, accuracies, color=colors, edgecolor="white", linewidth=1.5)
plt.ylim(0, 100)
plt.title("Per-Class Accuracy (%)", fontsize=14, fontweight="bold")
plt.ylabel("Accuracy (%)")
for bar, val in zip(bars, accuracies):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
             f"{val:.1f}%", ha="center", fontweight="bold", fontsize=12)
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS, "per_class_accuracy.png"), dpi=300)
plt.close()

# 5. Precision-Recall Curves
plt.figure(figsize=(8, 6))
for i, cls in enumerate(CLASSES):
    prec, rec, _ = precision_recall_curve(y_onehot[:, i], y_prob[:, i])
    plt.plot(rec, prec, color=colors_roc[i], lw=2, label=cls.title())
plt.xlabel("Recall", fontsize=12)
plt.ylabel("Precision", fontsize=12)
plt.title("Precision-Recall Curves", fontsize=14, fontweight="bold")
plt.legend(loc="lower left", fontsize=10)
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(ARTIFACTS, "precision_recall_curves.png"), dpi=300)
plt.close()

# Save raw data as JSON
data_out = {
    "overall_accuracy": round(overall, 2),
    "per_class_accuracy": {c: round(v, 2) for c, v in per_class_acc.items()},
    "per_class_f1": {c: round(report[c]["f1-score"], 4) for c in CLASSES},
    "per_class_precision": {c: round(report[c]["precision"], 4) for c in CLASSES},
    "per_class_recall": {c: round(report[c]["recall"], 4) for c in CLASSES},
    "per_class_auc": {c: round(v, 4) for c, v in per_class_auc.items()},
    "per_class_support": {c: int(report[c]["support"]) for c in CLASSES},
    "confusion_matrix": cm.tolist(),
    "class_names": list(CLASSES),
}
json_path = os.path.join(ARTIFACTS, "eval_data.json")
with open(json_path, "w") as f:
    json.dump(data_out, f, indent=2)

print(f"\nRaw eval data saved to: {json_path}")
print(f"Graph files saved:")
for name in ["confusion_matrix.png", "f1_scores.png", "roc_curves.png",
             "per_class_accuracy.png", "precision_recall_curves.png"]:
    p = os.path.join(ARTIFACTS, name)
    if os.path.exists(p):
        sz = os.path.getsize(p)
        print(f"  {name} ({sz//1024} KB)")
