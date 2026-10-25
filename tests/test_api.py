"""
Tests for Phase 6: FastAPI Backend Endpoints (api/)
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify /health returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models_loaded" in data


def test_analyze_valid_request():
    """Verify /analyze processes a valid review payload and returns trust score matching model."""
    payload = {
        "text": "AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!",
        "rating": 5.0,
        "verified_purchase": False,
        "reviewer_id": "USR_BOT_0034",
        "product_id": "PROD_004"
    }

    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "trust_score" in data
    assert "label" in data
    assert "top_factors" in data
    assert "human_readable_explanation" in data
    assert data["label"] == "deceptive"
    assert data["trust_score"] < 50.0


def test_analyze_malformed_request_422():
    """Verify malformed requests (missing required text or invalid rating) fail with 422."""
    bad_payload = {
        "rating": 7.0,  # Invalid: max is 5.0
        "verified_purchase": True
    }
    response = client.post("/analyze", json=bad_payload)
    assert response.status_code == 422


def test_reviewer_endpoint():
    """Verify /reviewer/{id} returns profile stats."""
    response = client.get("/reviewer/USR_UNKNOWN_TEST")
    assert response.status_code == 200
    data = response.json()
    assert data["reviewer_id"] == "USR_UNKNOWN_TEST"
    assert data["is_new_reviewer"] is True
