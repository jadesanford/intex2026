# ML Pipeline Jobs (Precomputed Integration)

`run_all.py` runs **all** trained `.joblib` pipelines in `ml-pipelines/artifacts/`, writes prediction tables to Postgres, and the .NET API reads those tables for `/api/analytics/ml-pipelines`.

## Setup

From `ml-pipelines`:

```bash
pip install -r requirements.txt
```

Connection string: set `DATABASE_URL` **or** add `ConnectionStrings:DefaultConnection` (or `Database:Url`) in `backend/appsettings.Development.json` — see `common.py` for resolution order.

## Run

```bash
cd jobs
python3 run_all.py
```

This executes `inference_all_pipelines.py`, which:

1. Builds feature frames from live tables (`db_feature_builders.py`)
2. Loads each `*.joblib` and runs `predict` / `predict_proba`
3. Writes the rows below

## Output tables

| Table | Model artifact |
| --- | --- |
| `ml_donor_churn_features` | (staging) |
| `donor_churn_predictions` | `donor_churn_prediction_rf.joblib` |
| `ml_case_escalation_predictions` | `case_escalation_rf.joblib` |
| `ml_reintegration_predictions` | `reintegration_readiness_rf.joblib` |
| `ml_education_progress_predictions` | `education_progress_forecast_rf.joblib` |
| `ml_health_alert_predictions` | `health_deterioration_alert_rf.joblib` |
| `ml_home_visitation_predictions` | `home_visitation_followup_prioritization_rf.joblib` |
| `ml_intervention_plan_predictions` | `intervention_plan_completion_risk_rf.joblib` |
| `ml_safehouse_strain_predictions` | `safehouse_capacity_strain_regressor.joblib` + `safehouse_capacity_strain_classifier.joblib` |

**Note:** Donation forecast in the analytics UI is still computed in the API from donations (no separate forecast `.joblib` in this repo). All other ML cards use the tables above when they contain rows.

## Run one pipeline only

```bash
python3 etl_donor_churn.py
python3 run_inference_donor_churn.py
```

Or import and call functions from `inference_all_pipelines.py` in a REPL.
