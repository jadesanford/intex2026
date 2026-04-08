"""Derive dashboard-friendly insight text and global driver lists from fitted sklearn pipelines."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def _top_rf_importances(pipeline: Any, top_n: int = 10) -> list[dict[str, Any]]:
    prep = pipeline.named_steps["prep"]
    clf = pipeline.named_steps["clf"]
    names = prep.get_feature_names_out()
    imp = clf.feature_importances_
    df = (
        pd.DataFrame({"feature": names, "importance": imp})
        .sort_values("importance", ascending=False)
        .head(top_n)
    )
    return df.to_dict("records")


def global_model_drivers(pipeline: Any, top_n: int = 10) -> dict[str, Any]:
    """RandomForest global feature importances (post-OHE names)."""
    if pipeline is None:
        return {"available": False, "drivers": [], "error": "model not loaded"}
    try:
        rows = _top_rf_importances(pipeline, top_n=top_n)
        return {"available": True, "drivers": rows, "source": "random_forest.feature_importances_"}
    except Exception as e:
        return {"available": False, "drivers": [], "error": str(e)}


def reintegration_insights(probability_success: float, threshold: float, tier: str) -> dict[str, Any]:
    bullets = []
    if tier == "high_attention":
        bullets = [
            "Schedule a case conference within 7 days and document a concrete support plan.",
            "Increase counseling or home visitation frequency until health and education metrics stabilize.",
            "Re-score after interventions; track attendance and health scores week over week.",
        ]
    elif tier == "medium":
        bullets = [
            "Assign a 30-day education and wellbeing check-in bundle.",
            "Monitor visit notes for escalating concerns flagged in process recordings.",
        ]
    else:
        bullets = [
            "Continue standard monitoring; keep monthly touchpoints unless circumstances change.",
        ]
    return {
        "headline": f"Predicted reintegration success probability: {probability_success:.1%}",
        "tier_label": tier.replace("_", " ").title(),
        "threshold_rule": f"High-attention tier when predicted success is below {threshold:.0%}.",
        "action_bullets": bullets,
    }


def case_escalation_insights(probability_incident: float, threshold: float, tier: str) -> dict[str, Any]:
    bullets = []
    if tier == "high_risk":
        bullets = [
            "Same-week supervisor review and an updated safety plan.",
            "Add touchpoints (visit or session) within 48 hours where staffing allows.",
            "Confirm follow-up tasks from the last home visit are closed out.",
        ]
    elif tier == "watch":
        bullets = [
            "Elevated risk: increase visit cadence and review unresolved incident patterns.",
        ]
    else:
        bullets = [
            "Standard monitoring; keep routine incident review cadence.",
        ]
    return {
        "headline": f"Predicted incident risk (next 30 days): {probability_incident:.1%}",
        "tier_label": tier.replace("_", " ").title(),
        "threshold_rule": f"High-risk tier when probability is at or above {threshold:.0%}.",
        "action_bullets": bullets,
    }


def family_rollup(drivers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate OHE feature names into coarse families for a second chart."""
    fam: dict[str, float] = {}
    for row in drivers:
        name = str(row.get("feature", ""))
        raw = name.split("__", 1)[-1] if "__" in name else name
        prefix = raw.split("_", 1)[0] if "_" in raw else raw
        fam[prefix] = fam.get(prefix, 0.0) + float(row.get("importance", 0.0))
    out = [{"family": k, "importance": v} for k, v in fam.items()]
    out.sort(key=lambda x: x["importance"], reverse=True)
    return out[:8]
