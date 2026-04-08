/**
 * Minimal fetch client for the Lighthouse ML API (FastAPI) or a .NET proxy that mirrors the same JSON.
 *
 * Supabase + production:
 * - Prefer calling your .NET API (e.g. /api/ml/dashboard/reintegration) which validates the user's JWT
 *   and forwards to the internal Python service. Set baseUrl to that .NET base URL.
 * - Avoid exposing the Python service directly to the public internet without auth.
 *
 * Vite: add to `.env`:
 *   VITE_ML_API_URL=http://127.0.0.1:8000
 * Or leave empty and pass baseUrl from your .NET-backed routes only.
 */

import type {
  CaseEscalationDashboardResponse,
  DashboardResponse,
  FeaturePayload,
  HealthResponse,
  PredictEscalationResponse,
  PredictReintegrationResponse,
  ReintegrationDashboardResponse,
} from './mlTypes';

export type MlClientOptions = {
  /** Base URL with no trailing slash, e.g. import.meta.env.VITE_ML_API_URL ?? '' */
  baseUrl: string;
  /** Optional bearer token (e.g. after Supabase session — if your .NET API requires it). */
  getAccessToken?: () => Promise<string | null>;
};

async function request<T>(
  path: string,
  init: RequestInit,
  opts: MlClientOptions,
): Promise<T> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (opts.getAccessToken) {
    const t = await opts.getAccessToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail ?? data.message)) ?? text ?? res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data as T;
}

export async function fetchMlHealth(opts: MlClientOptions): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { method: 'GET' }, opts);
}

export async function fetchDashboardReintegration(
  body: FeaturePayload,
  threshold: number,
  opts: MlClientOptions,
): Promise<ReintegrationDashboardResponse> {
  const q = new URLSearchParams({ threshold: String(threshold) });
  return request<ReintegrationDashboardResponse>(
    `/dashboard/reintegration-readiness?${q}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    opts,
  );
}

export async function fetchDashboardCaseEscalation(
  body: FeaturePayload,
  threshold: number,
  opts: MlClientOptions,
): Promise<CaseEscalationDashboardResponse> {
  const q = new URLSearchParams({ threshold: String(threshold) });
  return request<CaseEscalationDashboardResponse>(
    `/dashboard/case-escalation-risk?${q}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    opts,
  );
}

export async function predictReintegration(
  body: FeaturePayload,
  threshold: number,
  opts: MlClientOptions,
): Promise<PredictReintegrationResponse> {
  const q = new URLSearchParams({ threshold: String(threshold) });
  return request<PredictReintegrationResponse>(
    `/predict/reintegration-readiness?${q}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    opts,
  );
}

export async function predictCaseEscalation(
  body: FeaturePayload,
  threshold: number,
  opts: MlClientOptions,
): Promise<PredictEscalationResponse> {
  const q = new URLSearchParams({ threshold: String(threshold) });
  return request<PredictEscalationResponse>(
    `/predict/case-escalation-risk?${q}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    opts,
  );
}

/** Default export factory for a fixed base URL + optional Supabase token getter */
export function createMlClient(opts: MlClientOptions) {
  return {
    health: () => fetchMlHealth(opts),
    dashboardReintegration: (body: FeaturePayload, threshold: number) =>
      fetchDashboardReintegration(body, threshold, opts),
    dashboardCaseEscalation: (body: FeaturePayload, threshold: number) =>
      fetchDashboardCaseEscalation(body, threshold, opts),
    predictReintegration: (body: FeaturePayload, threshold: number) =>
      predictReintegration(body, threshold, opts),
    predictCaseEscalation: (body: FeaturePayload, threshold: number) =>
      predictCaseEscalation(body, threshold, opts),
  };
}

/** Vite: import.meta.env.VITE_ML_API_URL */
export function viteMlBaseUrl(): string {
  return (import.meta.env.VITE_ML_API_URL as string | undefined) ?? '';
}
