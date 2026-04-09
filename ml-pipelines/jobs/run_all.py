"""Run ETL + inference for all ML pipelines (all .joblib artifacts)."""
from inference_all_pipelines import run as run_inference_all_pipelines


def main() -> None:
    counts = run_inference_all_pipelines()
    for k, v in sorted(counts.items()):
        print(f"{k}: {v}")


if __name__ == "__main__":
    main()
