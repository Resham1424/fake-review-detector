"""
VerityCheck - Phase 1: Text Baseline Model Training (TF-IDF + Logistic Regression)
"""

import os
import json
import logging
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

try:
    from src.text_features import build_tfidf_vectorizer, save_vectorizer
    from src.preprocess import clean_text
except ImportError:
    from text_features import build_tfidf_vectorizer, save_vectorizer
    from preprocess import clean_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5,
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "classification_report": classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    }


def train_baseline_model(
    train_path: str = "data/processed/train.csv",
    test_path: str = "data/processed/test.csv",
    models_dir: str = "models"
) -> Dict[str, Any]:
    os.makedirs(models_dir, exist_ok=True)
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    vec = build_tfidf_vectorizer()
    X_train = vec.fit_transform(train_df["cleaned_text"].fillna("").astype(str))
    X_test = vec.transform(test_df["cleaned_text"].fillna("").astype(str))

    y_train = train_df["label"].astype(int).values
    y_test = test_df["label"].astype(int).values

    model = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = evaluate_model(y_test, y_pred, y_prob)
    joblib.dump(model, os.path.join(models_dir, "baseline_logreg.joblib"))
    save_vectorizer(vec, os.path.join(models_dir, "tfidf_vectorizer.joblib"))

    with open(os.path.join(models_dir, "baseline_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    train_baseline_model()
