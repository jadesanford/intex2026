"""Load all .joblib pipelines, run inference, write prediction tables."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from common import binary_positive_proba, build_engine, risk_level_from_probability
from db_feature_builders import (
    build_case_escalation_features,
    build_education_progress_features,
    build_health_alert_features,
    build_home_visitation_features,
    build_intervention_plan_features,
    build_reintegration_features,
    build_safehouse_strain_features,
    load_core_tables,
)
from etl_donor_churn import run as run_etl_donor_churn
from run_inference_donor_churn import run as run_inference_donor_churn

ART = Path(__file__).resolve().parents[1] / "artifacts"


def _align_x(model, df: pd.DataFrame) -> pd.DataFrame:
    if hasattr(model, "feature_names_in_"):
        cols = list(model.feature_names_in_)
    elif hasattr(model, "named_steps") and model.named_steps.get("prep") is not None:
        prep = model.named_steps["prep"]
        cols = list(prep.feature_names_in_) if hasattr(prep, "feature_names_in_") else []
    else:
        raise ValueError("Cannot resolve feature columns from model")
    out = df.copy()
    for c in cols:
        if c not in out.columns:
            out[c] = np.nan
    return out[cols]


def _tier_case_escalation(p: float) -> str:
    if p >= 0.5:
        return "High"
    if p >= 0.25:
        return "Medium"
    return "Low"


def run() -> dict[str, int]:
    engine = build_engine()
    t = load_core_tables(engine)
    counts: dict[str, int] = {}

    # 1) Donor churn (existing)
    counts["donor_churn_etl"] = run_etl_donor_churn()
    counts["donor_churn_pred"] = run_inference_donor_churn()

    # 2) Case escalation
    path = ART / "case_escalation_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_case_escalation_features(t)
        if not df.empty:
            X = _align_x(m, df.drop(columns=["resident_id"], errors="ignore"))
            proba = binary_positive_proba(m, X)
            pred = m.predict(X)
            out = pd.DataFrame(
                {
                    "resident_id": df["resident_id"].astype(int),
                    "incident_probability": proba.astype(float),
                    "incident_prediction": pred.astype(int),
                    "risk_tier": [_tier_case_escalation(float(p)) for p in proba],
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "case_escalation_rf.joblib",
                }
            )
            out.to_sql("ml_case_escalation_predictions", engine, if_exists="replace", index=False)
            counts["case_escalation"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "resident_id",
                    "incident_probability",
                    "incident_prediction",
                    "risk_tier",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_case_escalation_predictions", engine, if_exists="replace", index=False)
            counts["case_escalation"] = 0

    # 3) Reintegration
    path = ART / "reintegration_readiness_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_reintegration_features(t)
        if not df.empty:
            X = _align_x(m, df.drop(columns=["resident_id"], errors="ignore"))
            proba = binary_positive_proba(m, X)
            pred = m.predict(X)
            out = pd.DataFrame(
                {
                    "resident_id": df["resident_id"].astype(int),
                    "success_probability": proba.astype(float),
                    "success_prediction": pred.astype(int),
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "reintegration_readiness_rf.joblib",
                }
            )
            out.to_sql("ml_reintegration_predictions", engine, if_exists="replace", index=False)
            counts["reintegration"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "resident_id",
                    "success_probability",
                    "success_prediction",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_reintegration_predictions", engine, if_exists="replace", index=False)
            counts["reintegration"] = 0

    # 4) Education progress (regression)
    path = ART / "education_progress_forecast_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_education_progress_features(t)
        if not df.empty:
            feat = df.drop(columns=["education_record_id", "resident_id", "record_date"], errors="ignore")
            X = _align_x(m, feat)
            yhat = m.predict(X)
            out = pd.DataFrame(
                {
                    "education_record_id": df["education_record_id"].astype(int),
                    "resident_id": df["resident_id"].astype(int),
                    "record_date": df["record_date"].astype(str),
                    "predicted_progress": yhat.astype(float),
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "education_progress_forecast_rf.joblib",
                }
            )
            out.to_sql("ml_education_progress_predictions", engine, if_exists="replace", index=False)
            counts["education"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "education_record_id",
                    "resident_id",
                    "record_date",
                    "predicted_progress",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_education_progress_predictions", engine, if_exists="replace", index=False)
            counts["education"] = 0

    # 5) Health deterioration
    path = ART / "health_deterioration_alert_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_health_alert_features(t)
        if not df.empty:
            X = _align_x(m, df.drop(columns=["resident_id"], errors="ignore"))
            proba = binary_positive_proba(m, X) if hasattr(m, "predict_proba") else np.asarray(m.predict(X), dtype=float)
            pred = m.predict(X)
            out = pd.DataFrame(
                {
                    "resident_id": df["resident_id"].astype(int),
                    "deterioration_probability": proba.astype(float),
                    "deterioration_prediction": pred.astype(int),
                    "risk_level": [risk_level_from_probability(float(p)) for p in np.asarray(proba).reshape(-1)],
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "health_deterioration_alert_rf.joblib",
                }
            )
            out.to_sql("ml_health_alert_predictions", engine, if_exists="replace", index=False)
            counts["health"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "resident_id",
                    "deterioration_probability",
                    "deterioration_prediction",
                    "risk_level",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_health_alert_predictions", engine, if_exists="replace", index=False)
            counts["health"] = 0

    # 6) Home visitation prioritization
    path = ART / "home_visitation_followup_prioritization_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_home_visitation_features(t)
        if not df.empty:
            X = _align_x(m, df.drop(columns=["visitation_id", "resident_id"], errors="ignore"))
            proba = binary_positive_proba(m, X) if hasattr(m, "predict_proba") else np.asarray(m.predict(X), dtype=float)
            pred = m.predict(X)
            out = pd.DataFrame(
                {
                    "visitation_id": df["visitation_id"].astype(int),
                    "resident_id": df["resident_id"].astype(int),
                    "followup_priority_probability": np.asarray(proba).reshape(-1).astype(float),
                    "followup_priority_prediction": pred.astype(int),
                    "priority_tier": [risk_level_from_probability(float(p)) for p in np.asarray(proba).reshape(-1)],
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "home_visitation_followup_prioritization_rf.joblib",
                }
            )
            out.to_sql("ml_home_visitation_predictions", engine, if_exists="replace", index=False)
            counts["home_visitation"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "visitation_id",
                    "resident_id",
                    "followup_priority_probability",
                    "followup_priority_prediction",
                    "priority_tier",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_home_visitation_predictions", engine, if_exists="replace", index=False)
            counts["home_visitation"] = 0

    # 7) Intervention plan completion risk
    path = ART / "intervention_plan_completion_risk_rf.joblib"
    if path.exists():
        m = joblib.load(path)
        df = build_intervention_plan_features(t)
        if not df.empty:
            X = _align_x(m, df.drop(columns=["plan_id", "resident_id"], errors="ignore"))
            proba = binary_positive_proba(m, X) if hasattr(m, "predict_proba") else np.asarray(m.predict(X), dtype=float)
            pred = m.predict(X)
            out = pd.DataFrame(
                {
                    "plan_id": df["plan_id"].astype(int),
                    "resident_id": df["resident_id"].astype(int),
                    "completion_risk_probability": np.asarray(proba).reshape(-1).astype(float),
                    "completion_risk_prediction": pred.astype(int),
                    "risk_tier": [risk_level_from_probability(float(p)) for p in np.asarray(proba).reshape(-1)],
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "intervention_plan_completion_risk_rf.joblib",
                }
            )
            out.to_sql("ml_intervention_plan_predictions", engine, if_exists="replace", index=False)
            counts["intervention"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "plan_id",
                    "resident_id",
                    "completion_risk_probability",
                    "completion_risk_prediction",
                    "risk_tier",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_intervention_plan_predictions", engine, if_exists="replace", index=False)
            counts["intervention"] = 0

    # 8) Safehouse strain (regressor + classifier)
    reg_p = ART / "safehouse_capacity_strain_regressor.joblib"
    clf_p = ART / "safehouse_capacity_strain_classifier.joblib"
    if reg_p.exists() and clf_p.exists():
        reg = joblib.load(reg_p)
        clf = joblib.load(clf_p)
        df = build_safehouse_strain_features(t)
        if not df.empty:
            Xr = _align_x(reg, df.drop(columns=["safehouse_id"], errors="ignore"))
            Xc = _align_x(clf, df.drop(columns=["safehouse_id"], errors="ignore"))
            yhat = reg.predict(Xr)
            proba = (
                binary_positive_proba(clf, Xc)
                if hasattr(clf, "predict_proba")
                else np.asarray(clf.predict(Xc), dtype=float)
            )
            out = pd.DataFrame(
                {
                    "safehouse_id": df["safehouse_id"].astype(int),
                    "strain_forecast_value": yhat.astype(float),
                    "strain_probability": np.asarray(proba).reshape(-1).astype(float),
                    "strain_prediction": clf.predict(Xc).astype(int),
                    "scored_at": pd.Timestamp.utcnow().tz_localize(None),
                    "model_version": "safehouse_capacity_strain_hybrid.joblib",
                }
            )
            out.to_sql("ml_safehouse_strain_predictions", engine, if_exists="replace", index=False)
            counts["safehouse_strain"] = len(out)
        else:
            pd.DataFrame(
                columns=[
                    "safehouse_id",
                    "strain_forecast_value",
                    "strain_probability",
                    "strain_prediction",
                    "scored_at",
                    "model_version",
                ]
            ).to_sql("ml_safehouse_strain_predictions", engine, if_exists="replace", index=False)
            counts["safehouse_strain"] = 0

    return counts


if __name__ == "__main__":
    c = run()
    print(c)
