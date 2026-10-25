"""
FastAPI Route Handlers for VerityCheck API
"""

import io
import csv
from typing import List, Union
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from api.schemas import (
    ReviewAnalysisRequest,
    ReviewAnalysisResponse,
    ReviewerProfileResponse,
    HealthResponse
)

try:
    from src.explain import explain_review, to_human_readable
    from src.behavioral_features import get_reviewer_aggregate_stats
except ImportError:
    from explain import explain_review, to_human_readable
    from behavioral_features import get_reviewer_aggregate_stats

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(request: Request):
    """Liveness and model status check."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_loaded=getattr(request.app.state, "models_loaded", True)
    )


@router.post("/analyze", response_model=ReviewAnalysisResponse)
def analyze_single_review(req: ReviewAnalysisRequest):
    """
    Analyzes a single product review using the dual-signal ensemble model.
    Returns trust score (0-100), label, top 5 SHAP factors, and human-readable explanation.
    """
    review_dict = req.model_dump()
    explanation = explain_review(review_dict)
    summary_text = to_human_readable(explanation)

    return ReviewAnalysisResponse(
        trust_score=explanation["trust_score"],
        label=explanation["label"],
        top_factors=explanation["top_factors"],
        human_readable_explanation=summary_text
    )


@router.post("/batch-analyze", response_model=List[ReviewAnalysisResponse])
async def batch_analyze(
    items: Optional[List[ReviewAnalysisRequest]] = None,
    file: Optional[UploadFile] = File(None)
):
    """
    Batch triage endpoint: accepts either a JSON list of review objects or a CSV file upload.
    """
    results: List[ReviewAnalysisResponse] = []

    # 1. Handle CSV file upload
    if file is not None:
        content = await file.read()
        decoded = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
        for row in reader:
            text = row.get("text", "")
            if not text.strip():
                continue
            rating = float(row.get("rating", 3.0))
            verified = str(row.get("verified_purchase", "false")).lower() in ["true", "1", "yes"]
            rev_dict = {
                "text": text,
                "rating": rating,
                "verified_purchase": verified,
                "reviewer_id": row.get("reviewer_id", "USR_UNKNOWN"),
                "product_id": row.get("product_id", "PROD_UNKNOWN")
            }
            exp = explain_review(rev_dict)
            results.append(ReviewAnalysisResponse(
                trust_score=exp["trust_score"],
                label=exp["label"],
                top_factors=exp["top_factors"],
                human_readable_explanation=to_human_readable(exp)
            ))
        return results

    # 2. Handle JSON array
    if items:
        for item in items:
            rev_dict = item.model_dump()
            exp = explain_review(rev_dict)
            results.append(ReviewAnalysisResponse(
                trust_score=exp["trust_score"],
                label=exp["label"],
                top_factors=exp["top_factors"],
                human_readable_explanation=to_human_readable(exp)
            ))
        return results

    raise HTTPException(status_code=400, detail="Must provide either JSON list of items or CSV file.")


@router.get("/reviewer/{reviewer_id}", response_model=ReviewerProfileResponse)
def get_reviewer_profile(reviewer_id: str):
    """
    Retrieves aggregate behavioral history for a reviewer from the dataset.
    """
    stats = get_reviewer_aggregate_stats(reviewer_id)
    return ReviewerProfileResponse(**stats)
