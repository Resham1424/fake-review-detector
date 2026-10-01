"""
VerityCheck - Phase 4: Dual-Signal Stacking Ensemble
Combines text NLP model confidence scores with behavioral metadata predictions
to generate the final authenticity probability score.
"""

import os
import argparse
import logging
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression

try:
    from src.text_features import load_vectorizer
    from src.behavioral_features import extract_all_behavioral_features
    from src.train_baseline import evaluate_model, print_benchmark_report
except ImportError:
    from text_features import load_vectorizer
    from behavioral_features import extract_all_behavioral_features
    from train_baseline import evaluate_model, print_benchmark_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def train_ensemble_stack(
    train_path: str = "data/processed/train.csv",
    test_path: str = "data/processed/test.csv",
    models_dir: str = "models"
):
    """
    Train stacking meta-classifier over text and behavioral probability outputs.
    """
    baseline_path = os.path.join(models_dir, "baseline_logreg.joblib")
    tfidf_path = os.path.join(models_dir, "tfidf_vectorizer.joblib")
    behavioral_path = os.path.join(models_dir, "behavioral_model.joblib")

    if not os.path.exists(baseline_path) or not os.path.exists(tfidf_path):
        raise FileNotFoundError("Baseline text model or vectorizer not found. Run Phase 1 training first.")

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    # 1. Text Model Predictions
    vec = load_vectorizer(tfidf_path)
    text_model = joblib.load(baseline_path)

    X_train_text = train_df["cleaned_text"].fillna("").astype(str)
    X_test_text = test_df["cleaned_text"].fillna("").astype(str)

    train_text_probs = text_model.predict_proba(vec.transform(X_train_text))[:, 1]
    test_text_probs = text_model.predict_proba(vec.transform(X_test_text))[:, 1]

    # 2. Behavioral Model Predictions
    if os.path.exists(behavioral_path):
        behav_model = joblib.load(behavioral_path)
        X_train_behav = extract_all_behavioral_features(train_df)
        X_test_behav = extract_all_behavioral_features(test_df)
        train_behav_probs = behav_model.predict_proba(X_train_behav)[:, 1]
        test_behav_probs = behav_model.predict_proba(X_test_behav)[:, 1]
    else:
        logger.warning("Behavioral model not found; using pseudo behavioral signals.")
        train_behav_probs = 1.0 - train_df.get("verified_purchase", 1).astype(float)
        test_behav_probs = 1.0 - test_df.get("verified_purchase", 1).astype(float)

    # Meta-Features
    X_train_meta = np.column_stack([train_text_probs, train_behav_probs])
    X_test_meta = np.column_stack([test_text_probs, test_behav_probs])

    y_train = train_df["label"].astype(int).values
    y_test = test_df["label"].astype(int).values

    meta_model = LogisticRegression()
    meta_model.fit(X_train_meta, y_train)

    y_pred = meta_model.predict(X_test_meta)
    y_prob = meta_model.predict_proba(X_test_meta)[:, 1]

    metrics = evaluate_model(y_test, y_pred, y_prob)
    print_benchmark_report(metrics, model_name="Phase 4 Dual-Signal Ensemble")

    ensemble_path = os.path.join(models_dir, "ensemble_model.joblib")
    joblib.dump(meta_model, ensemble_path)
    logger.info(f"Saved ensemble model to '{ensemble_path}'")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Phase 4 Ensemble Training")
    parser.add_argument("--train-path", type=str, default="data/processed/train.csv")
    parser.add_argument("--test-path", type=str, default="data/processed/test.csv")
    parser.add_argument("--models-dir", type=str, default="models")
    args = parser.parse_args()

    train_ensemble_stack(args.train_path, args.test_path, args.models_dir)
