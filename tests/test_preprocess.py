"""
Unit tests for data preprocessing, text cleaning, and synthetic sample generation.
"""

import os
import shutil
import tempfile
import pytest
import pandas as pd
import sys

# Ensure src is in sys.path for test runner
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from preprocess import clean_text, generate_synthetic_reviews, load_and_preprocess_data


def test_clean_text_basic():
    raw = "Great product! Works well."
    cleaned = clean_text(raw)
    assert cleaned == "great product works well"


def test_clean_text_html_and_urls():
    raw = "Check <a href='http://spam.com'>this link</a> http://example.com/item and <br> enjoy!"
    cleaned = clean_text(raw)
    assert "http" not in cleaned
    assert "href" not in cleaned
    assert "<" not in cleaned
    assert ">" not in cleaned
    assert "this link" in cleaned
    assert "enjoy" in cleaned


def test_clean_text_contractions():
    raw = "I can't believe it won't work, it's really bad!"
    cleaned = clean_text(raw)
    assert "can not" in cleaned
    assert "will not" in cleaned
    assert "it is" in cleaned


def test_clean_text_none_and_empty():
    assert clean_text(None) == ""
    assert clean_text("") == ""
    assert clean_text("   \n\t  ") == ""


def test_generate_synthetic_reviews_schema():
    df = generate_synthetic_reviews(n_samples=100, random_state=42)
    assert len(df) == 100
    expected_cols = {"review_id", "text", "rating", "verified_purchase", "reviewer_id", "product_id", "timestamp", "label"}
    assert expected_cols.issubset(set(df.columns))
    assert set(df["label"].unique()) == {0, 1}
    assert (df["rating"] >= 1.0).all() and (df["rating"] <= 5.0).all()
    assert df["text"].str.len().min() > 5


def test_load_and_preprocess_data_pipeline():
    temp_dir = tempfile.mkdtemp()
    try:
        raw_path = os.path.join(temp_dir, "raw", "reviews.csv")
        proc_dir = os.path.join(temp_dir, "processed")

        # Test automatic generation when raw file is missing
        train_df, test_df = load_and_preprocess_data(
            raw_path=raw_path,
            output_dir=proc_dir,
            test_size=0.25,
            random_state=42
        )

        assert os.path.exists(raw_path)
        assert os.path.exists(os.path.join(proc_dir, "train.csv"))
        assert os.path.exists(os.path.join(proc_dir, "test.csv"))

        total = len(train_df) + len(test_df)
        assert len(test_df) == int(total * 0.25)
        assert "cleaned_text" in train_df.columns
        assert "cleaned_text" in test_df.columns

        # Verify stratification ratio
        train_pos_ratio = train_df["label"].mean()
        test_pos_ratio = test_df["label"].mean()
        assert abs(train_pos_ratio - test_pos_ratio) < 0.05
    finally:
        shutil.rmtree(temp_dir)
