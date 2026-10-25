"""
VerityCheck - Text Feature Engineering Module
Provides TF-IDF vectorization configuration, serialization helpers,
and rich linguistic feature extraction (lexical diversity, punctuation patterns, capitalization).
"""

import os
import re
import logging
from typing import Tuple, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def build_tfidf_vectorizer(
    max_features: int = 5000,
    ngram_range: Tuple[int, int] = (1, 2),
    min_df: int = 2,
    sublinear_tf: bool = True,
    stop_words: str = "english"
) -> TfidfVectorizer:
    """
    Construct a scikit-learn TfidfVectorizer with production defaults for review spam detection.
    """
    return TfidfVectorizer(
        max_features=max_features,
        ngram_range=ngram_range,
        min_df=min_df,
        sublinear_tf=sublinear_tf,
        stop_words=stop_words,
        strip_accents="unicode"
    )


def extract_linguistic_features(df: pd.DataFrame, text_col: str = "text") -> pd.DataFrame:
    """
    Extract complementary stylistic/linguistic features from review text.
    Features:
      - char_count: Total raw character length
      - word_count: Total token count
      - avg_word_length: Average character length per word
      - exclamation_count: Raw count of exclamation marks (!)
      - question_count: Raw count of question marks (?)
      - uppercase_ratio: Proportion of uppercase characters (indicates shouting/hyperbole)
      - digit_ratio: Proportion of digit characters
      - lexical_diversity: Ratio of unique words to total words
    """
    if text_col not in df.columns:
        raise ValueError(f"Column '{text_col}' not found in DataFrame.")

    features = pd.DataFrame(index=df.index)
    series = df[text_col].fillna("").astype(str)

    features["char_count"] = series.apply(len)
    features["word_count"] = series.apply(lambda x: len(x.split()) if x else 0)
    features["avg_word_length"] = series.apply(
        lambda x: np.mean([len(w) for w in x.split()]) if x.split() else 0.0
    )
    features["exclamation_count"] = series.apply(lambda x: x.count("!"))
    features["question_count"] = series.apply(lambda x: x.count("?"))
    features["uppercase_ratio"] = series.apply(
        lambda x: sum(1 for c in x if c.isupper()) / max(len(x), 1)
    )
    features["digit_ratio"] = series.apply(
        lambda x: sum(1 for c in x if c.isdigit()) / max(len(x), 1)
    )
    features["lexical_diversity"] = series.apply(
        lambda x: len(set(x.lower().split())) / max(len(x.split()), 1)
    )

    return features


def save_vectorizer(vectorizer: TfidfVectorizer, filepath: str = "models/tfidf_vectorizer.joblib") -> None:
    """Save fitted TF-IDF vectorizer artifact to disk."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(vectorizer, filepath)
    logger.info(f"Saved TF-IDF vectorizer to '{filepath}'")


def load_vectorizer(filepath: str = "models/tfidf_vectorizer.joblib") -> TfidfVectorizer:
    """Load saved TF-IDF vectorizer artifact from disk."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Vectorizer file not found at '{filepath}'")
    vectorizer = joblib.load(filepath)
    return vectorizer
