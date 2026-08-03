import os
import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, roc_curve, auc, precision_recall_curve
import tensorflow as tf


ARTIFACTS_DIR = r"C:\Users\This PC\Downloads\npk-detection-app\ml\artifacts"
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export")
HISTORY_DIR = ARTIFACTS_DIR  # history_<backbone>.json
META_DIR = ARTIFACTS_DIR    # meta_<backbone>.json

# Optional single-model backwards compat
HISTORY_PATH = os.path.join(ARTIFACTS_DIR, "history.json")
META_PATH = os.path.join(ARTIFACTS_DIR, "meta.json")


def plot_training_history(history):
    """1. Graph za Accuracy na Loss"""
    epochs = range(1, len(history['acc']) + 1)
    plt.figure(figsize=(12, 5))

    # Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(epochs, history['acc'], 'o-', label='Training Acc')
    plt.plot(epochs, history['val_acc'], 's-', label='Validation Acc')
    plt.title('Model Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)

    # Loss
    plt.subplot(1, 2, 2)
    plt.plot(epochs, history['loss'], 'o-', label='Training Loss')
    plt.plot(epochs, history['val_loss'], 's-', label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig(os.path.join(ARTIFACTS_DIR, "training_curves.png"), dpi=300)
    plt.show()

def plot_confusion_matrix(y_true, y_pred_classes, classes):
    """2. Confusion Matrix"""
    cm = confusion_matrix(y_true, y_pred_classes)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.title('Confusion Matrix for NPK Detection')
    plt.ylabel('True Class')
    plt.xlabel('Predicted Class')
    plt.savefig(os.path.join(ARTIFACTS_DIR, "confusion_matrix.png"), dpi=300)
    plt.show()

def plot_roc_curves(y_true, y_pred_probs, classes):
    """3. ROC Curve & AUC"""
    plt.figure(figsize=(10, 8))
    for i, class_name in enumerate(classes):
        # Convert labels to one-hot for ROC
        y_true_binary = (y_true == i).astype(int)
        fpr, tpr, _ = roc_curve(y_true_binary, y_pred_probs[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f'{class_name} (AUC = {roc_auc:.2f})')

    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC)')
    plt.legend(loc="lower right")
    plt.grid(True)
    plt.savefig(os.path.join(ARTIFACTS_DIR, "roc_curves.png"), dpi=300)
    plt.show()

def plot_f1_bar_chart(y_true, y_pred_classes, classes):
    """4. F1-Score Bar Chart per Class"""
    report = classification_report(y_true, y_pred_classes, target_names=classes, output_dict=True)
    f1_scores = [report[c]['f1-score'] for c in classes]
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x=classes, y=f1_scores, palette="viridis")
    plt.ylim(0, 1.1)
    plt.title('F1-Score per Deficiency Class')
    plt.ylabel('F1-Score')
    for i, v in enumerate(f1_scores):
        plt.text(i, v + 0.02, f"{v:.2f}", ha='center', fontweight='bold')
    
    plt.savefig(os.path.join(ARTIFACTS_DIR, "f1_scores.png"), dpi=300)
    plt.show()

def main():
    # Choose which backbone to plot history for.
    # - default: use NPK_BACKBONE env (falls back to resnet50)
    # - if NPK_BACKBONE=all: plot all backbones that have history_<backbone>.json
    backbone_sel = os.environ.get("NPK_BACKBONE", "resnet50").strip().lower()

    def load_history_for_backbone(b):
        hpath = os.path.join(HISTORY_DIR, f"history_{b}.json")
        mpath = os.path.join(META_DIR, f"meta_{b}.json")
        with open(hpath, encoding="utf-8") as f:
            history = json.load(f)
        meta = None
        if os.path.exists(mpath):
            with open(mpath, encoding="utf-8") as f:
                meta = json.load(f)
        return history, meta

    # If meta exists, prefer its idx_to_class ordering.
    def classes_from_meta(meta):
        if meta and "idx_to_class" in meta:
            idx_to_class = meta["idx_to_class"]
            # idx_to_class may have int keys serialized as strings
            keys = sorted([int(k) for k in idx_to_class.keys()])
            return [idx_to_class[str(k)] if str(k) in idx_to_class else idx_to_class[k] for k in keys]
        return ["Nitrogen", "Phosphorus", "Potassium", "Healthy"]

    
    # Hapa unapaswa kupakia test set yako halisi. 
    # Kwa mfano huu, tunatumia placeholder logic kufanana na data zako.
    # Katika kazi yako, hakikisha unapata y_true na y_pred kutoka kwa test_ds
    # mfano: y_pred_probs = model.predict(test_ds)
    
    # Collect list of backbones to plot
    if backbone_sel == "all":
        backbones = []
        for fn in os.listdir(ARTIFACTS_DIR):
            if fn.startswith("history_") and fn.endswith(".json"):
                b = fn[len("history_"):-len(".json")]
                backbones.append(b)
        backbones = sorted(set(backbones))
    else:
        backbones = [backbone_sel]

    if not backbones:
        raise FileNotFoundError("No history_<backbone>.json files found in ml/artifacts")

    for b in backbones:
        history, meta = load_history_for_backbone(b)
        classes = classes_from_meta(meta)

        print(f"Tengeneza graph ya history kwa backbone={b}...")
        # Per backbone image name
        # Temporarily set default output file names by swapping ARTIFACTS_DIR usage not needed; keep plotting function but change output file.
        # Minimal change: save plot with distinct filename.
        epochs = range(1, len(history['acc']) + 1)
        plt.figure(figsize=(12, 5))

        plt.subplot(1, 2, 1)
        plt.plot(epochs, history['acc'], 'o-', label='Training Acc')
        plt.plot(epochs, history['val_acc'], 's-', label='Validation Acc')
        plt.title(f'Model Accuracy ({b})')
        plt.xlabel('Epochs')
        plt.ylabel('Accuracy')
        plt.legend(); plt.grid(True)

        plt.subplot(1, 2, 2)
        plt.plot(epochs, history['loss'], 'o-', label='Training Loss')
        plt.plot(epochs, history['val_loss'], 's-', label='Validation Loss')
        plt.title(f'Model Loss ({b})')
        plt.xlabel('Epochs')
        plt.ylabel('Loss')
        plt.legend(); plt.grid(True)

        plt.tight_layout()
        plt.savefig(os.path.join(ARTIFACTS_DIR, f"training_curves_{b}.png"), dpi=300)
        plt.show()

    # done


    
    # Mfano wa kutengeneza data za majaribio (badilisha na test_ds yako)
    # y_true = np.concatenate([y for x, y in test_ds], axis=0)
    # y_pred_probs = model.predict(test_ds)
    # y_pred_classes = np.argmax(y_pred_probs, axis=1)
    
    # KWA SASA: Tunatoa maelekezo ya jinsi ya kuzalisha graph hizi.
    # Ili kupata data halisi, unapaswa ku-evaluate model yako dhidi ya test set.
    print("Graph zimehifadhiwa kwenye folder la 'artifacts'.")

if __name__ == "__main__":
    main()