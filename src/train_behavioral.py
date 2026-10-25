"""
VerityCheck - Phase 2: Behavioral Gradient Boosting Model Training
"""

import os
import json
import logging
from typing import Dict, Any
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

try:
    from src.behavioral_features import extract_all_behavioral_features
    from src.train_baseline import evaluate_model
except ImportError:
    from behavioral_features import extract_all_behavioral_features
    from train_baseline import evaluate_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def train_behavioral_model(
    train_path: str = "data/processed/train.csv",
    test_path: str = "data/processed/test.csv",
    models_dir: str = "models"
) -> Dict[str, Any]:
    os.makedirs(models_dir, exist_ok=True)
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    seen_reviewers = set(train_df["reviewer_id"].dropna().unique()) if "reviewer_id" in train_df.columns else set()
    seen_products = set(train_df["product_id"].dropna().unique()) if "product_id" in train_df.columns else set()

    X_train = extract_all_behavioral_features(train_df, seen_reviewers, seen_products)
    X_test = extract_all_behavioral_features(test_df, seen_reviewers, seen_products)

    y_train = train_df["label"].astype(int).values
    y_test = test_df["label"].astype(int).values

    model = HistGradientBoostingClassifier(random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = evaluate_model(y_test, y_pred, y_prob)

    joblib.dump(model, os.path.join(models_dir, "behavioral_model.joblib"))
    joblib.dump({"seen_reviewers": seen_reviewers, "seen_products": seen_products}, os.path.join(models_dir, "behavioral_metadata.joblib"))

    with open(os.path.join(models_dir, "behavioral_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    train_behavioral_model()
