from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from harness_eval.client import AgentServerClient
from harness_eval.config import load_rounds
from harness_eval.models import (
    AutoResumeConfig,
    ConversationTurn,
    HarnessConfig,
    HarnessRound,
    ModelConfig,
    StreamRecord,
    TrialResult,
    TurnResult,
)
from harness_eval.report import write_round_results
from harness_eval.sse import interrupt_requests


async def run_selected_rounds(config: HarnessConfig, round_filter: str) -> list[str]:
    rounds = _select_rounds(load_rounds(config), round_filter)
    output_dirs: list[str] = []
    for harness_round in rounds:
        trials = await run_round(config=config, harness_round=harness_round)
        output_dirs.append(str(write_round_results(config=config, harness_round=harness_round, trials=trials)))
    return output_dirs


async def run_round(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
) -> list[TrialResult]:
    if config.run.parallel_models:
        tasks = [
            asyncio.create_task(
                _run_model_attempts(
                    config=config,
                    harness_round=harness_round,
                    model=model,
                )
            )
            for model in config.models
        ]
        grouped = await asyncio.gather(*tasks)
    else:
        grouped = []
        for model in config.models:
            grouped.append(
                await _run_model_attempts(
                    config=config,
                    harness_round=harness_round,
                    model=model,
                )
            )
    return [trial for group in grouped for trial in group]


async def _run_model_attempts(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
    model: ModelConfig,
) -> list[TrialResult]:
    results: list[TrialResult] = []
    for attempt in range(1, config.run.repetitions + 1):
        results.append(
            await _run_trial(
                config=config,
                harness_round=harness_round,
                model=model,
                attempt=attempt,
            )
        )
    return results


async def _run_trial(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
    model: ModelConfig,
    attempt: int,
) -> TrialResult:
    started_at = datetime.now(UTC)
    client = AgentServerClient(config.server)
    thread_id: str | None = None
    turn_results: list[TurnResult] = []
    errors: list[str] = []
    try:
        thread_id = await client.create_thread()
        context = _runtime_context(config=config, harness_round=harness_round, model=model)
        for index, turn in enumerate(config.conversation.turns):
            turn_result = await asyncio.wait_for(
                _run_turn(
                    client=client,
                    thread_id=thread_id,
                    context=context,
                    turn=turn,
                    initial_input_state=harness_round.input_state if index == 0 else {},
                    auto_resume=harness_round.auto_resume or config.defaults.auto_resume,
                ),
                timeout=config.run.turn_timeout_seconds,
            )
            turn_results.append(turn_result)
    except Exception as error:
        errors.append(f"{type(error).__name__}: {error}")
    finally:
        await client.aclose()

    return TrialResult(
        round_id=harness_round.id,
        model_name=model.name,
        model=model.model,
        attempt=attempt,
        started_at=started_at,
        ended_at=datetime.now(UTC),
        status="failed" if errors else "completed",
        turns=turn_results,
        errors=errors,
    )


async def _run_turn(
    *,
    client: AgentServerClient,
    thread_id: str,
    context: dict[str, Any],
    turn: ConversationTurn,
    initial_input_state: dict[str, Any],
    auto_resume: AutoResumeConfig | None,
) -> TurnResult:
    started_at = datetime.now(UTC)
    input_payload: dict[str, Any] = {
        "messages": [{"type": "human", "content": turn.prompt}],
        **initial_input_state,
    }
    events = await client.stream_run(
        thread_id=thread_id,
        payload={"input": input_payload, "context": context},
    )
    resume_events: list[StreamRecord] = []
    if auto_resume is not None:
        for request in interrupt_requests(events):
            response = {
                "decisions": [
                    {
                        "type": auto_resume.decision,
                        "message": auto_resume.message,
                    }
                    for _ in request["value"].get("action_requests", [])
                ]
            }
            resume_events.extend(
                await client.stream_response(
                    thread_id=thread_id,
                    interrupt_id=request["interrupt_id"],
                    namespace=request["namespace"],
                    response_value=response,
                    context=context,
                )
            )

    return TurnResult(
        turn_id=turn.id,
        prompt=turn.prompt,
        thread_id=thread_id,
        events=events,
        resume_events=resume_events,
        started_at=started_at,
        ended_at=datetime.now(UTC),
    )


def _runtime_context(
    *,
    config: HarnessConfig,
    harness_round: HarnessRound,
    model: ModelConfig,
) -> dict[str, Any]:
    context: dict[str, Any] = {
        "model": model.model,
        "reasoning_effort": model.reasoning_effort,
        "allowed_tools": harness_round.allowed_tools or config.defaults.allowed_tools,
        "interrupt_on": harness_round.interrupt_on or config.defaults.interrupt_on,
    }
    if harness_round.harness_overrides:
        context["harness_overrides"] = harness_round.harness_overrides
    return context


def _select_rounds(rounds: list[HarnessRound], round_filter: str) -> list[HarnessRound]:
    if round_filter == "all":
        return rounds
    selected = [harness_round for harness_round in rounds if harness_round.id == round_filter]
    if not selected:
        available = ", ".join(harness_round.id for harness_round in rounds)
        raise ValueError(f"Unknown round: {round_filter}. Available: {available}")
    return selected


def dump_runtime_plan(config: HarnessConfig, round_filter: str) -> str:
    rounds = _select_rounds(load_rounds(config), round_filter)
    return json.dumps(
        {
            "rounds": [harness_round.id for harness_round in rounds],
            "models": [model.name for model in config.models],
            "repetitions_per_model": config.run.repetitions,
            "same_model_concurrency": config.run.per_model_concurrency,
            "parallel_models": config.run.parallel_models,
            "turn_timeout_seconds": config.run.turn_timeout_seconds,
        },
        ensure_ascii=False,
        indent=2,
    )
