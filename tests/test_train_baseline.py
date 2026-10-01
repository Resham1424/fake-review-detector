"""
Unit tests for baseline evaluation, model training pipeline, and artifact creation.
"""

import os
import shutil
import tempfile
import pytest
import numpy as np
import pandas as pd
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from train_baseline import evaluate_model, train_and_evaluate_baseline
from preprocess import generate_synthetic_reviews


def test_evaluate_model():
    y_true = np.array([0, 1, 0, 1, 1, 0])
    y_pred = np.array([0, 1, 0, 1, 0, 0])
    y_prob = np.array([0.1, 0.9, 0.2, 0.8, 0.4, 0.3])

    metrics = evaluate_model(y_true, y_pred, y_prob)

    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["accuracy"] == pytest.approx(5 / 6)
    assert metrics["precision"] == pytest.approx(1.0)
    assert metrics["recall"] == pytest.approx(2 / 3)


def test_train_and_evaluate_baseline_end_to_end():
    temp_dir = tempfile.mkdtemp()
    try:
        raw_csv = os.path.join(temp_dir, "raw", "reviews.csv")
        proc_dir = os.path.join(temp_dir, "processed")
        models_dir = os.path.join(temp_dir, "models")
        os.makedirs(os.path.dirname(raw_csv), exist_ok=True)

        # Generate small dataset
        df = generate_synthetic_reviews(n_samples=200, random_state=42)
        df.to_csv(raw_csv, index=False)

        train_path = os.path.join(proc_dir, "train.csv")
        test_path = os.path.join(proc_dir, "test.csv")

        metrics = train_and_evaluate_baseline(
            train_path=train_path,
            test_path=test_path,
            models_dir=models_dir,
            c_param=1.0,
            max_iter=500,
            random_state=42
        )

        assert os.path.exists(os.path.join(models_dir, "baseline_logreg.joblib"))
        assert os.path.exists(os.path.join(models_dir, "tfidf_vectorizer.joblib"))
        assert os.path.exists(os.path.join(models_dir, "baseline_metrics.json"))

        assert metrics["accuracy"] > 0.70
        assert metrics["f1_score"] > 0.70
        assert metrics["roc_auc"] > 0.70
    finally:
        shutil.rmtree(temp_dir)
