from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from common import binary_positive_proba, build_engine, risk_level_from_probability

MODEL_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "donor_churn_prediction_rf.joblib"

def _resolve_feature_columns(model) -> list[str]:
    # Prefer model-declared input schema when available.
    if hasattr(model, "feature_names_in_"):
        return list(model.feature_names_in_)
    if hasattr(model, "named_steps"):
        prep = model.named_steps.get("prep")
        if prep is not None and hasattr(prep, "feature_names_in_"):
            return list(prep.feature_names_in_)
    # Fallback for older artifacts.
    return [
        "donation_count",
        "total_amount",
        "avg_amount",
        "days_since_last_donation",
        "has_monetary_donation",
        "is_monetary_supporter",
        "is_active_supporter",
        "supporter_type",
        "status",
        "region",
        "country",
        "relationship_type",
        "acquisition_channel",
    ]


def run() -> int:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model artifact: {MODEL_PATH}")

    engine = build_engine()
    model = joblib.load(MODEL_PATH)
    df = pd.read_sql("SELECT * FROM ml_donor_churn_features", engine)
    feature_columns = _resolve_feature_columns(model)
    if df.empty:
        pd.DataFrame(
            columns=[
                "supporter_id",
                "churn_probability",
                "churn_prediction",
                "risk_level",
                "scored_at",
                "model_version",
            ]
        ).to_sql("donor_churn_predictions", engine, if_exists="replace", index=False)
        return 0

    # Create missing columns using safe defaults to keep inference robust.
    for col in feature_columns:
        if col not in df.columns:
            df[col] = ""

    X = df[feature_columns].copy()
    proba = (
        binary_positive_proba(model, X)
        if hasattr(model, "predict_proba")
        else np.asarray(model.predict(X), dtype=float)
    )
    preds = model.predict(X)

    out = pd.DataFrame(
        {
            "supporter_id": df["supporter_id"].astype(int),
            "churn_probability": proba.astype(float),
            "churn_prediction": preds.astype(int),
            "risk_level": [risk_level_from_probability(float(p)) for p in proba],
            "scored_at": pd.Timestamp.utcnow().tz_localize(None),
            "model_version": "donor_churn_prediction_rf.joblib",
        }
    )
    out.to_sql("donor_churn_predictions", engine, if_exists="replace", index=False)
    return len(out)


if __name__ == "__main__":
    rows = run()
    print(f"Wrote {rows} rows to donor_churn_predictions")
