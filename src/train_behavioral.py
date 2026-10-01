"""
VerityCheck - Phase 2: Behavioral Model (XGBoost / Gradient Boosting)
Trains a classifier purely on reviewer activity and product metadata patterns.
"""

import os
import argparse
import logging
import pandas as pd
import joblib

try:
    from src.behavioral_features import extract_all_behavioral_features
    from src.train_baseline import evaluate_model, print_benchmark_report
except ImportError:
    from behavioral_features import extract_all_behavioral_features
    from train_baseline import evaluate_model, print_benchmark_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def train_behavioral_model(
    train_path: str = "data/processed/train.csv",
    test_path: str = "data/processed/test.csv",
    models_dir: str = "models",
    random_state: int = 42
):
    """
    Train Phase 2 Behavioral Classifier.
    """
    try:
        from xgboost import XGBClassifier
    except ImportError:
        logger.warning("XGBoost not available; falling back to HistGradientBoostingClassifier from sklearn.")
        from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier

    os.makedirs(models_dir, exist_ok=True)
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    X_train = extract_all_behavioral_features(train_df)
    y_train = train_df["label"].astype(int).values

    X_test = extract_all_behavioral_features(test_df)
    y_test = test_df["label"].astype(int).values

    logger.info(f"Behavioral features shape: {X_train.shape}")
    model = XGBClassifier(random_state=random_state)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred

    metrics = evaluate_model(y_test, y_pred, y_prob)
    print_benchmark_report(metrics, model_name="Phase 2 Behavioral Model")

    model_path = os.path.join(models_dir, "behavioral_model.joblib")
    joblib.dump(model, model_path)
    logger.info(f"Saved behavioral model to '{model_path}'")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Phase 2 Behavioral Training")
    parser.add_argument("--train-path", type=str, default="data/processed/train.csv")
    parser.add_argument("--test-path", type=str, default="data/processed/test.csv")
    parser.add_argument("--models-dir", type=str, default="models")
    args = parser.parse_args()

    train_behavioral_model(args.train_path, args.test_path, args.models_dir)
