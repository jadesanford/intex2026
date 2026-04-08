/**
 * Types aligned with FastAPI `/dashboard/*` and `/predict/*` responses.
 * Use with `mlPredictionClient.ts` or point `baseUrl` at your .NET proxy instead of Python.
 */

export type FeatureMap = Record<string, string | number | boolean | null | undefined>;

export interface FeaturePayload {
  features: FeatureMap;
}

export interface GlobalDriverRow {
  feature: string;
  importance: number;
}

export interface GlobalDriversPayload {
  available: boolean;
  drivers: GlobalDriverRow[];
  source?: string;
  error?: string;
}

export interface FamilyImportanceRow {
  family: string;
  importance: number;
}

export interface NarrativeBlock {
  headline: string;
  tier_label: string;
  threshold_rule: string;
  action_bullets: string[];
}

export interface ReintegrationPrediction {
  probability_success: number;
  threshold: number;
  tier: string;
}

export interface EscalationPrediction {
  probability_incident_30d: number;
  threshold: number;
  tier: string;
}

/** POST /dashboard/reintegration-readiness */
export interface ReintegrationDashboardResponse {
  model: 'reintegration-readiness';
  prediction: ReintegrationPrediction;
  narrative: NarrativeBlock;
  global_drivers: GlobalDriversPayload;
  family_importance: FamilyImportanceRow[];
}

/** POST /dashboard/case-escalation-risk */
export interface CaseEscalationDashboardResponse {
  model: 'case-escalation-risk';
  prediction: EscalationPrediction;
  narrative: NarrativeBlock;
  global_drivers: GlobalDriversPayload;
  family_importance: FamilyImportanceRow[];
}

export type DashboardResponse = ReintegrationDashboardResponse | CaseEscalationDashboardResponse;

export interface HealthResponse {
  status: string;
  artifacts_dir: string;
  reintegration_loaded: boolean;
  case_escalation_loaded: boolean;
}

export interface PredictReintegrationResponse {
  probability_success: number;
  threshold: number;
  tier: string;
  note?: string;
}

export interface PredictEscalationResponse {
  probability_incident_30d: number;
  threshold: number;
  tier: string;
}
