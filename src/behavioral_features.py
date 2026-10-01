"""
VerityCheck - Behavioral & Metadata Feature Engineering Module (Phase 2 Scaffold)
Extracts reviewer activity dynamics, product rating deviations, verified purchase rates,
and temporal burst patterns from review metadata.
"""

import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def extract_reviewer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute reviewer-level behavioral signals:
      - reviewer_total_reviews: Total volume of reviews authored by the reviewer
      - reviewer_avg_rating: Mean rating submitted by reviewer
      - reviewer_rating_std: Standard deviation of reviewer ratings (low std indicates bias)
      - reviewer_verified_ratio: Percentage of verified purchase reviews by this user
    """
    features = pd.DataFrame(index=df.index)

    if "reviewer_id" not in df.columns:
        logger.warning("No 'reviewer_id' column found; returning default values.")
        features["reviewer_total_reviews"] = 1
        features["reviewer_avg_rating"] = df["rating"] if "rating" in df.columns else 3.0
        features["reviewer_verified_ratio"] = 0.5
        return features

    # Aggregate reviewer stats
    grouped = df.groupby("reviewer_id")
    rev_counts = grouped.size()
    rev_avg_rating = grouped["rating"].mean() if "rating" in df.columns else None

    features["reviewer_total_reviews"] = df["reviewer_id"].map(rev_counts).fillna(1)
    if rev_avg_rating is not None:
        features["reviewer_avg_rating"] = df["reviewer_id"].map(rev_avg_rating).fillna(3.0)

    if "verified_purchase" in df.columns:
        rev_ver_ratio = grouped["verified_purchase"].mean()
        features["reviewer_verified_ratio"] = df["reviewer_id"].map(rev_ver_ratio).fillna(0.0)

    return features


def extract_product_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute product-level metadata signals:
      - product_total_reviews: Total number of reviews on the product
      - product_avg_rating: Mean product rating across all reviews
      - rating_deviation: Absolute difference between current review rating and product average
    """
    features = pd.DataFrame(index=df.index)

    if "product_id" not in df.columns or "rating" not in df.columns:
        logger.warning("Missing 'product_id' or 'rating'; returning defaults.")
        features["product_total_reviews"] = 1
        features["product_avg_rating"] = 3.0
        features["rating_deviation"] = 0.0
        return features

    prod_group = df.groupby("product_id")
    prod_counts = prod_group.size()
    prod_mean_rating = prod_group["rating"].mean()

    features["product_total_reviews"] = df["product_id"].map(prod_counts).fillna(1)
    features["product_avg_rating"] = df["product_id"].map(prod_mean_rating).fillna(3.0)
    features["rating_deviation"] = (df["rating"] - features["product_avg_rating"]).abs()

    return features


def extract_all_behavioral_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Assemble complete matrix of behavioral and metadata signals.
    """
    rev_feats = extract_reviewer_features(df)
    prod_feats = extract_product_features(df)

    behavioral_df = pd.concat([rev_feats, prod_feats], axis=1)

    if "verified_purchase" in df.columns:
        behavioral_df["is_verified"] = df["verified_purchase"].astype(int)

    if "rating" in df.columns:
        behavioral_df["raw_rating"] = df["rating"].astype(float)

    return behavioral_df
