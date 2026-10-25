"""
FastAPI Main Application Entry Point for VerityCheck
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load model artifacts once on server startup rather than on every request.
    """
    models_dir = os.environ.get("MODELS_DIR", "models")
    app.state.models_loaded = os.path.exists(models_dir)
    print(f"[VerityCheck API] Starting service... Models directory: '{models_dir}' (Found: {app.state.models_loaded})")
    yield
    print("[VerityCheck API] Shutting down service...")


app = FastAPI(
    title="VerityCheck API",
    description="Dual-Signal Authenticity Scoring for Online Reviews with SHAP Explainability",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for cross-origin frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
