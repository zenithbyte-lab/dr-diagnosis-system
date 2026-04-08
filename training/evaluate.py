"""
Model evaluation: confusion matrix, P-R curves, F1 curves, loss curves.
Generates all chart figures referenced in the thesis.
"""
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (confusion_matrix, classification_report,
                             precision_recall_curve, f1_score)

CLASSES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR']


def plot_loss_curves(history, save_path='results/loss_curves.png'):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    axes[0].plot(history['train_loss'], label='Train Loss', marker='o')
    axes[0].plot(history['val_loss'], label='Val Loss', marker='s')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    axes[1].plot(history['train_acc'], label='Train Acc', marker='o')
    axes[1].plot(history['val_acc'], label='Val Acc', marker='s')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].set_title('Training and Validation Accuracy')
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def plot_confusion_matrix(y_true, y_pred, save_path='results/confusion_matrix.png'):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=CLASSES, yticklabels=CLASSES)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix - Test Set')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    return cm


def plot_pr_curves(y_true, y_scores, save_path='results/pr_curves.png'):
    """Plot per-class Precision-Recall curves. y_scores: [N, 5] probability array."""
    plt.figure(figsize=(10, 8))
    for i, cls_name in enumerate(CLASSES):
        binary_true = (np.array(y_true) == i).astype(int)
        precision, recall, _ = precision_recall_curve(binary_true, y_scores[:, i])
        plt.plot(recall, precision, label=cls_name, linewidth=2)
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curves (Per Class)')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def plot_f1_curves(history_f1, save_path='results/f1_curves.png'):
    """Plot per-epoch Macro-F1 curves."""
    plt.figure(figsize=(10, 6))
    plt.plot(history_f1['train_f1'], label='Train Macro-F1', marker='o')
    plt.plot(history_f1['val_f1'], label='Val Macro-F1', marker='s')
    plt.xlabel('Epoch')
    plt.ylabel('Macro-F1')
    plt.title('F1 Score Curves')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def print_report(y_true, y_pred):
    print(classification_report(y_true, y_pred, target_names=CLASSES, digits=4))
