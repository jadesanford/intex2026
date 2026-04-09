from __future__ import annotations

import pandas as pd

from common import build_engine


def run() -> int:
    engine = build_engine()

    supporters = pd.read_sql(
        """
        SELECT
            supporter_id,
            supporter_type,
            status,
            region,
            country,
            relationship_type,
            acquisition_channel,
            created_at,
            first_donation_date
        FROM supporters
        """,
        engine,
    )
    donations = pd.read_sql(
        """
        SELECT supporter_id, donation_type, amount, donation_date
        FROM donations
        WHERE supporter_id IS NOT NULL
        """,
        engine,
    )

    supporters = supporters.copy()
    supporters["created_at"] = pd.to_datetime(supporters["created_at"], errors="coerce")
    supporters["first_donation_date"] = pd.to_datetime(
        supporters["first_donation_date"], errors="coerce"
    )

    monetary = donations[donations["donation_type"] == "Monetary"].copy()
    monetary["donation_date"] = pd.to_datetime(monetary["donation_date"], errors="coerce")
    monetary["amount"] = pd.to_numeric(monetary["amount"], errors="coerce").fillna(0.0)

    agg = (
        monetary.groupby("supporter_id", as_index=False)
        .agg(
            donation_count=("amount", "count"),
            total_amount=("amount", "sum"),
            avg_amount=("amount", "mean"),
            last_donation_date=("donation_date", "max"),
            first_seen_donation_date=("donation_date", "min"),
        )
    )

    features = supporters.merge(agg, on="supporter_id", how="left")
    features["donation_count"] = features["donation_count"].fillna(0).astype(int)
    features["total_amount"] = features["total_amount"].fillna(0.0)
    features["avg_amount"] = features["avg_amount"].fillna(0.0)

    now = pd.Timestamp.utcnow().tz_localize(None)
    features["days_since_last_donation"] = (
        now - pd.to_datetime(features["last_donation_date"], errors="coerce")
    ).dt.days
    features["days_since_last_donation"] = features["days_since_last_donation"].fillna(9999).astype(int)
    features["has_monetary_donation"] = (features["donation_count"] > 0).astype(int)
    features["is_monetary_supporter"] = (
        features["supporter_type"].fillna("").eq("MonetaryDonor")
    ).astype(int)
    features["is_active_supporter"] = features["status"].fillna("").eq("Active").astype(int)
    for col in [
        "supporter_type",
        "status",
        "region",
        "country",
        "relationship_type",
        "acquisition_channel",
    ]:
        features[col] = features[col].fillna("").astype(str)

    output = features[
        [
            "supporter_id",
            "supporter_type",
            "status",
            "region",
            "country",
            "relationship_type",
            "acquisition_channel",
            "donation_count",
            "total_amount",
            "avg_amount",
            "days_since_last_donation",
            "has_monetary_donation",
            "is_monetary_supporter",
            "is_active_supporter",
        ]
    ].copy()

    output.to_sql("ml_donor_churn_features", engine, if_exists="replace", index=False)
    return len(output)


if __name__ == "__main__":
    rows = run()
    print(f"Wrote {rows} rows to ml_donor_churn_features")
