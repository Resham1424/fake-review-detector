"""
VerityCheck - Behavioral & Metadata Feature Engineering Module
Extracts reviewer activity dynamics, product rating deviations, verified purchase rates,
cold-start indicators (is_new_reviewer, is_new_product), and temporal burst patterns.
"""

import logging
from typing import Optional, Set, Dict, Any
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def extract_reviewer_features(
    df: pd.DataFrame,
    seen_reviewers: Optional[Set[str]] = None
) -> pd.DataFrame:
    """
    Compute reviewer-level behavioral signals:
      - reviewer_total_reviews: Total volume of reviews authored by the reviewer
      - reviewer_avg_rating: Mean rating submitted by reviewer
      - reviewer_rating_std: Standard deviation of reviewer ratings
      - reviewer_verified_ratio: Percentage of verified purchase reviews by this user
      - is_new_reviewer: 1 if reviewer is unseen in training history (cold-start), else 0
    """
    features = pd.DataFrame(index=df.index)

    if "reviewer_id" not in df.columns:
        features["reviewer_total_reviews"] = 1
        features["reviewer_avg_rating"] = df["rating"] if "rating" in df.columns else 3.0
        features["reviewer_verified_ratio"] = 0.5
        features["is_new_reviewer"] = 1
        return features

    # Check unseen / cold-start reviewers
    if seen_reviewers is not None:
        features["is_new_reviewer"] = df["reviewer_id"].apply(
            lambda rid: 1 if (rid not in seen_reviewers or str(rid).startswith("USR_UNKNOWN") or str(rid) == "") else 0
        )
    else:
        features["is_new_reviewer"] = 0

    # Aggregate reviewer stats within the provided dataset or mapping
    grouped = df.groupby("reviewer_id")
    rev_counts = grouped.size()
    rev_avg_rating = grouped["rating"].mean() if "rating" in df.columns else None

    features["reviewer_total_reviews"] = df["reviewer_id"].map(rev_counts).fillna(1)
    if rev_avg_rating is not None:
        features["reviewer_avg_rating"] = df["reviewer_id"].map(rev_avg_rating).fillna(3.0)
    else:
        features["reviewer_avg_rating"] = 3.0

    if "verified_purchase" in df.columns:
        rev_ver_ratio = grouped["verified_purchase"].mean()
        features["reviewer_verified_ratio"] = df["reviewer_id"].map(rev_ver_ratio).fillna(0.0)
    else:
        features["reviewer_verified_ratio"] = 0.5

    return features


def extract_product_features(
    df: pd.DataFrame,
    seen_products: Optional[Set[str]] = None
) -> pd.DataFrame:
    """
    Compute product-level metadata signals:
      - product_total_reviews: Total number of reviews on the product
      - product_avg_rating: Mean product rating across all reviews
      - rating_deviation: Absolute difference between current review rating and product average
      - is_new_product: 1 if product is unseen in training history, else 0
    """
    features = pd.DataFrame(index=df.index)

    if "product_id" not in df.columns or "rating" not in df.columns:
        features["product_total_reviews"] = 1
        features["product_avg_rating"] = 3.0
        features["rating_deviation"] = 0.0
        features["is_new_product"] = 1
        return features

    if seen_products is not None:
        features["is_new_product"] = df["product_id"].apply(
            lambda pid: 1 if (pid not in seen_products or str(pid).startswith("PROD_UNKNOWN") or str(pid) == "") else 0
        )
    else:
        features["is_new_product"] = 0

    prod_group = df.groupby("product_id")
    prod_counts = prod_group.size()
    prod_mean_rating = prod_group["rating"].mean()

    features["product_total_reviews"] = df["product_id"].map(prod_counts).fillna(1)
    features["product_avg_rating"] = df["product_id"].map(prod_mean_rating).fillna(3.0)
    features["rating_deviation"] = (df["rating"] - features["product_avg_rating"]).abs().fillna(0.0)

    return features


def extract_all_behavioral_features(
    df: pd.DataFrame,
    seen_reviewers: Optional[Set[str]] = None,
    seen_products: Optional[Set[str]] = None
) -> pd.DataFrame:
    """
    Assemble complete matrix of behavioral and metadata signals including cold-start features.
    """
    rev_feats = extract_reviewer_features(df, seen_reviewers=seen_reviewers)
    prod_feats = extract_product_features(df, seen_products=seen_products)

    behavioral_df = pd.concat([rev_feats, prod_feats], axis=1)

    if "verified_purchase" in df.columns:
        behavioral_df["is_verified"] = df["verified_purchase"].astype(int)
    else:
        behavioral_df["is_verified"] = 0

    if "rating" in df.columns:
        behavioral_df["raw_rating"] = df["rating"].astype(float)
    else:
        behavioral_df["raw_rating"] = 3.0

    return behavioral_df


def get_reviewer_aggregate_stats(
    reviewer_id: str,
    dataset_path: str = "data/processed/reviews_clean.csv"
) -> Dict[str, Any]:
    """
    Compute aggregate behavioral profile for a given reviewer_id from dataset.
    Used by Phase 6 GET /reviewer/{reviewer_id} endpoint.
    """
    try:
        df = pd.read_csv(dataset_path)
    except Exception:
        # Fallback to test.csv if clean file not present
        try:
            df = pd.read_csv("data/processed/test.csv")
        except Exception:
            df = pd.DataFrame()

    if df.empty or "reviewer_id" not in df.columns or reviewer_id not in df["reviewer_id"].values:
        return {
            "reviewer_id": reviewer_id,
            "is_known_reviewer": False,
            "is_new_reviewer": True,
            "total_reviews": 0,
            "average_rating": 3.0,
            "verified_purchase_ratio": 0.0,
            "rating_std": 0.0,
            "anomaly_flags": ["Cold-start: No prior purchase or review history on platform"]
        }

    rev_df = df[df["reviewer_id"] == reviewer_id]
    total_reviews = int(len(rev_df))
    avg_rating = float(rev_df["rating"].mean())
    verified_ratio = float(rev_df["verified_purchase"].mean()) if "verified_purchase" in rev_df.columns else 0.0
    rating_std = float(rev_df["rating"].std()) if total_reviews > 1 else 0.0

    flags = []
    if total_reviews <= 1:
        flags.append("Single-review disposable account")
    if verified_ratio == 0.0:
        flags.append("Zero verified transactions")
    if avg_rating == 5.0 and total_reviews >= 3:
        flags.append("Extreme positive polarization (100% 5★)")
    elif avg_rating == 1.0 and total_reviews >= 3:
        flags.append("Extreme negative polarization (100% 1★)")

    return {
        "reviewer_id": reviewer_id,
        "is_known_reviewer": True,
        "is_new_reviewer": False,
        "total_reviews": total_reviews,
        "average_rating": round(avg_rating, 2),
        "verified_purchase_ratio": round(verified_ratio, 2),
        "rating_std": round(rating_std, 2),
        "anomaly_flags": flags
    }
