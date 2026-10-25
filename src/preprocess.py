"""
VerityCheck - Data Preprocessing & Ingestion Module
Handles raw review ingestion, text cleaning/normalization, schema validation,
synthetic benchmark dataset generation (fallback), and train/test dataset splitting.
"""

import os
import re
import argparse
import random
import logging
from typing import Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Common English contraction mappings
CONTRACTIONS = {
    r"won\'t": "will not",
    r"can\'t": "can not",
    r"n\'t": " not",
    r"\'re": " are",
    r"\'s": " is",
    r"\'d": " would",
    r"\'ll": " will",
    r"\'t": " not",
    r"\'ve": " have",
    r"\'m": " am",
}


def clean_text(text: Optional[str]) -> str:
    """
    Clean and normalize raw review text.
    Operations:
      - Convert to string and handle NaN/None
      - Lowercase
      - Strip HTML tags and URLs
      - Expand contractions
      - Remove special non-alphanumeric noise (preserving words and whitespace)
      - Normalize repeated whitespace
    """
    if text is None or pd.isna(text):
        return ""

    text = str(text).lower()

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Expand contractions
    for pattern, replacement in CONTRACTIONS.items():
        text = re.sub(pattern, replacement, text)

    # Replace non-alphanumeric characters (keep basic alphanumeric and whitespace)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)

    # Normalize multiple whitespace characters
    text = re.sub(r"\s+", " ", text).strip()

    return text


def generate_synthetic_reviews(n_samples: int = 1200, random_state: int = 42) -> pd.DataFrame:
    """
    Generate a realistic synthetic review dataset when raw data is not provided.
    Models distinct linguistic and behavioral patterns for genuine (0) vs deceptive (1) reviews.
    """
    np.random.seed(random_state)
    random.seed(random_state)

    logger.info(f"Generating synthetic dataset with {n_samples} reviews...")

    genuine_templates = [
        "I bought this {product} about two weeks ago. The build quality is {quality_adj}, though {mild_con}. Overall {rating_verdict}.",
        "Decent {product} for the price. The setup was {setup_adj}, but battery life could be slightly better. Lasts around {hours} hours.",
        "After using this {product} daily, I noticed that {feature} works great. However, {con_detail}. Still worth the money.",
        "Arrived in {packaging} packaging. Feels sturdy in hand. I had an issue with {feature} initially, but customer support helped resolve it.",
        "Good value. Not the most premium {product} on the market, but performs as advertised for everyday use.",
        "I compared this with a competing brand and preferred this one because {comparison_reason}. Fits comfortably and does its job.",
        "Works as expected. Color matches the pictures. Shipping took {days} days which was on time.",
        "Solid 4 stars. Does what it says. Only taking off one star because {con_detail}.",
        "Purchased during the holiday sale. Setup took about 15 minutes. It handles {use_case} smoothly without overheating.",
        "Honest review: sound/display quality is crisp, buttons feel responsive. The cable could have been longer.",
    ]

    fake_positive_templates = [
        "AMAZING PRODUCT!!! BEST {product} EVER! Five stars A+++++ MUST BUY NOW!!!",
        "Absolutely love it! Best purchase of my life! Everyone should buy this right now! Truly fantastic!",
        "Works like magic! High quality best price fast shipping highly recommend to all my friends and family!!!",
        "Top notch quality! 100% genuine and perfect! I will buy 10 more for gifts! WOW WOW WOW!",
        "Great product great seller great price buy buy buy! You will never regret this purchase!",
        "Incredible seller! Product arrived super fast! 10/10 perfect condition best item ever made!",
    ]

    fake_negative_templates = [
        "TOTAL SCAM! DO NOT BUY! Worst {product} ever made broke in 2 seconds absolute garbage trash!",
        "Complete waste of money! Zero stars if I could! Horrible fake product seller is a crook!",
        "BROKEN ON ARRIVAL! Terrible customer service refused refund! Avoid this company at all costs!",
        "DO NOT TRUST THIS! The 5 star reviews are fake! It destroyed my setup and smelled like burning plastic!",
    ]

    products = ["wireless earbuds", "smart watch", "ergonomic keyboard", "gaming mouse", "bluetooth speaker", "USB-C hub", "power bank"]
    quality_adjs = ["solid", "decent", "standard", "better than expected", "fairly durable"]
    mild_cons = ["the manual was poorly translated", "the indicator LED is bright at night", "it gets warm after long hours"]
    rating_verdicts = ["good value for money", "I am satisfied with it", "recommended for casual use"]
    setup_adjs = ["straightforward", "quick", "simple", "a bit tricky at first"]
    features = ["pairing", "touch controls", "fast charging", "standby mode"]
    con_details = ["the companion app crashes occasionally", "it feels slightly plasticky", "the bass is slightly muddy", "the hinge feels a little loose"]
    packagings = ["minimalist eco-friendly", "standard cardboard", "compact", "secure retail"]
    use_cases = ["daily gym workouts", "office multitasking", "casual gaming", "commute listening"]
    comparison_reasons = ["the ergonomic grip fits smaller hands better", "it connects faster via Bluetooth", "the weight distribution is more balanced"]

    rows = []
    half = n_samples // 2

    # Genuine reviews (label = 0)
    for i in range(half):
        tmpl = random.choice(genuine_templates)
        text = tmpl.format(
            product=random.choice(products),
            quality_adj=random.choice(quality_adjs),
            mild_con=random.choice(mild_cons),
            rating_verdict=random.choice(rating_verdicts),
            setup_adj=random.choice(setup_adjs),
            hours=random.randint(6, 24),
            feature=random.choice(features),
            con_detail=random.choice(con_details),
            packaging=random.choice(packagings),
            days=random.randint(2, 5),
            use_case=random.choice(use_cases),
            comparison_reason=random.choice(comparison_reasons),
        )
        rating = float(np.random.choice([3.0, 4.0, 5.0], p=[0.25, 0.45, 0.30]))
        rows.append({
            "review_id": f"REV_{i+1:06d}",
            "text": text,
            "rating": rating,
            "verified_purchase": bool(np.random.choice([True, False], p=[0.85, 0.15])),
            "reviewer_id": f"USR_GEN_{random.randint(100, 500):04d}",
            "product_id": f"PROD_{random.randint(1, 25):03d}",
            "timestamp": f"2026-{random.randint(1, 8):02d}-{random.randint(1, 28):02d} {random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00",
            "label": 0
        })

    # Fake reviews (label = 1)
    for i in range(half, n_samples):
        is_pos = np.random.rand() > 0.3
        tmpl = random.choice(fake_positive_templates if is_pos else fake_negative_templates)
        text = tmpl.format(product=random.choice(products))
        rating = 5.0 if is_pos else 1.0
        rows.append({
            "review_id": f"REV_{i+1:06d}",
            "text": text,
            "rating": rating,
            "verified_purchase": bool(np.random.choice([True, False], p=[0.25, 0.75])),
            "reviewer_id": f"USR_BOT_{random.randint(1, 50):04d}",
            "product_id": f"PROD_{random.randint(1, 25):03d}",
            "timestamp": f"2026-08-{random.randint(10, 15):02d} {random.randint(1, 4):02d}:{random.randint(0, 59):02d}:00",
            "label": 1
        })

    df = pd.DataFrame(rows)
    return df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
