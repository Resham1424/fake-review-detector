# VerityCheck — Dual-Signal Authenticity Scoring for Online Reviews

A production-grade, hybrid fake product review detection system that combines **text-based NLP features** with **behavioral/metadata analytics**, fused through an ensemble stacking model and made transparent via **SHAP / feature attribution explainability**.

---

## Project Structure

```
Fake_product_review_detector/
├── data/
│   ├── raw/                # Original downloaded or generated datasets (untouched)
│   └── processed/          # Cleaned, normalized, and train/test split data
│       ├── reviews_clean.csv # Full cleaned dataset
│       ├── train.csv         # Stratified training split
│       └── test.csv          # Stratified evaluation split
├── src/
│   ├── __init__.py         # Package initialization
│   ├── preprocess.py       # Data ingestion, text cleaning, schema validation, synthetic fallback
│   ├── text_features.py    # TF-IDF vectorization & linguistic feature extraction
│   ├── behavioral_features.py  # Reviewer & product metadata features (Phase 2)
│   ├── train_baseline.py   # Phase 1: TF-IDF + Logistic Regression baseline benchmark
│   ├── train_behavioral.py # Phase 2: Behavioral gradient boosting classifier
│   ├── train_transformer.py # Phase 3: Fine-tuned DistilBERT transformer classifier
│   ├── train_ensemble.py   # Phase 4: Stacking classifier (text + metadata fusion)
│   └── explain.py          # Phase 5: SHAP / token attribution explainability
├── models/                 # Saved model artifacts, tokenizers, and benchmark metrics (.json)
│   ├── baseline_logreg.joblib
│   ├── tfidf_vectorizer.joblib
│   ├── baseline_metrics.json
│   ├── distilbert_finetuned/  # Saved DistilBERT weights & tokenizer
│   └── transformer_metrics.json
├── notebooks/              # Exploration & evaluation notebooks
├── tests/                  # Unit tests (preprocess, text features, baseline, transformer)
├── requirements.txt
└── README.md
```

---

## Phase 1 Scope: Text Baseline Benchmark

- **Dataset Ingestion**: Reads CSV datasets with standard review schema (`text`, `rating`, `verified_purchase`, `reviewer_id`, `product_id`, `timestamp`, `label`).
- **Synthetic Fallback**: If no raw file is placed in `data/raw/reviews.csv`, `src/preprocess.py` generates a realistic synthetic dataset (~1,200 samples with distinct deceptive vs genuine cues) so the pipeline runs immediately end-to-end.
- **Text Normalization**: Strips HTML/URLs, expands contractions, cleans punctuation, handles missing values, and normalizes whitespace.
- **Feature Extraction**: Sublinear TF-IDF vectorization (unigrams + bigrams) with English stopword filtering.
- **Baseline Model**: Stratified Logistic Regression classifier with balanced class weighting.
- **Benchmark Metrics**: Accuracy, Precision, Recall, F1-Score, and ROC-AUC.

---

## Phase 2 Scope: Behavioral & Metadata Feature Engineering

- **Reviewer Activity Metrics**: Review velocity, burst submission patterns, and verified purchase ratios.
- **Product Metadata Cues**: Rating polarization, product review concentration, and timestamp anomaly indicators.
- **Behavioral Model**: Gradient boosting classifier (XGBoost / HistGradientBoosting) trained purely on non-text features.
- **Benchmark Metrics**: Accuracy, Precision, Recall, F1-Score, and ROC-AUC.

---

## Phase 3 Scope: Deep Contextual Transformer (DistilBERT)

- **Architecture**: HuggingFace `distilbert-base-uncased` fine-tuned for binary sequence classification (`0` = genuine, `1` = fake/deceptive).
- **Data Ingestion**: Ingests normalized review text from `data/processed/reviews_clean.csv` (or `train.csv`) with stratified train/validation splitting.
- **Adaptive Compute Execution**: Automatically detects CUDA GPUs. If running on CPU, gracefully adapts with optimized defaults (`max_length=64`, `batch_size=16`, `epochs=2`) and a clear user notification.
- **Inference Utility**: Exports reusable `predict_proba(texts: list[str]) -> list[float]` function for downstream ensemble stacking and API endpoints.
- **Comparative Benchmarking**: Compares Phase 1 (TF-IDF + Logistic Regression) vs Phase 3 (DistilBERT) side-by-side across Accuracy, Precision, Recall, F1, and ROC-AUC.

---

## Installation & Setup

### 1. Create and activate a virtual environment (optional but recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

## Quickstart & Usage

### 1. Preprocess Data
Clean raw reviews and create `reviews_clean.csv`, `train.csv`, and `test.csv` in `data/processed/`:
```bash
python src/preprocess.py
```

Optional flags:
- `--samples 1500`: Generate a specific number of synthetic samples if raw data is missing.
- `--generate-synthetic`: Force regeneration of synthetic data even if a raw file exists.

### 2. Train & Evaluate Phase 1 Baseline
Train the TF-IDF + Logistic Regression model, compute benchmark metrics, and save artifacts to `models/`:
```bash
python src/train_baseline.py
```

### 3. Train Phase 2 Behavioral Classifier
Train the behavioral gradient boosting model on reviewer and product metadata:
```bash
python src/train_behavioral.py
```

### 4. Fine-Tune Phase 3 DistilBERT Classifier
Fine-tune DistilBERT, evaluate metrics, compare against the Phase 1 benchmark, and save model artifacts to `models/distilbert_finetuned/`:
```bash
python src/train_transformer.py
```

Optional flags:
- `--epochs 3`: Customize fine-tuning epochs.
- `--max-samples 500`: Subsample dataset for rapid verification.
- `--batch-size 32`: Adjust batch size.

### 5. Train Phase 4 Dual-Signal Ensemble
Train the stacking meta-classifier combining text probabilities and behavioral features:
```bash
python src/train_ensemble.py
```

### 6. Run Explainability Diagnostic
Inspect token-level influence on any arbitrary review text:
```bash
python src/explain.py --text "BEST PRODUCT EVER! 5 STARS A+++++ MUST BUY NOW!"
```

### 7. Run Unit Tests
Execute the automated test suite with pytest:
```bash
python -m pytest -v tests/
```

---

## Roadmap

- [x] **Phase 1**: TF-IDF + Logistic Regression baseline classifier & benchmark metrics
- [x] **Phase 2**: Behavioral & metadata feature engineering module (`src/behavioral_features.py`)
- [x] **Phase 3**: Deep contextual text embeddings (Fine-tuned DistilBERT — `src/train_transformer.py`)
- [x] **Phase 4**: Dual-signal stacking ensemble fusing text + metadata (`src/train_ensemble.py`)
- [x] **Phase 5**: SHAP explainability & feature attribution interface (`src/explain.py`)
