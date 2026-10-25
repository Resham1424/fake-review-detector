"""
Tests for Phase 5: SHAP Explainability Engine (src/explain.py)
"""

import pytest
from src.explain import explain_review, to_human_readable


def test_explain_review_keys():
    """Verify explain_review returns the required dictionary keys and value ranges."""
    sample = {
        "text": "AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!",
        "rating": 5.0,
        "verified_purchase": False,
        "reviewer_id": "USR_BOT_0034",
        "product_id": "PROD_004"
    }

    result = explain_review(sample)

    assert "trust_score" in result
    assert isinstance(result["trust_score"], (int, float))
    assert 0.0 <= result["trust_score"] <= 100.0

    assert "label" in result
    assert result["label"] in ["genuine", "deceptive"]
    assert result["label"] == "deceptive"

    assert "top_factors" in result
    assert isinstance(result["top_factors"], list)
    assert len(result["top_factors"]) <= 5

    for factor in result["top_factors"]:
        assert "feature" in factor
        assert "impact" in factor
        assert "direction" in factor
        assert factor["direction"] in ["increases_suspicion", "decreases_suspicion"]


def test_to_human_readable_no_leaks():
    """Verify to_human_readable produces plain English without leaking raw feature names or floats."""
    explanation = {
        "trust_score": 12.5,
        "label": "deceptive",
        "top_factors": [
            {"feature": "best purchase of my life", "impact": 0.45, "direction": "increases_suspicion"},
            {"feature": "is_verified", "impact": 0.38, "direction": "increases_suspicion"},
            {"feature": "is_new_reviewer", "impact": 0.28, "direction": "increases_suspicion"}
        ]
    }

    sentence = to_human_readable(explanation)

    assert isinstance(sentence, str)
    assert len(sentence) > 20
    # Confirm no raw code variable names leak
    assert "is_verified" not in sentence
    assert "is_new_reviewer" not in sentence
    assert "0.45" not in sentence
    assert "0.38" not in sentence


def test_genuine_explanation():
    """Verify that a nuanced authentic review generates high trust and genuine factors."""
    sample = {
        "text": "Arrived in standard cardboard packaging. Feels sturdy in hand. I had an issue with fast charging initially, but customer support helped resolve it.",
        "rating": 4.0,
        "verified_purchase": True,
        "reviewer_id": "USR_GEN_0139",
        "product_id": "PROD_009"
    }

    result = explain_review(sample)
    assert result["trust_score"] >= 60.0
    assert result["label"] == "genuine"

    sentence = to_human_readable(result)
    assert "authentic" in sentence.lower() or "genuine" in sentence.lower()
