# VerityCheck — Dual-Signal Authenticity Scoring for Online Reviews

A production-grade, hybrid fake product review detection system combining **text NLP & transformer embeddings** with **behavioral metadata analytics**, fused through a **leakage-free ensemble stacking meta-classifier** and made transparent via **SHAP feature attribution**.

---

## Project Architecture & Directory Layout

```
fake-review-detector/
├── api/                       # Phase 6: FastAPI microservice
│   ├── __init__.py
│   ├── main.py                # App entrypoint, lifespan model caching, CORS
│   ├── routes.py              # /analyze, /batch-analyze, /reviewer/{id}, /health
│   └── schemas.py             # Pydantic request/response schemas
├── src/                       # Core ML & Inference Pipeline
│   ├── __init__.py
│   ├── preprocess.py          # Phase 1: Ingestion, normalization, synthetic fallback
│   ├── text_features.py       # Phase 1: Sublinear TF-IDF & linguistic feature extractors
│   ├── behavioral_features.py # Phase 2: Metadata signals & cold-start indicators
│   ├── train_baseline.py      # Phase 1: TF-IDF + Logistic Regression benchmark
│   ├── train_behavioral.py    # Phase 2: Behavioral Gradient Boosting classifier
│   ├── train_transformer.py   # Phase 3: Contextual DistilBERT transformer
│   ├── train_ensemble.py      # Phase 4: Leakage-free 5-fold stacking meta-model
│   └── explain.py             # Phase 5: SHAP attribution & human-readable engine
├── data/
│   ├── raw/                   # Raw source reviews
│   ├── processed/             # Cleaned train/test stratified CSVs
│   └── adversarial/           # Phase 8: Hand-curated adversarial test set
├── models/                    # Serialized model artifacts, vectorizers, and metrics
├── tests/                     # Automated unit and integration test suite
│   ├── test_explain.py        # SHAP & human-readable explanation tests
│   ├── test_api.py            # FastAPI TestClient endpoint tests
│   └── test_adversarial.py    # Phase 8 adversarial robustness test suite
├── docs/                      # Technical reports & audit summaries
│   ├── adversarial_report.md
│   └── final_report_summary.md
├── Dockerfile.api             # Multi-stage Python backend container
├── Dockerfile.frontend        # Multi-stage React/Nginx frontend container
├── docker-compose.yml         # Container orchestration configuration
├── requirements.txt           # Pinned Python dependencies
└── package.json               # Node.js 22 runtime dependencies (Phase 7 frontend)
```

---

## Phases Overview (1 through 9)

### Phase 1: Text NLP Baseline Benchmark
- **Features**: Sublinear TF-IDF vectorization (unigrams + bigrams, 5000 max features) and stylistic feature extraction (capitalization, exclamation bursts, lexical diversity).
- **Model**: Stratified balanced Logistic Regression.
- **Artifacts**: `models/baseline_logreg.joblib`, `models/tfidf_vectorizer.joblib`.

### Phase 2: Behavioral & Metadata Analytics
- **Features**: Reviewer velocity, historic average ratings, rating polar deviations from product averages, verified purchase badges, and cold-start indicators (`is_new_reviewer`, `is_new_product`).
- **Model**: HistGradientBoostingClassifier.
- **Artifacts**: `models/behavioral_model.joblib`, `models/behavioral_metadata.joblib`.

### Phase 3: Contextual Transformer (DistilBERT)
- **Architecture**: HuggingFace `distilbert-base-uncased` fine-tuned for sequence classification.
- **Artifacts**: `models/distilbert_finetuned/`, `models/transformer_metrics.json`.

### Phase 4: Dual-Signal Stacking Ensemble
- **Fix 1 (Leakage-Free Validation)**: Meta-classifier trained via 5-fold Out-Of-Fold (OOF) cross-validation to guarantee zero in-sample leakage.
- **Prompt A (Cold-Start Confidence Weighting)**: Dynamic confidence weighting preventing uninformative behavioral defaults from pulling obvious text spam toward "genuine".
- **Unified Entry Point**: `src.train_ensemble.get_trust_score(review_dict) -> float` (0.0 to 100.0).

### Phase 5: SHAP & Full Ensemble Explainability
- **Explainers**: Linear SHAP for the text baseline, Tree SHAP for the behavioral model, and Meta SHAP for stacking feature contributions.
- **Unified Engine**: `src.explain.explain_review(review_dict) -> dict` returns ranked top 5 factors with impact scores and directional flags (`increases_suspicion` vs `decreases_suspicion`).
- **Human-Readable Generator**: `to_human_readable(explanation) -> str` synthesizes natural English explanations with no raw variables or floats leaking into sentences.

### Phase 6: FastAPI Backend API
Microservice running via Uvicorn with Pydantic validation:
- `POST /analyze`: Single review analysis returning trust score, label, top factors, and human explanation.
- `POST /batch-analyze`: Bulk triage accepting JSON list or CSV file upload.
- `GET /reviewer/{reviewer_id}`: Reviewer aggregate behavioral history and cold-start detection.
- `GET /health`: Liveness probe.

### Phase 7: Interactive Web Frontend
Built with React, Vite, and Tailwind CSS:
- **Consumer View**: Review text input, 0-100 Trust Score gauge, color-coded verdict, plain-English explanation, and factor impact horizontal bar chart.
- **Moderator Dashboard**: Sortable review queue by trust score with status toggles.
- **Reviewer Profile View**: Stat-card grid displaying account verification ratios, review frequency, and anomaly indicators.
- **Adversarial Test Lab & Benchmarks Hub**: Empirical performance and confusion matrix visualizations.

### Phase 8: Adversarial Robustness Testing
Evaluation against 3 distinct threat vectors in `data/adversarial/adversarial_samples.csv`:
1. *Well-written fakes* (astroturfed reviews with technical jargon).
2. *Genuine reviews with unusual patterns* (harsh phrasing paired with 5★).
3. *Paraphrase attacks* (reworded synonym variants of known spam templates).
Detailed failure case studies documented in `docs/adversarial_report.md`.

### Phase 9: Containerization & Cloud Deployment
- Multi-stage Docker containers for API and frontend.
- `docker-compose.yml` for unified local execution.
- GitHub Actions CI workflow in `.github/workflows/ci.yml`.

---

## Quickstart & Usage

### 1. Run via Docker Compose (Recommended)
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

### 2. Run Locally (Python API)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI backend
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run Locally (React Frontend)
```bash
npm install
npm run dev
```

### 4. CLI Explainability Diagnosis
```bash
python src/explain.py --text "AMAZING PRODUCT! BEST PURCHASE OF MY LIFE 5 STARS MUST BUY NOW!"
```

### 5. Run Test Suite
```bash
pytest -v tests/
```

---

## Cloud Deployment Guides

### Deploy to Render
1. Create a **Web Service** pointing to this repository.
2. Select **Docker** environment and set DockerfilePath to `Dockerfile.api`.
3. Add environment variable `PORT=8000`.

### Deploy to Railway
1. Click **New Project** → **Deploy from GitHub repo**.
2. Railway detects `Dockerfile.api` and `Dockerfile.frontend` via Docker Compose or standalone services.
3. Expose port `8000` for API and port `3000` for frontend.
