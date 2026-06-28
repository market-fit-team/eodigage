from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from harness_eval.models import (
    AutoResumeConfig,
    Conversation,
    ConversationTurn,
    DefaultsConfig,
    HarnessConfig,
    HarnessRound,
    ModelConfig,
    RunConfig,
    ServerConfig,
    TurnExpectation,
)


def load_config(path: Path) -> HarnessConfig:
    config_path = path.resolve()
    root_dir = config_path.parent
    data = _load_mapping(config_path)

    run_data = _mapping(data.get("run"), "run")
    control_data = _mapping(data.get("control"), "control")
    defaults_data = _mapping(data.get("defaults"), "defaults")
    conversation_path = _resolve(root_dir, _str(control_data, "conversation"))
    rounds_dir = _resolve(root_dir, str(data.get("rounds_dir", "rounds")))

    return HarnessConfig(
        path=config_path,
        root_dir=root_dir,
        server=_parse_server(_mapping(data.get("server"), "server")),
        run=RunConfig(
            repetitions=int(run_data.get("repetitions", 3)),
            results_dir=_resolve(root_dir, str(run_data.get("results_dir", "results"))),
            workdir=_resolve(root_dir, str(run_data.get("workdir", ".workdir"))),
            per_model_concurrency=int(run_data.get("per_model_concurrency", 1)),
            parallel_models=bool(run_data.get("parallel_models", False)),
            turn_timeout_seconds=float(run_data.get("turn_timeout_seconds", 180)),
            write_raw_events=bool(run_data.get("write_raw_events", False)),
        ),
        models=[_parse_model(item) for item in _list(data, "models")],
        defaults=DefaultsConfig(
            allowed_tools=[str(item) for item in defaults_data.get("allowed_tools", [])],
            interrupt_on=_mapping(defaults_data.get("interrupt_on"), "defaults.interrupt_on"),
            auto_resume=_parse_auto_resume(defaults_data.get("auto_resume")),
        ),
        conversation=load_conversation(conversation_path),
        rounds_dir=rounds_dir,
    )


def load_rounds(config: HarnessConfig) -> list[HarnessRound]:
    return [load_round(path) for path in sorted(config.rounds_dir.glob("round-*.yaml"))]


def load_round(path: Path) -> HarnessRound:
    data = _load_mapping(path)
    return HarnessRound(
        id=_str(data, "id"),
        title=_str(data, "title"),
        hypothesis=_str(data, "hypothesis"),
        change_reason=_str(data, "change_reason"),
        path=path.resolve(),
        harness_overrides=_mapping(data.get("harness_overrides"), "harness_overrides"),
        input_state=_mapping(data.get("input_state"), "input_state"),
        allowed_tools=_optional_str_list(data.get("allowed_tools")),
        interrupt_on=_optional_mapping(data.get("interrupt_on"), "interrupt_on"),
        auto_resume=_parse_auto_resume(data.get("auto_resume")),
    )


def load_conversation(path: Path) -> Conversation:
    data = _load_mapping(path)
    return Conversation(
        name=_str(data, "name"),
        description=_str(data, "description"),
        path=path.resolve(),
        turns=[_parse_turn(item) for item in _list(data, "turns")],
    )


def _parse_server(data: dict[str, Any]) -> ServerConfig:
    return ServerConfig(
        base_url=_str(data, "base_url").rstrip("/"),
        timeout_seconds=float(data.get("timeout_seconds", 300)),
        runtime_env={
            str(key): str(value)
            for key, value in _mapping(data.get("runtime_env"), "server.runtime_env").items()
        },
    )


def _parse_model(data: Any) -> ModelConfig:
    mapping = _mapping(data, "model")
    return ModelConfig(
        name=_str(mapping, "name"),
        model=_str(mapping, "model"),
        reasoning_effort=_str(mapping, "reasoning_effort"),
    )


def _parse_turn(data: Any) -> ConversationTurn:
    mapping = _mapping(data, "turn")
    expectations = _mapping(mapping.get("expectations"), "turn.expectations")
    return ConversationTurn(
        id=_str(mapping, "id"),
        prompt=_str(mapping, "prompt").strip(),
        expectations=TurnExpectation(
            require_tool=_optional_str(expectations.get("require_tool")),
            min_tool_calls=_optional_int(expectations.get("min_tool_calls")),
            max_tool_calls=_optional_int(expectations.get("max_tool_calls")),
            min_chart_blocks=_optional_int(expectations.get("min_chart_blocks")),
            require_source_signal=bool(expectations.get("require_source_signal", False)),
            require_report_sections=bool(expectations.get("require_report_sections", False)),
            require_artifact_policy=bool(expectations.get("require_artifact_policy", False)),
            forbid_internal_type_names=bool(
                expectations.get("forbid_internal_type_names", False)
            ),
        ),
    )


def _parse_auto_resume(data: Any) -> AutoResumeConfig | None:
    if data is None or data is False:
        return None
    mapping = _mapping(data, "auto_resume")
    decision = str(mapping.get("decision", "respond"))
    if decision not in {"approve", "reject", "respond"}:
        raise ValueError("auto_resume.decision must be approve, reject, or respond")
    return AutoResumeConfig(
        decision=decision,  # type: ignore[arg-type]
        message=_optional_str(mapping.get("message")),
    )


def _load_mapping(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle) or {}
    return _mapping(loaded, str(path))


def _mapping(value: Any, label: str) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise TypeError(f"{label} must be a mapping")
    return {str(key): item for key, item in value.items()}


def _optional_mapping(value: Any, label: str) -> dict[str, Any] | None:
    if value is None:
        return None
    return _mapping(value, label)


def _list(mapping: dict[str, Any], key: str) -> list[Any]:
    value = mapping.get(key)
    if not isinstance(value, list):
        raise ValueError(f"{key} must be a list")
    return value


def _str(mapping: dict[str, Any], key: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be a non-empty string")
    return value


def _optional_str(value: Any) -> str | None:
    return value if isinstance(value, str) and value else None


def _optional_int(value: Any) -> int | None:
    return int(value) if value is not None else None


def _optional_str_list(value: Any) -> list[str] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        raise TypeError("expected a list of strings")
    return [str(item) for item in value]


def _resolve(root_dir: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root_dir / path
