/** Tab ids must match keys expected by `MlPipelinesSection` and `/api/analytics/ml-pipelines`. */
export type MlPipeline = {
  id: string
  title: string
  description: string
}

export const ML_PIPELINES: MlPipeline[] = [
  {
    id: 'donation-forecast',
    title: 'Donation forecast',
    description: 'Monthly monetary totals from Supabase with an ordinary least-squares trend and one-month-ahead point estimate.',
  },
  {
    id: 'risk-scoring',
    title: 'Resident risk scoring',
    description: 'Distribution of current risk level among active residents (live case mix, not a separate classifier).',
  },
  {
    id: 'occupancy',
    title: 'Safehouse occupancy',
    description: 'Utilization (current ÷ capacity) for each active safehouse from live occupancy fields.',
  },
  {
    id: 'donor-churn',
    title: 'Donor churn',
    description: 'Recency buckets: donated in the last 90 days, lapsing (older or missing), and active monetary supporters who never recorded a donation.',
  },
]
