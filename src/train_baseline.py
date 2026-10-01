"""
VerityCheck - Phase 1: Baseline Classifier (TF-IDF + Logistic Regression)
Trains and evaluates the foundational text baseline model, establishes benchmark
metrics (Accuracy, Precision, Recall, F1, ROC-AUC), and serializes artifacts.
"""

import os
import json
import argparse
import logging
from typing import Dict, Any
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)

try:
    from src.preprocess import load_and_preprocess_data
    from src.text_features import build_tfidf_vectorizer, save_vectorizer
except ImportError:
    from preprocess import load_and_preprocess_data
    from text_features import build_tfidf_vectorizer, save_vectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Compute full evaluation metrics suite for the binary fake review classifier.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_prob)) if y_prob is not None else 0.0
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


def print_benchmark_report(metrics: Dict[str, Any], model_name: str = "TF-IDF + Logistic Regression Baseline") -> None:
    """
    Print a formatted benchmark summary table to console.
    """
    cm = metrics["confusion_matrix"]
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]

    header = f"=" * 60
    print(f"\n{header}")
    print(f"   VERITYCHECK — PHASE 1 BENCHMARK REPORT: {model_name}")
    print(f"{header}")
    print(f"  Accuracy:  {metrics['accuracy']:.4f}  ({metrics['accuracy']*100:.2f}%)")
    print(f"  Precision: {metrics['precision']:.4f}  ({metrics['precision']*100:.2f}%)")
    print(f"  Recall:    {metrics['recall']:.4f}  ({metrics['recall']*100:.2f}%)")
    print(f"  F1-Score:  {metrics['f1_score']:.4f}  ({metrics['f1_score']*100:.2f}%)")
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}  ({metrics['roc_auc']*100:.2f}%)")
    print(f"-" * 60)
    print("  Confusion Matrix:")
    print(f"    Genuine (0) -> TN: {tn:4d} | FP (False Alarm): {fp:4d}")
    print(f"    Fake    (1) -> FN: {fn:4d} | TP (Caught Fake):  {tp:4d}")
    print(f"{header}\n")


def train_and_evaluate_baseline(
    train_path: str = "data/processed/train.csv",
    test_path: str = "data/processed/test.csv",
    models_dir: str = "models",
    c_param: float = 1.0,
    max_iter: int = 1000,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Execute Phase 1 baseline pipeline:
      1. Load processed train/test datasets (or trigger preprocessing if missing)
      2. Vectorize text with TF-IDF
      3. Fit Logistic Regression
      4. Evaluate metrics against test split
      5. Serialize model, vectorizer, and metrics
    """
    os.makedirs(models_dir, exist_ok=True)

    # Automatically prepare dataset if not already processed
    if not os.path.exists(train_path) or not os.path.exists(test_path):
        logger.info(f"Processed datasets not found at '{train_path}'. Running preprocessing...")
        train_df, test_df = load_and_preprocess_data(output_dir=os.path.dirname(train_path), random_state=random_state)
    else:
        logger.info(f"Loading processed train data from '{train_path}' and test data from '{test_path}'...")
        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)

    # Use cleaned_text column (or fall back to text)
    text_col = "cleaned_text" if "cleaned_text" in train_df.columns else "text"
    X_train_text = train_df[text_col].fillna("").astype(str)
    y_train = train_df["label"].astype(int).values

    X_test_text = test_df[text_col].fillna("").astype(str)
    y_test = test_df["label"].astype(int).values

    logger.info(f"Training samples: {len(X_train_text)}, Test samples: {len(X_test_text)}")

    # 1. Feature Extraction: TF-IDF
    logger.info("Extracting TF-IDF features...")
    vectorizer = build_tfidf_vectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_tfidf = vectorizer.fit_transform(X_train_text)
    X_test_tfidf = vectorizer.transform(X_test_text)
    logger.info(f"TF-IDF feature matrix shape: {X_train_tfidf.shape}")

    # 2. Model Training: Logistic Regression
    logger.info(f"Training Logistic Regression (C={c_param}, max_iter={max_iter}, class_weight='balanced')...")
    model = LogisticRegression(
        C=c_param,
        max_iter=max_iter,
        class_weight="balanced",
        random_state=random_state,
        solver="lbfgs"
    )
    model.fit(X_train_tfidf, y_train)

    # 3. Model Evaluation
    y_pred = model.predict(X_test_tfidf)
    y_prob = model.predict_proba(X_test_tfidf)[:, 1]

    metrics = evaluate_model(y_test, y_pred, y_prob)
    print_benchmark_report(metrics)

    # 4. Save Artifacts
    model_path = os.path.join(models_dir, "baseline_logreg.joblib")
    vec_path = os.path.join(models_dir, "tfidf_vectorizer.joblib")
    metrics_path = os.path.join(models_dir, "baseline_metrics.json")

    joblib.dump(model, model_path)
    save_vectorizer(vectorizer, vec_path)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Saved baseline model to '{model_path}'")
    logger.info(f"Saved metrics to '{metrics_path}'")

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Phase 1 Baseline Training")
    parser.add_argument("--train-path", type=str, default="data/processed/train.csv", help="Path to train CSV")
    parser.add_argument("--test-path", type=str, default="data/processed/test.csv", help="Path to test CSV")
    parser.add_argument("--models-dir", type=str, default="models", help="Directory to save models")
    parser.add_argument("--c-param", type=float, default=1.0, help="Inverse regularization parameter C")
    parser.add_argument("--max-iter", type=int, default=1000, help="Maximum solver iterations")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")

    args = parser.parse_args()

    train_and_evaluate_baseline(
        train_path=args.train_path,
        test_path=args.test_path,
        models_dir=args.models_dir,
        c_param=args.c_param,
        max_iter=args.max_iter,
        random_state=args.seed
    )
