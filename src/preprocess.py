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

    # Templates and fragments for genuine reviews (nuanced, balanced, specific detail)
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

    # Templates and fragments for fake / deceptive reviews (hyperbolic, vague praise, generic complaints, spam keywords)
    fake_positive_templates = [
        "AMAZING PRODUCT!!! BEST {product} EVER! Five stars A+++++ MUST BUY NOW!!!",
        "Absolutely love it! Best purchase of my life! Everyone should buy this right now! Truly fantastic!",
        "Works like magic! High quality best price fast shipping highly recommend to all my friends and family!!!",
        "Top notch quality! 100% genuine and perfect! I will buy 10 more for gifts! WOW WOW WOW!",
        "Incredible seller! Product arrived super fast! 10/10 perfect condition best item ever made!",
        "Great product great seller great price buy buy buy! You will never regret this purchase!",
    ]
    fake_negative_templates = [
        "TOTAL SCAM! DO NOT BUY! Worst {product} ever made broke in 2 seconds absolute garbage trash!",
        "Complete waste of money! Zero stars if I could! Horrible fake product seller is a crook!",
        "BROKEN ON ARRIVAL! Terrible customer service refused refund! Avoid this company at all costs!",
        "DO NOT TRUST THIS! The 5 star reviews are fake! It destroyed my setup and smelled like burning plastic!",
    ]

    products = ["wireless earbuds", "smart watch", "ergonomic keyboard", "gaming mouse", "power bank", "bluetooth speaker", "USB-C hub"]
    quality_adjs = ["solid", "fairly durable", "standard", "better than expected", "adequate"]
    setup_adjs = ["straightforward", "simple", "a bit tricky at first", "quick"]
    mild_cons = ["the manual was poorly translated", "the charging cord is a bit short", "it gets warm after long hours", "the indicator LED is bright at night"]
    rating_verdicts = ["I am satisfied with it", "it is good value for money", "it serves my needs well", "I would recommend it to budget-conscious buyers"]
    con_details = ["the companion app crashes occasionally", "it feels slightly plasticky", "the bass is slightly muddy", "the hinge feels a little loose"]
    packaging_types = ["minimalist eco-friendly", "standard cardboard", "secure retail", "compact"]
    comparison_reasons = ["the ergonomic grip fits smaller hands better", "it connects faster via Bluetooth", "the weight distribution is more balanced"]
    use_cases = ["office multitasking", "daily gym workouts", "commute listening", "casual gaming"]

    records = []
    n_fake = n_samples // 2
    n_genuine = n_samples - n_fake

    # Generate genuine reviews (Label = 0)
    for i in range(n_genuine):
        tmpl = random.choice(genuine_templates)
        text = tmpl.format(
            product=random.choice(products),
            quality_adj=random.choice(quality_adjs),
            setup_adj=random.choice(setup_adjs),
            mild_con=random.choice(mild_cons),
            rating_verdict=random.choice(rating_verdicts),
            con_detail=random.choice(con_details),
            packaging=random.choice(packaging_types),
            comparison_reason=random.choice(comparison_reasons),
            use_case=random.choice(use_cases),
            feature=random.choice(["touch controls", "pairing", "standby mode", "fast charging"]),
            hours=random.randint(6, 24),
            days=random.randint(2, 5),
        )
        rating = float(np.random.choice([3, 4, 5], p=[0.2, 0.45, 0.35]))
        verified = bool(np.random.choice([True, False], p=[0.88, 0.12]))
        reviewer_id = f"USR_GEN_{random.randint(100, 500):04d}"
        product_id = f"PROD_{random.randint(1, 25):03d}"
        timestamp = f"2026-{random.randint(1, 8):02d}-{random.randint(1, 28):02d} {random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00"
        records.append({
            "review_id": f"REV_{i+1:06d}",
            "text": text,
            "rating": rating,
            "verified_purchase": verified,
            "reviewer_id": reviewer_id,
            "product_id": product_id,
            "timestamp": timestamp,
            "label": 0
        })

    # Generate fake reviews (Label = 1)
    for j in range(n_fake):
        is_pos = random.random() < 0.8
        if is_pos:
            tmpl = random.choice(fake_positive_templates)
            text = tmpl.format(product=random.choice(products))
            rating = 5.0
        else:
            tmpl = random.choice(fake_negative_templates)
            text = tmpl.format(product=random.choice(products))
            rating = 1.0

        verified = bool(np.random.choice([True, False], p=[0.18, 0.82]))
        reviewer_id = f"USR_BOT_{random.randint(1, 50):04d}"
        product_id = f"PROD_{random.randint(1, 25):03d}"
        timestamp = f"2026-08-{random.randint(10, 15):02d} {random.randint(1, 4):02d}:{random.randint(0, 59):02d}:00"
        records.append({
            "review_id": f"REV_{n_genuine+j+1:06d}",
            "text": text,
            "rating": rating,
            "verified_purchase": verified,
            "reviewer_id": reviewer_id,
            "product_id": product_id,
            "timestamp": timestamp,
            "label": 1
        })

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df


def load_and_preprocess_data(
    raw_path: str = "data/raw/reviews.csv",
    output_dir: str = "data/processed",
    test_size: float = 0.2,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load raw dataset (or generate synthetic if missing), clean review text,
    perform stratified train-test split, and write processed datasets.
    
    Returns:
        (train_df, test_df)
    """
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(raw_path):
        logger.warning(f"Raw data file not found at '{raw_path}'. Generating synthetic fallback dataset...")
        df_synthetic = generate_synthetic_reviews(n_samples=1200, random_state=random_state)
        df_synthetic.to_csv(raw_path, index=False)
        logger.info(f"Saved synthetic dataset to '{raw_path}' with shape {df_synthetic.shape}")
        df = df_synthetic
    else:
        logger.info(f"Loading raw reviews from '{raw_path}'...")
        df = pd.read_csv(raw_path)

    required_cols = {"text", "label"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}. Present columns: {list(df.columns)}")

    logger.info(f"Initial raw dataset shape: {df.shape}")

    # Standardize types and clean text
    df["label"] = df["label"].astype(int)
    if "verified_purchase" in df.columns:
        df["verified_purchase"] = df["verified_purchase"].astype(bool)
    if "rating" in df.columns:
        df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(3.0)

    # Clean text column
    df["cleaned_text"] = df["text"].apply(clean_text)
    df["clean_text"] = df["cleaned_text"]

    # Filter out empty or whitespace-only texts after cleaning
    valid_mask = df["cleaned_text"].str.strip().str.len() > 0
    df = df[valid_mask].copy()
    logger.info(f"Dataset shape after filtering empty cleaned reviews: {df.shape}")

    # Save full cleaned dataset
    reviews_clean_path = os.path.join(output_dir, "reviews_clean.csv")
    df.to_csv(reviews_clean_path, index=False)
    logger.info(f"Saved full clean reviews dataset to '{reviews_clean_path}'")

    # Stratified Train/Test Split
    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=df["label"],
        random_state=random_state
    )

    train_path = os.path.join(output_dir, "train.csv")
    test_path = os.path.join(output_dir, "test.csv")

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    logger.info(f"Processed Train set: {train_df.shape} saved to '{train_path}' (Label balance: {dict(train_df['label'].value_counts())})")
    logger.info(f"Processed Test set: {test_df.shape} saved to '{test_path}' (Label balance: {dict(test_df['label'].value_counts())})")

    return train_df, test_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VerityCheck Data Preprocessing & Ingestion")
    parser.add_argument("--raw-path", type=str, default="data/raw/reviews.csv", help="Path to raw reviews CSV")
    parser.add_argument("--output-dir", type=str, default="data/processed", help="Directory to save processed splits")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split proportion")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--generate-synthetic", action="store_true", help="Force regeneration of synthetic dataset")
    parser.add_argument("--samples", type=int, default=1200, help="Number of synthetic samples to generate if creating")

    args = parser.parse_args()

    if args.generate_synthetic:
        os.makedirs(os.path.dirname(args.raw_path), exist_ok=True)
        synthetic_df = generate_synthetic_reviews(n_samples=args.samples, random_state=args.seed)
        synthetic_df.to_csv(args.raw_path, index=False)
        logger.info(f"Forced generation of synthetic dataset at '{args.raw_path}'.")

    load_and_preprocess_data(
        raw_path=args.raw_path,
        output_dir=args.output_dir,
        test_size=args.test_size,
        random_state=args.seed
    )
