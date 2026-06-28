from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from harness_eval.config import load_config
from harness_eval.runner import dump_runtime_plan, run_selected_rounds


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Pickle agent harness evals.")
    parser.add_argument("--config", default="harness-evals/config.yaml")
    parser.add_argument("--round", default="round-01")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="실행 계획만 출력하고 Agent Server를 호출하지 않습니다.",
    )
    args = parser.parse_args()

    config = load_config(Path(args.config))
    if args.dry_run:
        print(dump_runtime_plan(config, args.round))
        return

    output_dirs = asyncio.run(run_selected_rounds(config, args.round))
    for output_dir in output_dirs:
        print(f"Harness eval results written to: {output_dir}")


if __name__ == "__main__":
    main()
