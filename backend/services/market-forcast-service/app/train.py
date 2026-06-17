from __future__ import annotations

import argparse

from app.ml.registry import get_model_spec, list_model_specs


def main() -> None:
    parser = argparse.ArgumentParser(description="Train market forecast models.")
    parser.add_argument("--model-id", default="all", help="Model id to train, or 'all'.")
    args = parser.parse_args()

    specs = list_model_specs() if args.model_id == "all" else [get_model_spec(args.model_id)]
    missing = [args.model_id] if specs == [None] else []
    if missing:
        raise SystemExit(f"Unknown model_id: {missing[0]}")

    for spec in specs:
        if spec is None:
            continue
        raise SystemExit(
            f"{spec.model_id} trainer is not implemented yet. "
            f"Add {spec.package}.train:train_and_save."
        )


if __name__ == "__main__":
    main()

