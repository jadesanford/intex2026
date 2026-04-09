"""Build sklearn input frames from Postgres (Supabase) tables — column names must match saved .joblib pipelines."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sqlalchemy.engine import Engine


def _parse_age(val) -> float:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return 0.0
    s = str(val).strip()
    if not s:
        return 0.0
    m = re.search(r"(\d+)", s)
    return float(m.group(1)) if m else 0.0


def _days_since(d: pd.Timestamp | None, now: pd.Timestamp) -> int:
    if d is None or pd.isna(d):
        return 9999
    return int((now - d).days)


def _month_key(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    t = str(s).strip()
    if len(t) >= 7 and t[4] == "-":
        return t[:7]
    dt = pd.to_datetime(t, errors="coerce")
    if pd.isna(dt):
        return None
    return dt.strftime("%Y-%m")


def load_core_tables(engine: Engine) -> dict[str, pd.DataFrame]:
    out = {}
    out["residents"] = pd.read_sql(
        """SELECT resident_id, safehouse_id, case_status, sex, case_category, initial_risk_level, current_risk_level,
        present_age, length_of_stay, age_upon_admission, date_of_admission, reintegration_status
        FROM residents""",
        engine,
    )
    out["incidents"] = pd.read_sql(
        """SELECT incident_id, resident_id, incident_date, severity, resolved FROM incident_reports""",
        engine,
    )
    out["recordings"] = pd.read_sql(
        """SELECT recording_id, resident_id, session_date, session_duration_minutes, progress_noted, concerns_flagged, referral_made
        FROM process_recordings""",
        engine,
    )
    out["visitations"] = pd.read_sql(
        """SELECT visitation_id, resident_id, visit_date, visit_type, family_cooperation_level,
        safety_concerns_noted, follow_up_needed, visit_outcome FROM home_visitations""",
        engine,
    )
    out["education"] = pd.read_sql(
        """SELECT education_record_id, resident_id, record_date, attendance_rate, progress_percent,
        education_level, enrollment_status, completion_status FROM education_records""",
        engine,
    )
    out["health"] = pd.read_sql(
        """SELECT health_record_id, resident_id, record_date, general_health_score, nutrition_score,
        sleep_quality_score, energy_level_score, bmi FROM health_wellbeing_records""",
        engine,
    )
    out["plans"] = pd.read_sql(
        """SELECT plan_id, resident_id, plan_category, target_date, status, created_at FROM intervention_plans""",
        engine,
    )
    out["safehouses"] = pd.read_sql(
        """SELECT safehouse_id, name, capacity_girls, current_occupancy, status, region FROM safehouses""",
        engine,
    )
    out["metrics"] = pd.read_sql(
        """SELECT safehouse_id, month_start, active_residents, avg_education_progress, avg_health_score,
        process_recording_count, home_visitation_count, incident_count FROM safehouse_monthly_metrics""",
        engine,
    )
    return out


def _active_residents(r: pd.DataFrame) -> pd.DataFrame:
    return r[r["case_status"].fillna("").str.strip().eq("Active")].copy()


def build_case_escalation_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    r = _active_residents(t["residents"])
    if r.empty:
        return pd.DataFrame()
    now = pd.Timestamp.utcnow().tz_localize(None)
    cut180 = now - timedelta(days=180)
    inc = t["incidents"].copy()
    inc["incident_date"] = pd.to_datetime(inc["incident_date"], errors="coerce")
    rec = t["recordings"].copy()
    rec["session_date"] = pd.to_datetime(rec["session_date"], errors="coerce")
    vis = t["visitations"].copy()
    vis["visit_date"] = pd.to_datetime(vis["visit_date"], errors="coerce")
    edu = t["education"].copy()
    edu["record_date"] = pd.to_datetime(edu["record_date"], errors="coerce")
    h = t["health"].copy()
    h["record_date"] = pd.to_datetime(h["record_date"], errors="coerce")

    rows = []
    for _, row in r.iterrows():
        rid = int(row["resident_id"])
        inc_r = inc[(inc["resident_id"] == rid) & (inc["incident_date"] >= cut180)]
        incidents_total_180d = len(inc_r)
        incidents_severe_180d = inc_r["severity"].fillna("").str.contains("High", case=False).sum()
        unresolved_incidents_180d = (inc_r["resolved"] != True).sum()

        rec_r = rec[(rec["resident_id"] == rid) & (rec["session_date"] >= cut180)]
        sessions_180d = len(rec_r)
        avg_session_minutes = float(rec_r["session_duration_minutes"].mean()) if sessions_180d else 0.0
        progress_noted_rate = float(rec_r["progress_noted"].fillna(False).astype(float).mean()) if sessions_180d else 0.0
        concerns_flagged_rate = float(rec_r["concerns_flagged"].fillna(False).astype(float).mean()) if sessions_180d else 0.0
        referral_rate = float(rec_r["referral_made"].fillna(False).astype(float).mean()) if sessions_180d else 0.0

        vis_r = vis[(vis["resident_id"] == rid) & (vis["visit_date"] >= cut180)]
        visits_180d = len(vis_r)
        follow_up_needed_rate = float(vis_r["follow_up_needed"].fillna(False).astype(float).mean()) if visits_180d else 0.0
        safety_concerns_rate = float(vis_r["safety_concerns_noted"].fillna(False).astype(float).mean()) if visits_180d else 0.0
        coop = vis_r["family_cooperation_level"].dropna().astype(str)
        avg_family_cooperation = float(coop.map({"High": 3, "Medium": 2, "Low": 1}).fillna(2).mean()) if len(coop) else 2.0

        edu_r = edu[edu["resident_id"] == rid].sort_values("record_date")
        health_r = h[h["resident_id"] == rid].sort_values("record_date")

        health_score_mean = float(health_r["general_health_score"].mean()) if len(health_r) else 0.0
        sleep_score_mean = float(health_r["sleep_quality_score"].mean()) if len(health_r) else 0.0
        nutrition_score_mean = float(health_r["nutrition_score"].mean()) if len(health_r) else 0.0
        energy_score_mean = float(health_r["energy_level_score"].mean()) if len(health_r) else 0.0
        edu_attendance_mean = float(edu_r["attendance_rate"].mean()) if len(edu_r) else 0.0
        edu_progress_mean = float(edu_r["progress_percent"].mean()) if len(edu_r) else 0.0

        rows.append(
            {
                "resident_id": rid,
                "safehouse_id": int(row["safehouse_id"]) if pd.notna(row.get("safehouse_id")) else 0,
                "sex": str(row.get("sex") or "Unknown"),
                "present_age": _parse_age(row.get("present_age")),
                "length_of_stay": _parse_age(row.get("length_of_stay")),
                "case_category": str(row.get("case_category") or "Unknown"),
                "initial_risk_level": str(row.get("initial_risk_level") or "Unknown"),
                "current_risk_level": str(row.get("current_risk_level") or "Unknown"),
                "incidents_total_180d": int(incidents_total_180d),
                "incidents_severe_180d": int(incidents_severe_180d),
                "unresolved_incidents_180d": int(unresolved_incidents_180d),
                "sessions_180d": int(sessions_180d),
                "avg_session_minutes": avg_session_minutes,
                "progress_noted_rate": progress_noted_rate,
                "concerns_flagged_rate": concerns_flagged_rate,
                "referral_rate": referral_rate,
                "visits_180d": int(visits_180d),
                "follow_up_needed_rate": follow_up_needed_rate,
                "safety_concerns_rate": safety_concerns_rate,
                "avg_family_cooperation": avg_family_cooperation,
                "health_score_mean": health_score_mean,
                "sleep_score_mean": sleep_score_mean,
                "nutrition_score_mean": nutrition_score_mean,
                "energy_score_mean": energy_score_mean,
                "edu_attendance_mean": edu_attendance_mean,
                "edu_progress_mean": edu_progress_mean,
            }
        )
    return pd.DataFrame(rows)


def build_reintegration_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    r = _active_residents(t["residents"])
    if r.empty:
        return pd.DataFrame()
    now = pd.Timestamp.utcnow().tz_localize(None)
    cut90 = now - timedelta(days=90)
    cut180 = now - timedelta(days=180)
    inc = t["incidents"].copy()
    inc["incident_date"] = pd.to_datetime(inc["incident_date"], errors="coerce")
    rec = t["recordings"].copy()
    rec["session_date"] = pd.to_datetime(rec["session_date"], errors="coerce")
    vis = t["visitations"].copy()
    vis["visit_date"] = pd.to_datetime(vis["visit_date"], errors="coerce")
    edu = t["education"].copy()
    edu["record_date"] = pd.to_datetime(edu["record_date"], errors="coerce")
    h = t["health"].copy()
    h["record_date"] = pd.to_datetime(h["record_date"], errors="coerce")

    rows = []
    for _, row in r.iterrows():
        rid = int(row["resident_id"])
        edu_r = edu[edu["resident_id"] == rid].sort_values("record_date", ascending=False)
        h_r = h[h["resident_id"] == rid].sort_values("record_date", ascending=False)
        latest_e = edu_r.iloc[0] if len(edu_r) else None
        latest_h = h_r.iloc[0] if len(h_r) else None

        sessions_last_90d = len(
            rec[(rec["resident_id"] == rid) & (pd.to_datetime(rec["session_date"], errors="coerce") >= cut90)]
        )
        visits_last_90d = len(
            vis[(vis["resident_id"] == rid) & (pd.to_datetime(vis["visit_date"], errors="coerce") >= cut90)]
        )
        incidents_last_180d = len(
            inc[(inc["resident_id"] == rid) & (inc["incident_date"] >= cut180)]
        )

        rows.append(
            {
                "resident_id": rid,
                "present_age": _parse_age(row.get("present_age")),
                "length_of_stay": _parse_age(row.get("length_of_stay")),
                "age_upon_admission": _parse_age(row.get("age_upon_admission")),
                "initial_risk_level": str(row.get("initial_risk_level") or "Unknown"),
                "current_risk_level": str(row.get("current_risk_level") or "Unknown"),
                "case_category": str(row.get("case_category") or "Unknown"),
                "safehouse_id": int(row["safehouse_id"]) if pd.notna(row.get("safehouse_id")) else 0,
                "sex": str(row.get("sex") or "Unknown"),
                "edu_attendance_rate": float(latest_e["attendance_rate"]) if latest_e is not None and pd.notna(latest_e.get("attendance_rate")) else 0.0,
                "edu_progress_percent": float(latest_e["progress_percent"]) if latest_e is not None and pd.notna(latest_e.get("progress_percent")) else 0.0,
                "edu_education_level": str(latest_e["education_level"]) if latest_e is not None else "",
                "edu_enrollment_status": str(latest_e["enrollment_status"]) if latest_e is not None else "",
                "edu_completion_status": str(latest_e["completion_status"]) if latest_e is not None else "",
                "health_general_health_score": float(latest_h["general_health_score"]) if latest_h is not None and pd.notna(latest_h.get("general_health_score")) else 0.0,
                "health_nutrition_score": float(latest_h["nutrition_score"]) if latest_h is not None and pd.notna(latest_h.get("nutrition_score")) else 0.0,
                "health_sleep_quality_score": float(latest_h["sleep_quality_score"]) if latest_h is not None and pd.notna(latest_h.get("sleep_quality_score")) else 0.0,
                "health_energy_level_score": float(latest_h["energy_level_score"]) if latest_h is not None and pd.notna(latest_h.get("energy_level_score")) else 0.0,
                "health_bmi": float(latest_h["bmi"]) if latest_h is not None and pd.notna(latest_h.get("bmi")) else 0.0,
                "sessions_last_90d": int(sessions_last_90d),
                "visits_last_90d": int(visits_last_90d),
                "incidents_last_180d": int(incidents_last_180d),
            }
        )
    return pd.DataFrame(rows)


def build_education_progress_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    edu = t["education"].copy()
    r = t["residents"].copy()
    h = t["health"].copy()
    if edu.empty:
        return pd.DataFrame()
    hlast = h.sort_values("record_date").groupby("resident_id").tail(1)
    hlast = hlast[["resident_id", "general_health_score", "sleep_quality_score", "nutrition_score"]].rename(
        columns={
            "general_health_score": "h_general_health_score",
            "sleep_quality_score": "h_sleep_quality_score",
            "nutrition_score": "h_nutrition_score",
        }
    )
    m = edu.merge(r, on="resident_id", how="left").merge(hlast, on="resident_id", how="left")
    m["education_level"] = m["education_level"].fillna("").astype(str)
    m["enrollment_status"] = m["enrollment_status"].fillna("").astype(str)
    m = m.assign(
        attendance_rate=pd.to_numeric(m["attendance_rate"], errors="coerce").fillna(0.0),
        progress_percent=pd.to_numeric(m["progress_percent"], errors="coerce").fillna(0.0),
        present_age=m["present_age"].map(_parse_age),
        length_of_stay=m["length_of_stay"].map(_parse_age),
        initial_risk_level=m["initial_risk_level"].fillna("").astype(str),
        current_risk_level=m["current_risk_level"].fillna("").astype(str),
        case_category=m["case_category"].fillna("").astype(str),
        safehouse_id=pd.to_numeric(m["safehouse_id"], errors="coerce").fillna(0).astype(int),
        h_general_health_score=pd.to_numeric(m.get("h_general_health_score"), errors="coerce").fillna(0.0),
        h_sleep_quality_score=pd.to_numeric(m.get("h_sleep_quality_score"), errors="coerce").fillna(0.0),
        h_nutrition_score=pd.to_numeric(m.get("h_nutrition_score"), errors="coerce").fillna(0.0),
    )
    m["education_record_id"] = m["education_record_id"].astype(int)
    return m[
        [
            "education_record_id",
            "resident_id",
            "record_date",
            "attendance_rate",
            "progress_percent",
            "education_level",
            "enrollment_status",
            "present_age",
            "length_of_stay",
            "initial_risk_level",
            "current_risk_level",
            "case_category",
            "safehouse_id",
            "h_general_health_score",
            "h_sleep_quality_score",
            "h_nutrition_score",
        ]
    ]


def build_health_alert_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    r = _active_residents(t["residents"])
    h = t["health"].copy()
    rec = t["recordings"].copy()
    inc = t["incidents"].copy()
    if r.empty:
        return pd.DataFrame()
    h["record_date"] = pd.to_datetime(h["record_date"], errors="coerce")
    rows = []
    for _, row in r.iterrows():
        rid = int(row["resident_id"])
        h_r = h[h["resident_id"] == rid].sort_values("record_date", ascending=False)
        latest = h_r.iloc[0] if len(h_r) else None
        sessions_count = len(rec[rec["resident_id"] == rid])
        incidents_count = len(inc[inc["resident_id"] == rid])
        rows.append(
            {
                "resident_id": rid,
                "general_health_score": float(latest["general_health_score"]) if latest is not None and pd.notna(latest.get("general_health_score")) else 0.0,
                "nutrition_score": float(latest["nutrition_score"]) if latest is not None and pd.notna(latest.get("nutrition_score")) else 0.0,
                "sleep_quality_score": float(latest["sleep_quality_score"]) if latest is not None and pd.notna(latest.get("sleep_quality_score")) else 0.0,
                "energy_level_score": float(latest["energy_level_score"]) if latest is not None and pd.notna(latest.get("energy_level_score")) else 0.0,
                "bmi": float(latest["bmi"]) if latest is not None and pd.notna(latest.get("bmi")) else 0.0,
                "sessions_count": int(sessions_count),
                "incidents_count": int(incidents_count),
            }
        )
    return pd.DataFrame(rows)


def build_home_visitation_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    vis = t["visitations"].copy()
    r = t["residents"].copy()
    if vis.empty:
        return pd.DataFrame()
    vis["visit_date"] = pd.to_datetime(vis["visit_date"], errors="coerce")
    vis = vis.sort_values(["resident_id", "visit_date"])
    vis["follow_num"] = vis.groupby("resident_id").cumcount() + 1
    m = vis.merge(r[["resident_id", "present_age", "initial_risk_level", "current_risk_level", "safehouse_id"]], on="resident_id", how="left")
    m = m.assign(
        visit_type=m["visit_type"].fillna("").astype(str),
        family_cooperation_level=m["family_cooperation_level"].fillna("").astype(str),
        present_age=m["present_age"].map(_parse_age),
        initial_risk_level=m["initial_risk_level"].fillna("").astype(str),
        current_risk_level=m["current_risk_level"].fillna("").astype(str),
        safehouse_id=pd.to_numeric(m["safehouse_id"], errors="coerce").fillna(0).astype(int),
    )
    return m[
        [
            "visitation_id",
            "resident_id",
            "visit_type",
            "family_cooperation_level",
            "follow_num",
            "present_age",
            "initial_risk_level",
            "current_risk_level",
            "safehouse_id",
        ]
    ]


def build_intervention_plan_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    plans = t["plans"].copy()
    r = t["residents"].copy()
    if plans.empty:
        return pd.DataFrame()
    now = pd.Timestamp.utcnow().tz_localize(None)
    m = plans.merge(r, on="resident_id", how="left")
    m["target_date"] = pd.to_datetime(m["target_date"], errors="coerce")
    m["days_to_target"] = (m["target_date"] - now).dt.days.fillna(9999).astype(int)
    m = m.assign(
        plan_category=m["plan_category"].fillna("").astype(str),
        present_age=m["present_age"].map(_parse_age),
        length_of_stay=m["length_of_stay"].map(_parse_age),
        initial_risk_level=m["initial_risk_level"].fillna("").astype(str),
        current_risk_level=m["current_risk_level"].fillna("").astype(str),
        case_category=m["case_category"].fillna("").astype(str),
        safehouse_id=pd.to_numeric(m["safehouse_id"], errors="coerce").fillna(0).astype(int),
    )
    return m[
        [
            "plan_id",
            "resident_id",
            "plan_category",
            "days_to_target",
            "present_age",
            "length_of_stay",
            "initial_risk_level",
            "current_risk_level",
            "case_category",
            "safehouse_id",
        ]
    ]


def build_safehouse_strain_features(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    sh = t["safehouses"].copy()
    met = t["metrics"].copy()
    if sh.empty:
        return pd.DataFrame()
    met = met.sort_values(["safehouse_id", "month_start"], ascending=[True, False])
    latest = met.groupby("safehouse_id").head(1)
    m = sh.merge(latest, on="safehouse_id", how="left")
    m["region"] = m["region"].fillna("").astype(str)
    m = m.assign(
        active_residents=pd.to_numeric(m["active_residents"], errors="coerce").fillna(0).astype(int),
        avg_education_progress=pd.to_numeric(m["avg_education_progress"], errors="coerce").fillna(0.0),
        avg_health_score=pd.to_numeric(m["avg_health_score"], errors="coerce").fillna(0.0),
        process_recording_count=pd.to_numeric(m["process_recording_count"], errors="coerce").fillna(0).astype(int),
        home_visitation_count=pd.to_numeric(m["home_visitation_count"], errors="coerce").fillna(0).astype(int),
        incident_count=pd.to_numeric(m["incident_count"], errors="coerce").fillna(0).astype(int),
        capacity_girls=pd.to_numeric(m["capacity_girls"], errors="coerce").fillna(0).astype(int),
        current_occupancy=pd.to_numeric(m["current_occupancy"], errors="coerce").fillna(0).astype(int),
    )
    return m[
        [
            "safehouse_id",
            "active_residents",
            "avg_education_progress",
            "avg_health_score",
            "process_recording_count",
            "home_visitation_count",
            "incident_count",
            "capacity_girls",
            "current_occupancy",
            "region",
        ]
    ]
