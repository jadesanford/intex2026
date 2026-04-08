"""
Standard dashboard export for Lighthouse ML pipelines.

Produces a JSON-serializable document your API / future React app can render:
  - meta (pipeline id, display name, schema version)
  - metrics (holdout + optional CV)
  - charts[]  — each item is a small spec (type, title, labels, values) for Chart.js / Recharts
  - insights[] — short strings explaining what to do with the results
  - rows_sample — optional preview of scored rows for tables

Writes: artifacts/dashboard_exports/<pipeline_id>.json
Run from notebook working directory ml-pipelines/ml-pipelines (same as artifacts/).
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, mean_absolute_error, r2_score, roc_auc_score

SCHEMA_VERSION = "1.0"
EXPORT_DIR = Path("artifacts") / "dashboard_exports"


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:80]


def chart_bar_horizontal(
    chart_id: str,
    title: str,
    labels: list[str],
    values: list[float],
    value_label: str = "",
) -> dict[str, Any]:
    return {
        "id": chart_id,
        "type": "bar_horizontal",
        "title": title,
        "labels": labels,
        "values": values,
        "value_label": value_label or "value",
    }


def chart_histogram(
    chart_id: str,
    title: str,
    values: np.ndarray | list[float],
    bins: int = 20,
) -> dict[str, Any]:
    arr = np.asarray(values, dtype=float)
    arr = arr[~np.isnan(arr)]
    if arr.size == 0:
        return {"id": chart_id, "type": "histogram", "title": title, "bins": [], "counts": []}
    counts, edges = np.histogram(arr, bins=bins)
    return {
        "id": chart_id,
        "type": "histogram",
        "title": title,
        "bin_edges": edges.tolist(),
        "counts": counts.astype(int).tolist(),
    }


def chart_lines(
    chart_id: str,
    title: str,
    series: list[dict[str, Any]],
    x_key: str = "x",
) -> dict[str, Any]:
    """series: [{name, points: [{x, y}, ...]}, ...]"""
    return {"id": chart_id, "type": "line_multi", "title": title, "x_key": x_key, "series": series}


def _insights_generic_classification(
    imp_head: pd.DataFrame,
    coef_head: pd.DataFrame | None,
    *,
    positive_class_description: str,
) -> list[str]:
    out: list[str] = []
    if len(imp_head) > 0:
        top = imp_head.iloc[0]
        out.append(
            f"The random forest puts the most weight on **{top['feature']}** when ranking {positive_class_description}."
        )
    if coef_head is not None and len(coef_head) > 0:
        t = coef_head.iloc[0]
        direction = "increases" if float(t["coef"]) > 0 else "decreases"
        out.append(
            f"The logistic model associates higher **{t['feature']}** with {direction} odds of the positive class (linear association, not necessarily causal)."
        )
    if not out:
        out.append("Review global feature importances and coefficients with domain staff before operational cutoffs.")
    return out


def export_generic_classifier_dashboard(
    *,
    pipeline_id: str,
    display_name: str,
    problem_summary: str,
    pred_m,
    exp_m,
    X_te: pd.DataFrame,
    y_te: pd.Series,
    proba: np.ndarray,
    coef_df: pd.DataFrame | None = None,
    imp_df: pd.DataFrame | None = None,
    positive_class_description: str = "the outcome of interest",
    extra_insights: list[str] | None = None,
    cv_summary: dict[str, float] | None = None,
) -> dict[str, Any]:
    fn = exp_m.named_steps["prep"].get_feature_names_out()
    if coef_df is None:
        coef_df = pd.DataFrame({"feature": fn, "coef": exp_m.named_steps["clf"].coef_[0]})
    if "abs_coef" not in coef_df.columns:
        coef_df = coef_df.copy()
        coef_df["abs_coef"] = coef_df["coef"].abs()
    if imp_df is None:
        imp_df = pd.DataFrame(
            {"feature": fn, "importance": pred_m.named_steps["clf"].feature_importances_}
        )
    coef_head = coef_df.sort_values("abs_coef", ascending=False).head(10)
    imp_head = imp_df.sort_values("importance", ascending=False).head(10)

    roc = roc_auc_score(y_te, proba) if y_te.nunique() > 1 else float("nan")
    pr = average_precision_score(y_te, proba) if y_te.nunique() > 1 else float("nan")
    metrics = {"holdout_roc_auc": roc, "holdout_pr_auc": pr}
    if cv_summary:
        metrics.update(cv_summary)

    charts: list[dict[str, Any]] = [
        chart_bar_horizontal(
            _slug(pipeline_id) + "-imp",
            "Top predictive drivers (Random Forest importance)",
            imp_head["feature"].astype(str).tolist(),
            imp_head["importance"].astype(float).tolist(),
            "importance",
        ),
        chart_bar_horizontal(
            _slug(pipeline_id) + "-coef",
            "Top explanatory associations (logistic |coefficient|)",
            coef_head["feature"].astype(str).tolist(),
            coef_head["abs_coef"].tolist() if "abs_coef" in coef_head.columns else np.abs(coef_head["coef"]).tolist(),
            "|coef|",
        ),
        chart_histogram(_slug(pipeline_id) + "-proba", "Distribution of predicted scores (holdout)", proba, bins=20),
    ]

    insights = _insights_generic_classification(
        imp_head, coef_head.head(5), positive_class_description=positive_class_description
    )
    insights.insert(0, problem_summary)
    if extra_insights:
        insights.extend(extra_insights)

    sample = pd.DataFrame({"y_true": y_te.values, "score": proba}).head(15)
    rows_sample = sample.to_dict(orient="records")

    return {
        "meta": {
            "schema_version": SCHEMA_VERSION,
            "pipeline_id": pipeline_id,
            "display_name": display_name,
            "task": "binary_classification",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        },
        "metrics": metrics,
        "charts": charts,
        "insights": insights,
        "rows_sample": rows_sample,
    }


def export_regression_dashboard(
    *,
    pipeline_id: str,
    display_name: str,
    problem_summary: str,
    pred_m,
    X_te: pd.DataFrame,
    y_te: pd.Series,
    y_pred: np.ndarray,
    extra_insights: list[str] | None = None,
) -> dict[str, Any]:
    mae = mean_absolute_error(y_te, y_pred)
    r2 = r2_score(y_te, y_pred)
    charts: list[dict[str, Any]] = [
        chart_histogram(_slug(pipeline_id) + "-yhat", "Distribution of predictions (holdout)", y_pred, bins=20),
        chart_histogram(_slug(pipeline_id) + "-resid", "Residuals (y - y_hat)", (y_te.values - y_pred), bins=20),
    ]
    insights = [
        problem_summary,
        f"Holdout MAE is **{mae:.3f}** and R² is **{r2:.3f}**. Use with caution for planning; validate on fresh months.",
    ]
    if extra_insights:
        insights.extend(extra_insights)
    return {
        "meta": {
            "schema_version": SCHEMA_VERSION,
            "pipeline_id": pipeline_id,
            "display_name": display_name,
            "task": "regression",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        },
        "metrics": {"holdout_mae": mae, "holdout_r2": r2},
        "charts": charts,
        "insights": insights,
        "rows_sample": pd.DataFrame({"y_true": y_te.values, "y_pred": y_pred}).head(15).to_dict(orient="records"),
    }


def export_safehouse_hybrid_dashboard(
    *,
    pred_m,
    clf,
    X_te_reg: pd.DataFrame,
    y_te_reg: pd.Series,
    y_pred_reg: np.ndarray,
    X_te_strain: pd.DataFrame,
    y_te_strain: pd.Series,
    proba_strain: np.ndarray,
) -> dict[str, Any]:
    reg = export_regression_dashboard(
        pipeline_id="safehouse-capacity-strain-forecast",
        display_name="Safehouse capacity & strain",
        problem_summary="Forecasts next-period incident load (regression) and classifies high strain (RF).",
        pred_m=pred_m,
        X_te=X_te_reg,
        y_te=y_te_reg,
        y_pred=y_pred_reg,
        extra_insights=["Strain classifier complements the regression by flagging binary high-load months for operations alerts."],
    )
    fn = clf.named_steps["prep"].get_feature_names_out()
    imp = pd.DataFrame({"feature": fn, "importance": clf.named_steps["clf"].feature_importances_}).sort_values(
        "importance", ascending=False
    )
    reg.setdefault("charts", []).append(
        chart_bar_horizontal(
            "safehouse-strain-imp",
            "Strain classifier — top importances",
            imp.head(10)["feature"].astype(str).tolist(),
            imp.head(10)["importance"].astype(float).tolist(),
        )
    )
    roc = roc_auc_score(y_te_strain, proba_strain) if y_te_strain.nunique() > 1 else float("nan")
    reg["metrics"]["strain_holdout_roc_auc"] = roc
    reg["insights"].append(
        f"Strain (high-load) classifier holdout ROC-AUC ≈ **{roc:.3f}** when two classes exist."
    )
    reg["meta"]["task"] = "regression_plus_binary"
    return reg


def export_reintegration_readiness_dashboard(
    *,
    predictive,
    explainer,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    proba: np.ndarray,
    threshold_table: pd.DataFrame,
    best_threshold: float,
    corr: pd.DataFrame,
    family_imp: pd.DataFrame,
    family_coef: pd.DataFrame,
) -> dict[str, Any]:
    fn = explainer.named_steps["prep"].get_feature_names_out()
    coef_df = pd.DataFrame({"feature": fn, "coef": explainer.named_steps["clf"].coef_[0]})
    coef_df["abs_coef"] = coef_df["coef"].abs()
    imp_df = pd.DataFrame({"feature": fn, "importance": predictive.named_steps["clf"].feature_importances_})

    base = export_generic_classifier_dashboard(
        pipeline_id="reintegration-readiness",
        display_name="Reintegration readiness",
        problem_summary="Predicts probability of successful reintegration so teams can tier support.",
        pred_m=predictive,
        exp_m=explainer,
        X_te=X_test,
        y_te=y_test,
        proba=proba,
        coef_df=coef_df,
        imp_df=imp_df,
        positive_class_description="successful reintegration",
        extra_insights=[
            f"Policy-oriented threshold near **{best_threshold:.2f}** balances recall and precision on the holdout set (see threshold chart).",
        ],
    )

    tt = threshold_table.copy()
    series = [
        {
            "name": "precision",
            "points": [{"x": float(r["threshold"]), "y": float(r["precision"])} for _, r in tt.iterrows()],
        },
        {
            "name": "recall",
            "points": [{"x": float(r["threshold"]), "y": float(r["recall"])} for _, r in tt.iterrows()],
        },
    ]
    if "mission_score" in tt.columns:
        series.append(
            {
                "name": "mission_score",
                "points": [{"x": float(r["threshold"]), "y": float(r["mission_score"])} for _, r in tt.iterrows()],
            }
        )
    base["charts"].append(chart_lines("reint-thresholds", "Precision / recall vs threshold", series, x_key="x"))

    vc = corr.dropna(subset=["corr"]).head(8)
    base["charts"].append(
        chart_bar_horizontal(
            "reint-corr",
            "Numeric correlations with success (descriptive)",
            vc["feature"].astype(str).tolist(),
            vc["corr"].astype(float).tolist(),
            "correlation",
        )
    )
    base["charts"].append(
        chart_bar_horizontal(
            "reint-family-imp",
            "Importance by coarse feature family (RF)",
            family_imp.head(8)["family"].astype(str).tolist(),
            family_imp.head(8)["importance"].astype(float).tolist(),
        )
    )
    base["insights"].extend(
        [
            f"Top predictive families include **{family_imp.iloc[0]['family']}** by summed importance.",
            f"Explanatory coefficients are largest in **{family_coef.iloc[0]['family']}** on average (scaled OHE).",
        ]
    )
    return base


def export_case_escalation_dashboard(
    *,
    predictive,
    explainer,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    proba: np.ndarray,
    threshold_table: pd.DataFrame,
    best_threshold: float,
    corr: pd.DataFrame,
    family_imp: pd.DataFrame,
    family_coef: pd.DataFrame,
) -> dict[str, Any]:
    fn = explainer.named_steps["prep"].get_feature_names_out()
    coef_df = pd.DataFrame({"feature": fn, "coef": explainer.named_steps["clf"].coef_[0]})
    coef_df["abs_coef"] = coef_df["coef"].abs()
    imp_df = pd.DataFrame({"feature": fn, "importance": predictive.named_steps["clf"].feature_importances_})

    base = export_generic_classifier_dashboard(
        pipeline_id="case-escalation-risk",
        display_name="Case escalation risk",
        problem_summary="Estimates probability of an incident in the next 30 days after the snapshot for triage.",
        pred_m=predictive,
        exp_m=explainer,
        X_te=X_test,
        y_te=y_test,
        proba=proba,
        coef_df=coef_df,
        imp_df=imp_df,
        positive_class_description="an incident in the forward window",
        extra_insights=[
            f"Operational alert threshold near **{best_threshold:.2f}** is a starting point; adjust for staffing.",
        ],
    )
    tt = threshold_table.copy()
    series = [
        {"name": "precision", "points": [{"x": float(r["threshold"]), "y": float(r["precision"])} for _, r in tt.iterrows()]},
        {"name": "recall", "points": [{"x": float(r["threshold"]), "y": float(r["recall"])} for _, r in tt.iterrows()]},
    ]
    if "mission_score" in tt.columns:
        series.append(
            {"name": "mission_score", "points": [{"x": float(r["threshold"]), "y": float(r["mission_score"])} for _, r in tt.iterrows()]}
        )
    base["charts"].append(chart_lines("esc-thresholds", "Precision / recall vs threshold", series, x_key="x"))

    vc = corr.dropna(subset=["corr"]).head(8)
    base["charts"].append(
        chart_bar_horizontal(
            "esc-corr",
            "Numeric correlations with escalation label",
            vc["feature"].astype(str).tolist(),
            vc["corr"].astype(float).tolist(),
            "correlation",
        )
    )
    base["charts"].append(
        chart_bar_horizontal(
            "esc-family-imp",
            "Importance by coarse feature family (RF)",
            family_imp.head(8)["family"].astype(str).tolist(),
            family_imp.head(8)["importance"].astype(float).tolist(),
        )
    )
    base["insights"].extend(
        [
            f"Incident-risk drivers cluster in **{family_imp.iloc[0]['family']}** (RF) — align extra visits or supervision accordingly.",
        ]
    )
    return base


def save_dashboard_json(payload: dict[str, Any], directory: Path | None = None) -> Path:
    directory = directory or EXPORT_DIR
    directory.mkdir(parents=True, exist_ok=True)
    pid = payload["meta"]["pipeline_id"]
    path = directory / f"{_slug(pid)}.json"

    def _json_default(o: Any):
        if isinstance(o, (np.floating, np.integer)):
            return float(o) if isinstance(o, np.floating) else int(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        raise TypeError(type(o))

    cleaned = nan_to_none(json.loads(json.dumps(payload, default=_json_default)))
    cleaned["export_path"] = str(path.resolve())
    path.write_text(json.dumps(cleaned, indent=2), encoding="utf-8")
    payload["export_path"] = cleaned["export_path"]
    return path


def nan_to_none(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: nan_to_none(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [nan_to_none(v) for v in obj]
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj
