from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Literal


@dataclass(frozen=True, slots=True)
class ServerConfig:
    base_url: str
    timeout_seconds: float
    runtime_env: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RunConfig:
    repetitions: int
    results_dir: Path
    workdir: Path
    per_model_concurrency: int
    parallel_models: bool
    turn_timeout_seconds: float
    write_raw_events: bool


@dataclass(frozen=True, slots=True)
class ModelConfig:
    name: str
    model: str
    reasoning_effort: str


@dataclass(frozen=True, slots=True)
class AutoResumeConfig:
    decision: Literal["approve", "reject", "respond"]
    message: str | None = None


@dataclass(frozen=True, slots=True)
class DefaultsConfig:
    allowed_tools: list[str]
    interrupt_on: dict[str, Any]
    auto_resume: AutoResumeConfig | None


@dataclass(frozen=True, slots=True)
class TurnExpectation:
    require_tool: str | None = None
    min_tool_calls: int | None = None
    max_tool_calls: int | None = None
    min_chart_blocks: int | None = None
    require_source_signal: bool = False
    require_report_sections: bool = False
    require_artifact_policy: bool = False
    forbid_internal_type_names: bool = False


@dataclass(frozen=True, slots=True)
class ConversationTurn:
    id: str
    prompt: str
    expectations: TurnExpectation


@dataclass(frozen=True, slots=True)
class Conversation:
    name: str
    description: str
    path: Path
    turns: list[ConversationTurn]


@dataclass(frozen=True, slots=True)
class HarnessRound:
    id: str
    title: str
    hypothesis: str
    change_reason: str
    path: Path
    harness_overrides: dict[str, Any] = field(default_factory=dict)
    input_state: dict[str, Any] = field(default_factory=dict)
    allowed_tools: list[str] | None = None
    interrupt_on: dict[str, Any] | None = None
    auto_resume: AutoResumeConfig | None = None


@dataclass(frozen=True, slots=True)
class HarnessConfig:
    path: Path
    root_dir: Path
    server: ServerConfig
    run: RunConfig
    models: list[ModelConfig]
    defaults: DefaultsConfig
    conversation: Conversation
    rounds_dir: Path


@dataclass(frozen=True, slots=True)
class StreamRecord:
    event: str
    data: dict[str, Any]
    raw: str


@dataclass(slots=True)
class TurnResult:
    turn_id: str
    prompt: str
    thread_id: str
    events: list[StreamRecord]
    resume_events: list[StreamRecord] = field(default_factory=list)
    started_at: datetime | None = None
    ended_at: datetime | None = None

    @property
    def all_events(self) -> list[StreamRecord]:
        return [*self.events, *self.resume_events]


@dataclass(slots=True)
class TrialResult:
    round_id: str
    model_name: str
    model: str
    attempt: int
    started_at: datetime
    ended_at: datetime
    status: Literal["completed", "failed"]
    turns: list[TurnResult]
    errors: list[str] = field(default_factory=list)
