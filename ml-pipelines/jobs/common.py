from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus

import numpy as np
from sqlalchemy import create_engine


@dataclass(frozen=True)
class DbConfig:
    database_url: str


def _parse_npgsql_connection_string(raw: str) -> str:
    parts = {}
    for chunk in raw.split(";"):
        if not chunk or "=" not in chunk:
            continue
        k, v = chunk.split("=", 1)
        parts[k.strip().lower()] = v.strip()

    host = parts.get("host", "localhost")
    port = parts.get("port", "5432")
    database = parts.get("database") or parts.get("initial catalog")
    user = parts.get("username") or parts.get("user id") or parts.get("user")
    password = parts.get("password", "")
    sslmode = parts.get("sslmode")

    if not database or not user:
        raise RuntimeError(
            "Connection string is missing required Database/Username fields."
        )

    url = (
        f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{database}"
    )
    if sslmode:
        url += f"?sslmode={sslmode}"
    return url


def _normalize_database_url(value: str) -> str:
    v = value.strip()
    if not v:
        return ""
    if "Host=" in v or "host=" in v:
        return _parse_npgsql_connection_string(v)
    if v.startswith("postgresql://"):
        return "postgresql+psycopg://" + v[len("postgresql://") :]
    return v


def _read_appsettings_database_url() -> str:
    root = Path(__file__).resolve().parents[2]
    candidates = [
        root / "backend" / "appsettings.Development.json",
        root / "backend" / "appsettings.json",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue

        # Common spots teams use for connection strings.
        conn_strings = data.get("ConnectionStrings") or {}
        for key in ("DefaultConnection", "Postgres", "Supabase"):
            value = conn_strings.get(key)
            if isinstance(value, str) and value.strip():
                return _normalize_database_url(value)

        for key_path in (
            ("Database", "Url"),
            ("Supabase", "DatabaseUrl"),
        ):
            node = data
            for key in key_path:
                node = node.get(key) if isinstance(node, dict) else None
            if isinstance(node, str) and node.strip():
                return _normalize_database_url(node)
    return ""


def get_db_config() -> DbConfig:
    database_url = (
        os.getenv("DATABASE_URL", "").strip()
        or os.getenv("APP_DATABASE_URL", "").strip()
        or _read_appsettings_database_url()
    )
    if not database_url:
        raise RuntimeError(
            "No database URL found. Set DATABASE_URL/APP_DATABASE_URL or add one to "
            "backend/appsettings.json (ConnectionStrings:DefaultConnection, Database:Url, "
            "or Supabase:DatabaseUrl)."
        )
    return DbConfig(database_url=database_url)


def build_engine():
    cfg = get_db_config()
    # Supabase transaction-pooler mode can throw DuplicatePreparedStatement
    # with psycopg/SQLAlchemy executemany unless server-side prepared statements are disabled.
    return create_engine(
        cfg.database_url,
        future=True,
        pool_pre_ping=True,
        connect_args={"prepare_threshold": None},
    )


def risk_level_from_probability(p: float) -> str:
    if p >= 0.75:
        return "high"
    if p >= 0.45:
        return "medium"
    return "low"


def binary_positive_proba(estimator, X) -> np.ndarray:
    """Probability of the positive class; handles single-column predict_proba (one class only)."""
    p = estimator.predict_proba(X)
    if p.shape[1] == 1:
        return p[:, 0].astype(float)
    classes = getattr(estimator, "classes_", None)
    if classes is not None and len(classes) == 2:
        try:
            idx = list(classes).index(1)
        except ValueError:
            idx = 1
        return p[:, idx].astype(float)
    return p[:, 1].astype(float)
