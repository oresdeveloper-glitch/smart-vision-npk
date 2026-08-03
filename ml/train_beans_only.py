import os
import numpy as np
import train_per_crop as t

DATA_ROOT = os.path.join(t.DATA_ROOT, "Beans", "Training")

def compute_class_weights():
    """Weight inversely to training set class frequency so rare classes (potassium, healthy)
    are not collapsed by the majority."""
    counts = {}
    for cls in t.CLASSES:
        d = os.path.join(DATA_ROOT, cls)
        n = 0
        if os.path.isdir(d):
            n = len([f for f in os.listdir(d) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
        counts[cls] = n
    print("Training class counts:", counts)
    total = sum(counts.values())
    n_classes = len(counts)
    weights = {}
    for i, cls in enumerate(t.CLASSES):
        n = max(counts[cls], 1)
        weights[i] = total / (n_classes * n)
    print("Class weights:", {t.CLASSES[i]: round(w, 3) for i, w in weights.items()})
    return weights

if __name__ == "__main__":
    weights = compute_class_weights()
    r = t.train_for_crop("Beans", class_weight=weights)
    print(f"\nBeans only training done: {r}")
