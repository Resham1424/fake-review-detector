"""
VerityCheck - Phase 3: Fine-Tuned DistilBERT Text Classifier
Fine-tunes HuggingFace distilbert-base-uncased for binary fake review detection,
evaluates standardized performance metrics, compares with Phase 1 baseline,
saves model and tokenizer artifacts, and provides an inference helper.
"""

import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Any, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

try:
    from src.preprocess import load_and_preprocess_data
except ImportError:
    from preprocess import load_and_preprocess_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Module-level cache for inference to avoid re-instantiating heavy models
_CACHED_MODEL = None
_CACHED_TOKENIZER = None
_CACHED_MODEL_DIR = None


class ReviewDataset:
    """PyTorch Dataset for review text tokenization."""
    def __init__(self, texts: List[str], labels: Optional[List[int]], tokenizer, max_length: int = 128):
        self.texts = list(texts)
        self.labels = list(labels) if labels is not None else None
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.texts)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        text = str(self.texts[idx])
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt"
        )
        item = {key: val.squeeze(0) for key, val in encoding.items()}
        if self.labels is not None:
            import torch
            item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item


def detect_device_and_config(gpu_override: Optional[bool] = None) -> Tuple[Any, Dict[str, Any]]:
    """
    Detect compute device (GPU vs CPU) and configure appropriate hyperparameters.
    """
    import torch

    has_cuda = torch.cuda.is_available() if gpu_override is None else gpu_override
    if has_cuda:
        device = torch.device("cuda")
        device_name = "CUDA GPU"
        if torch.cuda.is_available():
            try:
                device_name = torch.cuda.get_device_name(0)
            except Exception:
                device_name = "CUDA GPU"
        logger.info(f"CUDA GPU detected: '{device_name}'. Using GPU training configuration.")
        config = {
            "device": device,
            "max_length": 128,
            "batch_size": 32,
            "epochs": 3,
            "learning_rate": 2e-5,
            "is_gpu": True
        }
    else:
        device = torch.device("cpu")
        print("\n" + "!" * 70)
        print("  [WARNING] GPU is not available. Falling back to CPU-optimized training.")
        print("  Applying lightweight defaults (max_length=64, epochs=2, batch_size=16).")
        print("!" * 70 + "\n")
        config = {
            "device": device,
            "max_length": 64,
            "batch_size": 16,
            "epochs": 2,
            "learning_rate": 3e-5,
            "is_gpu": False
        }
    return device, config


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Compute standard evaluation metrics suite.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0
    cm = confusion_matrix(y_true, y_pred).tolist()
    clf_report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": cm,
        "classification_report": clf_report
    }


def print_comparison_table(
    phase3_metrics: Dict[str, Any],
    phase1_metrics_path: str = "models/baseline_metrics.json"
) -> None:
    """
    Print a side-by-side performance comparison between Phase 1 and Phase 3.
    """
    phase1_metrics = None
    if os.path.exists(phase1_metrics_path):
        try:
            with open(phase1_metrics_path, "r", encoding="utf-8") as f:
                phase1_metrics = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load Phase 1 metrics from '{phase1_metrics_path}': {e}")

    header = "=" * 74
    print(f"\n{header}")
    print("        VERITYCHECK — PERFORMANCE COMPARISON: PHASE 1 vs PHASE 3")
    print(header)
    print(f" {'Metric':<14} | {'Phase 1 (TF-IDF + LogReg)':<25} | {'Phase 3 (DistilBERT)':<20} | {'Delta':<8}")
    print("-" * 74)

    metrics_keys = [
        ("Accuracy", "accuracy"),
        ("Precision", "precision"),
        ("Recall", "recall"),
        ("F1-Score", "f1_score"),
        ("ROC-AUC", "roc_auc")
    ]

    for label, key in metrics_keys:
        p3_val = phase3_metrics.get(key, 0.0)
        if phase1_metrics and key in phase1_metrics:
            p1_val = phase1_metrics[key]
            delta = p3_val - p1_val
            delta_str = f"{delta:+.4f}"
            print(f" {label:<14} | {p1_val:.4f} ({p1_val*100:6.2f}%)          | {p3_val:.4f} ({p3_val*100:6.2f}%)   | {delta_str}")
        else:
            print(f" {label:<14} | {'N/A':<25} | {p3_val:.4f} ({p3_val*100:6.2f}%)   | {'N/A'}")

    print(header + "\n")


def train_distilbert_classifier(
    data_path: str = "data/processed/reviews_clean.csv",
    models_dir: str = "models/distilbert_finetuned",
    epochs: Optional[int] = None,
    batch_size: Optional[int] = None,
    max_length: Optional[int] = None,
    learning_rate: Optional[float] = None,
    max_samples: Optional[int] = None,
    val_split: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Fine-tune DistilBERT on clean review text and evaluate validation benchmark.
    """
    import torch
    from torch.utils.data import DataLoader
    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification,
        get_linear_schedule_with_warmup
    )

    # 1. Device and defaults
    device, config = detect_device_and_config()
    epochs = epochs if epochs is not None else config["epochs"]
    batch_size = batch_size if batch_size is not None else config["batch_size"]
    max_length = max_length if max_length is not None else config["max_length"]
    lr = learning_rate if learning_rate is not None else config["learning_rate"]

    # 2. Dataset loading and verification
    if not os.path.exists(data_path):
        logger.warning(f"Data file not found at '{data_path}'. Checking processed train/test or running preprocessing...")
        output_dir = os.path.dirname(data_path) or "data/processed"
        load_and_preprocess_data(output_dir=output_dir, random_state=random_state)

    if not os.path.exists(data_path):
        # Fallback to train.csv if reviews_clean.csv is not present
        alt_path = os.path.join(os.path.dirname(data_path), "train.csv")
        if os.path.exists(alt_path):
            data_path = alt_path
        else:
            raise FileNotFoundError(f"Neither '{data_path}' nor '{alt_path}' found.")

    logger.info(f"Loading dataset from '{data_path}'...")
    df = pd.read_csv(data_path)

    # Determine text column
    text_col = None
    for candidate in ["clean_text", "cleaned_text", "text"]:
        if candidate in df.columns:
            text_col = candidate
            break

    if text_col is None or "label" not in df.columns:
        raise ValueError(f"Dataset must contain text and label columns. Found: {list(df.columns)}")

    df = df.dropna(subset=[text_col, "label"]).copy()
    if max_samples and len(df) > max_samples:
        logger.info(f"Subsampling dataset to {max_samples} samples for fast execution...")
        df = df.sample(n=max_samples, random_state=random_state).reset_index(drop=True)

    texts = df[text_col].astype(str).tolist()
    labels = df["label"].astype(int).tolist()

    # Stratified Train/Validation split
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts,
        labels,
        test_size=val_split,
        stratify=labels,
        random_state=random_state
    )

    logger.info(f"Training set: {len(train_texts)} samples | Validation set: {len(val_texts)} samples")

    # 3. Tokenizer & Datasets
    model_name = "distilbert-base-uncased"
    logger.info(f"Initializing tokenizer for '{model_name}'...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    train_dataset = ReviewDataset(train_texts, train_labels, tokenizer, max_length=max_length)
    val_dataset = ReviewDataset(val_texts, val_labels, tokenizer, max_length=max_length)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # 4. Model Setup
    logger.info(f"Loading pre-trained '{model_name}' for binary sequence classification...")
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)
    model.to(device)

    # Optimizer & LR Scheduler
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    warmup_steps = int(total_steps * 0.1)
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps
    )

    # 5. Training Loop
    logger.info(f"Starting fine-tuning: {epochs} epochs, batch_size={batch_size}, lr={lr}, device={device}...")
    model.train()
    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        for step, batch in enumerate(train_loader, 1):
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            b_labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=b_labels)
            loss = outputs.loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()

            if step % max(1, len(train_loader) // 4) == 0 or step == len(train_loader):
                logger.info(f"Epoch {epoch}/{epochs} | Step {step}/{len(train_loader)} | Batch Loss: {loss.item():.4f}")

        avg_train_loss = total_loss / len(train_loader)
        logger.info(f"Epoch {epoch}/{epochs} Completed | Avg Training Loss: {avg_train_loss:.4f}")

    # 6. Validation Evaluation
    logger.info("Evaluating fine-tuned model on validation set...")
    model.eval()
    all_preds = []
    all_probs = []
    all_targets = []

    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            b_labels = batch["labels"]

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
            preds = torch.argmax(logits, dim=1).cpu().numpy()

            all_probs.extend(probs)
            all_preds.extend(preds)
            all_targets.extend(b_labels.numpy())

    y_true = np.array(all_targets)
    y_pred = np.array(all_preds)
    y_prob = np.array(all_probs)

    metrics = evaluate_predictions(y_true, y_pred, y_prob)

    # 7. Print Comparison Table
    print_comparison_table(metrics)

    # 8. Save Fine-Tuned Model & Tokenizer
    os.makedirs(models_dir, exist_ok=True)
    logger.info(f"Saving fine-tuned model and tokenizer to '{models_dir}'...")
    model.save_pretrained(models_dir)
    tokenizer.save_pretrained(models_dir)

    metrics_out_path = os.path.join(os.path.dirname(models_dir) or "models", "transformer_metrics.json")
    with open(metrics_out_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved Phase 3 metrics to '{metrics_out_path}'")

    return metrics


def predict_proba(
    texts: Union[str, List[str]],
    model_dir: str = "models/distilbert_finetuned",
    batch_size: int = 32,
    device: Optional[str] = None
) -> List[float]:
    """
    Inference helper returning fake review probabilities P(label=1) for arbitrary input texts.
    
    Args:
        texts: Single review text string or list of review texts.
        model_dir: Path to directory containing fine-tuned model and tokenizer.
        batch_size: Batch size for tokenization and forward pass.
        device: Device string ('cuda' or 'cpu'). Defaults to automatic detection.
        
    Returns:
        List of float probabilities (0.0 to 1.0) indicating likelihood of review being fake.
    """
    global _CACHED_MODEL, _CACHED_TOKENIZER, _CACHED_MODEL_DIR
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    if isinstance(texts, str):
        texts = [texts]

    if not texts:
        return []

    if device is None:
        torch_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        torch_device = torch.device(device)

    # Cache model and tokenizer in memory across calls
    if _CACHED_MODEL is None or _CACHED_MODEL_DIR != model_dir:
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Fine-tuned model directory not found at '{model_dir}'. Run Phase 3 training first.")
        logger.info(f"Loading fine-tuned DistilBERT model from '{model_dir}' into memory...")
        _CACHED_TOKENIZER = AutoTokenizer.from_pretrained(model_dir)
        _CACHED_MODEL = AutoModelForSequenceClassification.from_pretrained(model_dir)
        _CACHED_MODEL_DIR = model_dir

    model = _CACHED_MODEL.to(torch_device)
    tokenizer = _CACHED_TOKENIZER
    model.eval()

    dataset = ReviewDataset(texts, labels=None, tokenizer=tokenizer, max_length=128)
    from torch.utils.data import DataLoader
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False)

    all_probabilities = []
    with torch.no_grad():
        for batch in loader:
            input_ids = batch["input_ids"].to(torch_device)
            attention_mask = batch["attention_mask"].to(torch_device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            probs = torch.softmax(outputs.logits, dim=1)[:, 1].cpu().tolist()
            all_probabilities.extend(probs)

    return all_probabilities


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Phase 3: Fine-Tuned DistilBERT Text Classifier")
    parser.add_argument("--data-path", type=str, default="data/processed/reviews_clean.csv", help="Path to clean reviews dataset")
    parser.add_argument("--models-dir", type=str, default="models/distilbert_finetuned", help="Directory to save fine-tuned model")
    parser.add_argument("--epochs", type=int, default=None, help="Number of fine-tuning epochs (defaults: CPU=2, GPU=3)")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size (defaults: CPU=16, GPU=32)")
    parser.add_argument("--max-length", type=int, default=None, help="Max token length (defaults: CPU=64, GPU=128)")
    parser.add_argument("--learning-rate", type=float, default=None, help="Learning rate (default: 2e-5 to 3e-5)")
    parser.add_argument("--max-samples", type=int, default=None, help="Limit number of training samples for fast execution")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")

    args = parser.parse_args()

    train_distilbert_classifier(
        data_path=args.data_path,
        models_dir=args.models_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        max_length=args.max_length,
        learning_rate=args.learning_rate,
        max_samples=args.max_samples,
        random_state=args.seed
    )
