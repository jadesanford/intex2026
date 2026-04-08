"""
Lighthouse ML prediction API + dashboard bundle for embedding in your app.

Run (from `ml-pipelines/ml-pipelines`):
  pip install -r prediction_service/requirements.txt
  uvicorn prediction_service.main:app --reload --host 127.0.0.1 --port 8000

Dashboard UI: http://127.0.0.1:8000/dashboard
OpenAPI: http://127.0.0.1:8000/docs

Train notebooks first so `artifacts/reintegration_readiness_rf.joblib` and
`artifacts/case_escalation_rf.joblib` exist.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field

from prediction_service.features import CASE_ESCALATION_FEATURES, REINTEGRATION_FEATURES
from prediction_service import insights

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS = BASE_DIR / "artifacts"
REINTEGRATION_ARTIFACT = ARTIFACTS / "reintegration_readiness_rf.joblib"
CASE_ESCALATION_ARTIFACT = ARTIFACTS / "case_escalation_rf.joblib"
DASHBOARD_HTML = Path(__file__).resolve().parent / "static" / "dashboard.html"


def _load(path: Path):
    if not path.is_file():
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


app = FastAPI(
    title="Lighthouse ML Prediction API",
    version="1.1.0",
    description="Predictions, tiers, narrative insights, and global RF drivers for dashboards.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reintegration_model = _load(REINTEGRATION_ARTIFACT)
case_escalation_model = _load(CASE_ESCALATION_ARTIFACT)


class FeaturePayload(BaseModel):
    """Feature map; unknown keys are ignored. Missing keys → NaN (training imputers)."""

    features: dict[str, Any] = Field(
        ...,
        description="Column name -> value, matching training CSV dtypes.",
    )


def _row_from_payload(raw: dict[str, Any], columns: list[str]) -> pd.DataFrame:
    cleaned = {c: raw.get(c, np.nan) for c in columns}
    return pd.DataFrame([cleaned])


@app.get("/")
def root():
    return RedirectResponse("/dashboard", status_code=307)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "artifacts_dir": str(ARTIFACTS),
        "reintegration_loaded": reintegration_model is not None,
        "case_escalation_loaded": case_escalation_model is not None,
    }


@app.get("/schema/reintegration-readiness")
def schema_reintegration():
    return {
        "features": REINTEGRATION_FEATURES,
        "target_interpretation": "probability of successful reintegration (class 1)",
    }


@app.get("/schema/case-escalation-risk")
def schema_case_escalation():
    return {
        "features": CASE_ESCALATION_FEATURES,
        "target_interpretation": "probability of incident in next 30d (class 1)",
    }


@app.get("/insights/global/reintegration-readiness")
def global_insights_reintegration(top_n: int = 12):
    return insights.global_model_drivers(reintegration_model, top_n=top_n)


@app.get("/insights/global/case-escalation-risk")
def global_insights_escalation(top_n: int = 12):
    return insights.global_model_drivers(case_escalation_model, top_n=top_n)


@app.post("/predict/reintegration-readiness")
def predict_reintegration(body: FeaturePayload, threshold: float = 0.2):
    if reintegration_model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model not available. Train notebook and save to {REINTEGRATION_ARTIFACT}",
        )
    raw = {k: v for k, v in body.features.items() if k in REINTEGRATION_FEATURES}
    X = _row_from_payload(raw, REINTEGRATION_FEATURES)
    try:
        proba = float(reintegration_model.predict_proba(X)[0, 1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e!s}") from e
    tier = "high_attention" if proba < threshold else ("medium" if proba < 0.5 else "lower_priority")
    return {
        "probability_success": proba,
        "threshold": threshold,
        "tier": tier,
        "note": "high_attention when predicted success is below threshold.",
    }


@app.post("/predict/case-escalation-risk")
def predict_case_escalation(body: FeaturePayload, threshold: float = 0.5):
    if case_escalation_model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model not available. Train notebook and save to {CASE_ESCALATION_ARTIFACT}",
        )
    raw = {k: v for k, v in body.features.items() if k in CASE_ESCALATION_FEATURES}
    X = _row_from_payload(raw, CASE_ESCALATION_FEATURES)
    try:
        proba = float(case_escalation_model.predict_proba(X)[0, 1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e!s}") from e
    tier = "high_risk" if proba >= threshold else ("watch" if proba >= threshold * 0.7 else "standard")
    return {
        "probability_incident_30d": proba,
        "threshold": threshold,
        "tier": tier,
    }


def _dashboard_reintegration(body: FeaturePayload, threshold: float) -> dict[str, Any]:
    if reintegration_model is None:
        raise HTTPException(status_code=503, detail="Reintegration model not loaded")
    raw = {k: v for k, v in body.features.items() if k in REINTEGRATION_FEATURES}
    X = _row_from_payload(raw, REINTEGRATION_FEATURES)
    proba = float(reintegration_model.predict_proba(X)[0, 1])
    tier = "high_attention" if proba < threshold else ("medium" if proba < 0.5 else "lower_priority")
    g = insights.global_model_drivers(reintegration_model, top_n=12)
    fam = insights.family_rollup(g.get("drivers") or [])
    narrative = insights.reintegration_insights(proba, threshold, tier)
    return {
        "model": "reintegration-readiness",
        "prediction": {
            "probability_success": proba,
            "threshold": threshold,
            "tier": tier,
        },
        "narrative": narrative,
        "global_drivers": g,
        "family_importance": fam,
    }


def _dashboard_escalation(body: FeaturePayload, threshold: float) -> dict[str, Any]:
    if case_escalation_model is None:
        raise HTTPException(status_code=503, detail="Case escalation model not loaded")
    raw = {k: v for k, v in body.features.items() if k in CASE_ESCALATION_FEATURES}
    X = _row_from_payload(raw, CASE_ESCALATION_FEATURES)
    proba = float(case_escalation_model.predict_proba(X)[0, 1])
    tier = "high_risk" if proba >= threshold else ("watch" if proba >= threshold * 0.7 else "standard")
    g = insights.global_model_drivers(case_escalation_model, top_n=12)
    fam = insights.family_rollup(g.get("drivers") or [])
    narrative = insights.case_escalation_insights(proba, threshold, tier)
    return {
        "model": "case-escalation-risk",
        "prediction": {
            "probability_incident_30d": proba,
            "threshold": threshold,
            "tier": tier,
        },
        "narrative": narrative,
        "global_drivers": g,
        "family_importance": fam,
    }


@app.post("/dashboard/reintegration-readiness")
def dashboard_reintegration(body: FeaturePayload, threshold: float = 0.2):
    """
    Full JSON for your app dashboard: score, tier, action bullets, global RF drivers, family roll-up.
    """
    return _dashboard_reintegration(body, threshold)


@app.post("/dashboard/case-escalation-risk")
def dashboard_case_escalation(body: FeaturePayload, threshold: float = 0.5):
    """Same as reintegration dashboard bundle for escalation model."""
    return _dashboard_escalation(body, threshold)


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page():
    if not DASHBOARD_HTML.is_file():
        return HTMLResponse(
            "<p>Dashboard file missing. Use <a href='/docs'>/docs</a>.</p>",
            status_code=404,
        )
    return HTMLResponse(DASHBOARD_HTML.read_text(encoding="utf-8"))


@app.get("/ui", response_class=HTMLResponse)
def ui_redirect():
    return RedirectResponse("/dashboard", status_code=307)
