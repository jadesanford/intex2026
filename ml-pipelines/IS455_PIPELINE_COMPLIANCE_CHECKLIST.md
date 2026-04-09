# IS 455 ML Pipeline Compliance Checklist (LLM/TA Audit)

Use this checklist to evaluate each notebook in `ml-pipelines/` with strict pass/fail criteria.

## Required Notebook Sections (must exist with these exact headings)

1. `## 1. Problem Framing`
2. `## 2. Data Acquisition, Preparation & Exploration`
3. `## 3. Modeling & Feature Selection`
4. `## 4. Evaluation & Interpretation`
5. `## 5. Causal and Relationship Analysis`
6. `## 6. Deployment Notes`

If any heading is missing, mark notebook **FAIL**.

## Pass/Fail Rules by Stage

### 1) Problem Framing
- Must state a business question and who cares (stakeholders).
- Must explicitly distinguish predictive vs explanatory goals.
- Must identify decision impact (what action changes based on model output).

### 2) Data Acquisition, Preparation & Exploration
- Must identify source tables used.
- Must show reproducible preparation (coded pipeline/transform steps, not manual-only edits).
- Must show exploration evidence (at least one of: distribution, missingness, anomaly, relationship analysis).
- If tables are joined, join logic must be visible or described.

### 3) Modeling & Feature Selection
- Must include at least one predictive model.
- Must include one explanatory model for relationship interpretation.
- Must justify feature selection using model evidence and/or domain reasoning.
- Multiple models should be compared where relevant.

### 4) Evaluation & Interpretation
- Must use proper validation (train/test split or cross-validation).
- Must report task-appropriate metrics.
- Must interpret metrics in business terms.
- Must discuss consequences of false positives and false negatives (or equivalent regression error costs).

### 5) Causal and Relationship Analysis
- Must identify impactful features.
- Must explain whether relationships are causal claims or correlational findings.
- Must explicitly include correlation-is-not-causation limitation where causal identification is not established.
- Must include decision recommendations tied to findings.

### 6) Deployment Notes
- Must state how outputs are used in production (API, dashboard, interactive tool, or batch flow).
- Must include concrete artifact/reference paths (for example under `artifacts/` or `artifacts/dashboard_exports/`).
- Must describe how integrated outputs provide end-user value.

## Cross-Notebook Rules

- Each notebook must address a genuinely different business problem.
- Notebook must be executable top-to-bottom with repo-relative data paths.
- Both quality and quantity matter; incomplete pipelines should not be counted as complete.
- A notebook-only model with no deployment path is **not** a complete pipeline.

## Scoring Template (20 points total rubric alignment)

For each notebook, score each stage as:
- `0` = missing/insufficient
- `1` = present but weak
- `2` = strong

Stages: Problem Framing, Data Prep/Exploration, Modeling/Feature Selection, Evaluation/Interpretation, Deployment/Integration.

Then:
- Sum stage scores for notebook quality.
- Count only notebooks that pass all required section checks as complete pipelines.

