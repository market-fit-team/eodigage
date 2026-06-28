from __future__ import annotations

import json
import os
from dataclasses import asdict, is_dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml

from harness_eval.evaluate import evaluate_turn, trial_score
from harness_eval.models import Conversation, HarnessConfig, HarnessRound, TrialResult, TurnResult
from harness_eval.sse import (
    collect_model_text,
    collect_text_before_first_tool,
    collect_tool_calls,
    collect_tool_errors,
    terminal_lifecycle_status,
)


def write_round_results(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
    trials: list[TrialResult],
) -> Path:
    round_dir = config.run.results_dir / harness_round.id
    trials_dir = round_dir / "trials"
    trials_dir.mkdir(parents=True, exist_ok=True)

    manifest = _manifest(config=config, harness_round=harness_round)
    metrics = _metrics(config=config, trials=trials)
    _write_yaml(round_dir / "manifest.yaml", manifest)
    (round_dir / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (round_dir / "responses.md").write_text(
        _responses_markdown(config.conversation, trials),
        encoding="utf-8",
    )
    (round_dir / "teacher-review.md").write_text(
        _teacher_review_markdown(config=config, harness_round=harness_round, metrics=metrics),
        encoding="utf-8",
    )

    for trial in trials:
        (trials_dir / f"{trial.model_name}-attempt-{trial.attempt:02d}.json").write_text(
            json.dumps(_trial_payload(config.conversation, trial), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    return round_dir


def _manifest(*, config: HarnessConfig, harness_round: HarnessRound) -> dict[str, Any]:
    return {
        "round": {
            "id": harness_round.id,
            "title": harness_round.title,
            "hypothesis": harness_round.hypothesis,
            "change_reason": harness_round.change_reason,
            "round_file": str(harness_round.path),
        },
        "control_variables": {
            "server_runtime": {
                "base_url": config.server.base_url,
                "launch_env": config.server.runtime_env,
                "ff_v2_event_streaming": os.getenv("FF_V2_EVENT_STREAMING"),
                "auto_create_schema": os.getenv("AUTO_CREATE_SCHEMA"),
                "langgraph_disable_file_persistence": os.getenv(
                    "LANGGRAPH_DISABLE_FILE_PERSISTENCE"
                ),
            },
            "conversation": {
                "name": config.conversation.name,
                "description": config.conversation.description,
                "path": str(config.conversation.path),
                "turns": [
                    {"id": turn.id, "prompt": turn.prompt, "expectations": asdict(turn.expectations)}
                    for turn in config.conversation.turns
                ],
            },
            "repetitions": config.run.repetitions,
            "parallel_models": config.run.parallel_models,
            "turn_timeout_seconds": config.run.turn_timeout_seconds,
            "models": [asdict(model) for model in config.models],
        },
        "independent_variables": {
            "harness_overrides": harness_round.harness_overrides,
            "allowed_tools": harness_round.allowed_tools or config.defaults.allowed_tools,
            "interrupt_on": harness_round.interrupt_on or config.defaults.interrupt_on,
            "auto_resume": asdict(harness_round.auto_resume or config.defaults.auto_resume)
            if (harness_round.auto_resume or config.defaults.auto_resume)
            else None,
        },
        "created_at": datetime.now(UTC).isoformat(),
    }


def _metrics(*, config: HarnessConfig, trials: list[TrialResult]) -> dict[str, Any]:
    by_model: dict[str, list[dict[str, Any]]] = {}
    for trial in trials:
        turn_evaluations = [
            evaluate_turn(turn, result.all_events if result is not None else [])
            for turn, result in _conversation_turn_results(config.conversation, trial)
        ]
        by_model.setdefault(trial.model_name, []).append(
            {
                "attempt": trial.attempt,
                "status": trial.status,
                "score": trial_score(turn_evaluations),
                "turns": [
                    {
                        "turn_id": turn.id,
                        "passed": evaluation.passed,
                        "checks": evaluation.checks,
                        "metrics": evaluation.metrics,
                    }
                    for turn, evaluation in zip(config.conversation.turns, turn_evaluations)
                ],
                "errors": trial.errors,
            }
        )

    summaries = {}
    for model_name, attempts in by_model.items():
        scores = [float(item["score"]) for item in attempts]
        summaries[model_name] = {
            "attempts": len(attempts),
            "mean_score": sum(scores) / len(scores) if scores else 0.0,
            "completed_attempts": sum(1 for item in attempts if item["status"] == "completed"),
        }

    all_scores = [float(item["score"]) for attempts in by_model.values() for item in attempts]
    return {
        "summary": {
            "total_trials": sum(len(attempts) for attempts in by_model.values()),
            "mean_score": sum(all_scores) / len(all_scores) if all_scores else 0.0,
        },
        "by_model": summaries,
        "attempts": by_model,
    }


def _trial_payload(conversation: Conversation, trial: TrialResult) -> dict[str, Any]:
    return {
        "round_id": trial.round_id,
        "model_name": trial.model_name,
        "model": trial.model,
        "attempt": trial.attempt,
        "status": trial.status,
        "started_at": trial.started_at.isoformat(),
        "ended_at": trial.ended_at.isoformat(),
        "errors": trial.errors,
        "turns": [
            _turn_payload(turn, result)
            for turn, result in _conversation_turn_results(conversation, trial)
        ],
    }


def _responses_markdown(conversation: Conversation, trials: list[TrialResult]) -> str:
    lines = ["# Harness Eval Responses", ""]
    for trial in sorted(trials, key=lambda item: (item.model_name, item.attempt)):
        lines.append(f"## {trial.model_name} attempt {trial.attempt}")
        lines.append("")
        for turn, result in _conversation_turn_results(conversation, trial):
            lines.append(f"### {turn.id}")
            lines.append("")
            lines.append("**Prompt**")
            lines.append("")
            lines.append("```text")
            lines.append(turn.prompt)
            lines.append("```")
            lines.append("")
            lines.append("**Response**")
            lines.append("")
            lines.append("```text")
            if result is None:
                lines.append("(missing turn result)")
            else:
                lines.append(collect_model_text(result.all_events) or "(empty)")
            lines.append("```")
            lines.append("")
            tool_calls = collect_tool_calls(result.all_events) if result is not None else []
            lines.append(f"Tool calls: {len(tool_calls)}")
            for call in tool_calls:
                lines.append(f"- `{call['name']}`")
            lines.append("")
    return "\n".join(lines)


def _conversation_turn_results(
    conversation: Conversation, trial: TrialResult
) -> list[tuple[Any, TurnResult | None]]:
    return [
        (turn, trial.turns[index] if index < len(trial.turns) else None)
        for index, turn in enumerate(conversation.turns)
    ]


def _turn_payload(turn: Any, result: TurnResult | None) -> dict[str, Any]:
    events = result.all_events if result is not None else []
    return {
        "turn_id": result.turn_id if result is not None else turn.id,
        "prompt": result.prompt if result is not None else turn.prompt,
        "thread_id": result.thread_id if result is not None else None,
        "missing_result": result is None,
        "final_text": collect_model_text(events),
        "midturn_text_before_first_tool": collect_text_before_first_tool(events),
        "tool_calls": collect_tool_calls(events),
        "tool_errors": collect_tool_errors(events),
        "terminal_status": terminal_lifecycle_status(events),
        "evaluation": asdict(evaluate_turn(turn, events)),
    }


def _teacher_review_markdown(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
    metrics: dict[str, Any],
) -> str:
    lines = [
        f"# Teacher Review: {harness_round.id}",
        "",
        "## Hypothesis",
        "",
        harness_round.hypothesis,
        "",
        "## Quantitative Snapshot",
        "",
        f"- total_trials: {metrics['summary']['total_trials']}",
        f"- mean_score: {metrics['summary']['mean_score']:.3f}",
        "",
        "## Model Observations",
        "",
    ]
    for model_name, summary in metrics["by_model"].items():
        lines.append(
            f"- {model_name}: mean_score={summary['mean_score']:.3f}, "
            f"completed={summary['completed_attempts']}/{summary['attempts']}"
        )
    lines.extend(
        [
            "",
            "## Qualitative Review",
            "",
            "이 섹션은 실행 후 사람이 실제 응답을 읽고 보강한다. 자동 생성 값은 "
            "정량 지표와 응답 전문을 기반으로 한 1차 관측치다.",
            "",
            "## Next Round Notes",
            "",
            "실패 우선순위: 실행 오류 > 필수 도구 미호출 > 도구 실패 > chart invalid > "
            "출처/근거 부족 > 내부 타입명 노출 > midturn 부족 > 보고서 구조 품질.",
            "",
            f"Control conversation: {config.conversation.name}",
        ]
    )
    return "\n".join(lines)


def _write_yaml(path: Path, data: dict[str, Any]) -> None:
    path.write_text(
        yaml.safe_dump(_jsonable(data), allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )


def _jsonable(value: Any) -> Any:
    if is_dataclass(value) and not isinstance(value, type):
        return _jsonable(asdict(value))
    if isinstance(value, dict):
        return {str(key): _jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value
