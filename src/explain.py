"""
VerityCheck - Phase 5: Explainability Engine (SHAP & Feature Attribution)
Generates transparency reports explaining which text tokens and behavioral cues
triggered fake review flags.
"""

import os
import argparse
import logging
from typing import List, Dict, Any
import numpy as np
import pandas as pd
import joblib

try:
    from src.text_features import load_vectorizer
    from src.preprocess import clean_text
except ImportError:
    from text_features import load_vectorizer
    from preprocess import clean_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def explain_text_prediction(
    text: str,
    model_path: str = "models/baseline_logreg.joblib",
    vectorizer_path: str = "models/tfidf_vectorizer.joblib",
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Explain individual review prediction via Logistic Regression feature weights & TF-IDF scores.
    """
    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        raise FileNotFoundError("Model or Vectorizer artifacts missing.")

    model = joblib.load(model_path)
    vectorizer = load_vectorizer(vectorizer_path)

    cleaned = clean_text(text)
    tfidf_vec = vectorizer.transform([cleaned])
    prob_fake = float(model.predict_proba(tfidf_vec)[0, 1])
    is_fake = bool(prob_fake >= 0.5)

    # Feature contribution = tfidf_weight * model_coefficient
    feature_names = vectorizer.get_feature_names_out()
    nonzero_indices = tfidf_vec.nonzero()[1]
    
    contributions = []
    for idx in nonzero_indices:
        token = feature_names[idx]
        val = tfidf_vec[0, idx]
        coef = model.coef_[0, idx]
        impact = float(val * coef)
        contributions.append({
            "token": token,
            "tfidf_value": round(float(val), 4),
            "coefficient": round(float(coef), 4),
            "impact_score": round(impact, 4),
            "indicates": "Fake/Deceptive" if impact > 0 else "Genuine"
        })

    # Sort by absolute impact
    contributions.sort(key=lambda x: abs(x["impact_score"]), reverse=True)

    result = {
        "raw_text": text,
        "cleaned_text": cleaned,
        "predicted_label": 1 if is_fake else 0,
        "authenticity_risk_score": round(prob_fake, 4),
        "verdict": "Likely Fake" if is_fake else "Likely Genuine",
        "top_contributing_tokens": contributions[:top_k]
    }
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Explainability Tool")
    parser.add_argument("--text", type=str, default="AMAZING PRODUCT! BEST PURCHASE OF MY LIFE 5 STARS MUST BUY NOW!", help="Review text to explain")
    parser.add_argument("--top-k", type=int, default=5, help="Number of top explanatory tokens")
    args = parser.parse_args()

    explanation = explain_text_prediction(args.text, top_k=args.top_k)
    print("\n" + "=" * 60)
    print(f"VERITYCHECK EXPLANATION FOR: \"{explanation['raw_text']}\"")
    print("=" * 60)
    print(f"Verdict: {explanation['verdict']} (Risk Score: {explanation['authenticity_risk_score']:.2%})")
    print("Key Influential Tokens:")
    for item in explanation["top_contributing_tokens"]:
        print(f"  - '{item['token']}': impact {item['impact_score']:+.4f} ({item['indicates']})")
    print("=" * 60 + "\n")
