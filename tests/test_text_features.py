"""
Unit tests for text feature extraction and TF-IDF serialization.
"""

import os
import shutil
import tempfile
import pytest
import pandas as pd
import numpy as np
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from text_features import (
    build_tfidf_vectorizer,
    extract_linguistic_features,
    save_vectorizer,
    load_vectorizer
)


def test_build_tfidf_vectorizer():
    corpus = [
        "This is a great genuine product with good battery life.",
        "AMAZING BEST PRODUCT EVER 5 STARS MUST BUY NOW!!",
        "Terrible defective item broke immediately scam.",
        "Solid build quality, satisfied with overall performance."
    ]
    vectorizer = build_tfidf_vectorizer(max_features=50, ngram_range=(1, 2), min_df=1)
    X = vectorizer.fit_transform(corpus)
    assert X.shape[0] == 4
    assert X.shape[1] > 0
    assert "great" in vectorizer.vocabulary_ or "battery" in vectorizer.vocabulary_


def test_extract_linguistic_features():
    data = {
        "text": [
            "GREAT product! I loved it!!",
            "battery lasts 12 hours. good value for $50."
        ]
    }
    df = pd.DataFrame(data)
    feats = extract_linguistic_features(df, text_col="text")

    assert "char_count" in feats.columns
    assert "word_count" in feats.columns
    assert "exclamation_count" in feats.columns
    assert "uppercase_ratio" in feats.columns
    assert "digit_ratio" in feats.columns
    assert "lexical_diversity" in feats.columns

    # First row has more uppercase and exclamation marks
    assert feats.loc[0, "exclamation_count"] == 3
    assert feats.loc[0, "uppercase_ratio"] > feats.loc[1, "uppercase_ratio"]
    # Second row has digits
    assert feats.loc[1, "digit_ratio"] > 0


def test_vectorizer_save_load_roundtrip():
    temp_dir = tempfile.mkdtemp()
    try:
        corpus = ["Sample text for serialization testing.", "Another review sample."]
        vectorizer = build_tfidf_vectorizer(min_df=1)
        vectorizer.fit(corpus)

        save_path = os.path.join(temp_dir, "models", "test_vec.joblib")
        save_vectorizer(vectorizer, save_path)
        assert os.path.exists(save_path)

        loaded_vec = load_vectorizer(save_path)
        assert list(vectorizer.vocabulary_.keys()) == list(loaded_vec.vocabulary_.keys())
    finally:
        shutil.rmtree(temp_dir)
