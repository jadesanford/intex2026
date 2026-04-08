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
    description: 'Active case risk-level mix from resident snapshots for escalation triage.',
  },
  {
    id: 'donor-churn-prediction',
    title: 'Donor churn prediction',
    description: 'Recency buckets for monetary supporters and recent monthly giving trend.',
  },
  {
    id: 'education-progress-forecast',
    title: 'Education progress forecast',
    description: 'Monthly average progress from education records.',
  },
  {
    id: 'health-deterioration-alert',
    title: 'Health deterioration alert',
    description: 'Low health-score counts, checkup gaps, and health-score bands.',
  },
  {
    id: 'home-visitation-followup-prioritization',
    title: 'Home visitation follow-up prioritization',
    description: 'Follow-up and safety concern signals from home visitation logs.',
  },
  {
    id: 'intervention-plan-completion-risk',
    title: 'Intervention plan completion risk',
    description: 'Open and overdue intervention plans with status distribution.',
  },
  {
    id: 'reintegration-readiness',
    title: 'Reintegration readiness',
    description: 'Reintegration status mix and completion readiness rate.',
  },
  {
    id: 'safehouse-capacity-strain-forecast',
    title: 'Safehouse capacity strain forecast',
    description: 'Safehouse utilization percentage from current occupancy and capacity.',
  },
]
