/** Tab ids must match keys expected by `MlPipelinesSection` and `/api/analytics/ml-pipelines`. */
export type MlPipeline = {
  id: string
  title: string
  description: string
}

export const ML_PIPELINES: MlPipeline[] = [
  {
    id: 'case-escalation-risk',
    title: 'Case escalation risk',
    description:
      'Risk-tier mix from ml_case_escalation_predictions (joblib); otherwise current_risk_level on active residents.',
  },
  {
    id: 'donor-churn-prediction',
    title: 'Donor churn prediction',
    description:
      'Risk-level counts from donor_churn_predictions + giving trend; otherwise recency-style heuristics from raw tables.',
  },
  {
    id: 'education-progress-forecast',
    title: 'Education progress forecast',
    description: 'Monthly predicted progress from ml_education_progress_predictions; otherwise average progress_percent.',
  },
  {
    id: 'health-deterioration-alert',
    title: 'Health deterioration alert',
    description: 'Model risk_level counts from ml_health_alert_predictions; otherwise health-score and checkup rollups.',
  },
  {
    id: 'home-visitation-followup-prioritization',
    title: 'Home visitation follow-up prioritization',
    description: 'Priority tier mix from ml_home_visitation_predictions; otherwise visit outcomes and flags from logs.',
  },
  {
    id: 'intervention-plan-completion-risk',
    title: 'Intervention plan completion risk',
    description: 'Model risk_tier mix from ml_intervention_plan_predictions; otherwise plan status histogram from DB.',
  },
  {
    id: 'reintegration-readiness',
    title: 'Reintegration readiness',
    description:
      'Success-probability bands from ml_reintegration_predictions; otherwise resident reintegration_status counts.',
  },
  {
    id: 'safehouse-capacity-strain-forecast',
    title: 'Safehouse capacity strain forecast',
    description:
      'Utilization plus strain probability from ml_safehouse_strain_predictions; otherwise occupancy÷capacity only.',
  },
]
