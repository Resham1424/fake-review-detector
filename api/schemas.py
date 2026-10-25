"""
Pydantic Schemas for VerityCheck FastAPI Service
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FactorItem(BaseModel):
    feature: str
    impact: float
    direction: str = Field(description="'increases_suspicion' or 'decreases_suspicion'")


class ReviewAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw review text")
    rating: float = Field(..., ge=1.0, le=5.0, description="Star rating from 1.0 to 5.0")
    verified_purchase: bool = Field(False, description="Whether order was verified by merchant")
    reviewer_id: Optional[str] = Field("USR_UNKNOWN", description="Reviewer account ID")
    product_id: Optional[str] = Field("PROD_UNKNOWN", description="Product catalog ID")
    timestamp: Optional[str] = Field(None, description="ISO timestamp of submission")


class ReviewAnalysisResponse(BaseModel):
    trust_score: float = Field(..., ge=0.0, le=100.0, description="Score 0-100 (100 = authentic, 0 = fake)")
    label: str = Field(..., description="'genuine' or 'deceptive'")
    top_factors: List[FactorItem] = Field(default_factory=list, description="Top 5 SHAP attribution factors")
    human_readable_explanation: str = Field(..., description="Plain-English natural language summary")


class ReviewerProfileResponse(BaseModel):
    reviewer_id: str
    is_known_reviewer: bool
    is_new_reviewer: bool
    total_reviews: int
    average_rating: float
    verified_purchase_ratio: float
    rating_std: float
    anomaly_flags: List[str]


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    models_loaded: bool = True
