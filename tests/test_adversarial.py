"""
Tests for Phase 8: Adversarial Robustness Testing (tests/test_adversarial.py)
Evaluates model accuracy separately across 3 adversarial attack vectors:
  1. well_written_fake (Astroturfed reviews with complex professional vocabulary)
  2. genuine_unusual_pattern (Authentic reviews with harsh language or burst velocity)
  3. paraphrase_attack (Reworded synonyms of known spam templates)
"""

import os
import pandas as pd
import pytest
from src.explain import explain_review


def test_adversarial_categories():
    csv_path = "data/adversarial/adversarial_samples.csv"
    assert os.path.exists(csv_path), "Adversarial test samples file missing."

    df = pd.read_csv(csv_path)
    assert "case_type" in df.columns
    assert "label" in df.columns

    categories = df["case_type"].unique()
    assert len(categories) >= 3

    results_by_category = {}

    for cat in categories:
        cat_df = df[df["case_type"] == cat]
        correct = 0
        total = len(cat_df)

        for _, row in cat_df.iterrows():
            rev = {
                "text": row["text"],
                "rating": float(row["rating"]),
                "verified_purchase": bool(row["verified_purchase"]),
                "reviewer_id": str(row["reviewer_id"]),
                "product_id": str(row["product_id"])
            }
            exp = explain_review(rev)
            pred_label = 0 if exp["label"] == "genuine" else 1
            if pred_label == int(row["label"]):
                correct += 1

        acc = correct / total
        results_by_category[cat] = {
            "correct": correct,
            "total": total,
            "accuracy": acc
        }

    print("\n" + "=" * 60)
    print("VERITYCHECK ADVERSARIAL ROBUSTNESS REPORT")
    print("=" * 60)
    for cat, res in results_by_category.items():
        print(f"[{cat.upper()}] Accuracy: {res['accuracy']:.1%} ({res['correct']}/{res['total']})")
    print("=" * 60 + "\n")

    # Assert that paraphrase attacks maintain reasonable detection
    assert results_by_category["paraphrase_attack"]["accuracy"] >= 0.60
