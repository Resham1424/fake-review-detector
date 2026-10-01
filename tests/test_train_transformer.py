"""
Unit tests for Phase 3 DistilBERT transformer training, dataset tokenization, and inference helper.
"""

import os
import shutil
import tempfile
import pytest
import numpy as np
import pandas as pd
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from train_transformer import (
    ReviewDataset,
    detect_device_and_config,
    evaluate_predictions
)


class DummyTokenizer:
    """Mock tokenizer for unit testing dataset preparation without remote network calls."""
    def __call__(self, text, truncation=True, padding="max_length", max_length=64, return_tensors="pt"):
        import torch
        seq_len = max_length
        return {
            "input_ids": torch.ones((1, seq_len), dtype=torch.long),
            "attention_mask": torch.ones((1, seq_len), dtype=torch.long)
        }


def test_review_dataset_structure():
    import torch
    tokenizer = DummyTokenizer()
    texts = ["Sample review text 1", "Another sample review"]
    labels = [1, 0]

    ds = ReviewDataset(texts, labels, tokenizer, max_length=32)
    assert len(ds) == 2

    sample = ds[0]
    assert "input_ids" in sample
    assert "attention_mask" in sample
    assert "labels" in sample
    assert sample["input_ids"].shape[0] == 32
    assert sample["labels"].item() == 1


def test_detect_device_and_config():
    device_cpu, config_cpu = detect_device_and_config(gpu_override=False)
    assert str(device_cpu) == "cpu"
    assert config_cpu["max_length"] == 64
    assert config_cpu["epochs"] == 2
    assert config_cpu["is_gpu"] is False

    device_gpu, config_gpu = detect_device_and_config(gpu_override=True)
    assert str(device_gpu) == "cuda"
    assert config_gpu["max_length"] == 128
    assert config_gpu["is_gpu"] is True


def test_evaluate_predictions_transformer():
    y_true = np.array([0, 1, 0, 1, 1, 0])
    y_pred = np.array([0, 1, 0, 1, 1, 0])
    y_prob = np.array([0.05, 0.95, 0.1, 0.9, 0.85, 0.2])

    metrics = evaluate_predictions(y_true, y_pred, y_prob)

    assert metrics["accuracy"] == 1.0
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0
    assert metrics["f1_score"] == 1.0
    assert metrics["roc_auc"] == 1.0
    assert metrics["confusion_matrix"] == [[3, 0], [0, 3]]
