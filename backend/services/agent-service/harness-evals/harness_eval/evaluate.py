from __future__ import annotations

import re
from dataclasses import dataclass

from harness_eval.models import ConversationTurn, StreamRecord
from harness_eval.sse import (
    chart_blocks,
    collect_model_text,
    collect_text_before_first_tool,
    collect_tool_calls,
    collect_tool_errors,
    terminal_lifecycle_status,
    valid_chart_count,
)


INTERNAL_TYPE_PATTERN = re.compile(
    r"(<\|?\s*DSML|DSML|"
    r"\b(commercial_report|search_report|research_report|markdown|code)\b|"
    r"\b(artifact|document)_(get|create|update|delete|search|read|save_as_document)\b|"
    r"\b(memory|onboarding|web)_(search|create|update|delete|read|fetch|get_default_profile|get_survey_result|get_area_recommendations)\b|"
    r"\bArtifact\b|\bDocument\b)"
)
SOURCE_PATTERN = re.compile(
    r"(https?://|www\.|[A-Za-z0-9.-]+\.(kr|com|org|net)|출처\s*[:：]|근거/출처)"
)
REPORT_PATTERN = re.compile(r"(상권|수요|고객|경쟁|입지|리스크|비용|다음|액션|판단)")
ARTIFACT_POLICY_PATTERN = re.compile(r"(보고서|검색 결과|자료|문서|아티팩트|노트|체크리스트|저장)")


@dataclass(frozen=True, slots=True)
class TurnEvaluation:
    passed: bool
    checks: dict[str, bool]
    metrics: dict[str, int | bool | str | None]


def evaluate_turn(turn: ConversationTurn, events: list[StreamRecord]) -> TurnEvaluation:
    text = collect_model_text(events)
    tool_calls = collect_tool_calls(events)
    tool_errors = collect_tool_errors(events)
    expectations = turn.expectations
    checks: dict[str, bool] = {
        "run_completed": terminal_lifecycle_status(events) == "completed",
        "no_tool_errors": not tool_errors,
        "non_empty_response": bool(text.strip()),
    }

    if expectations.require_tool is not None:
        checks[f"tool_called:{expectations.require_tool}"] = any(
            call["name"] == expectations.require_tool for call in tool_calls
        )
    if expectations.min_tool_calls is not None:
        checks["min_tool_calls"] = len(tool_calls) >= expectations.min_tool_calls
    if expectations.max_tool_calls is not None:
        checks["max_tool_calls"] = len(tool_calls) <= expectations.max_tool_calls
    if expectations.min_chart_blocks is not None:
        checks["min_valid_chart_blocks"] = valid_chart_count(text) >= expectations.min_chart_blocks
    if expectations.require_source_signal:
        checks["source_signal"] = SOURCE_PATTERN.search(text) is not None
    if expectations.require_report_sections:
        checks["report_sections"] = REPORT_PATTERN.search(text) is not None
    if expectations.require_artifact_policy:
        checks["artifact_policy"] = ARTIFACT_POLICY_PATTERN.search(text) is not None
    if expectations.forbid_internal_type_names:
        checks["no_internal_type_names"] = INTERNAL_TYPE_PATTERN.search(text) is None

    return TurnEvaluation(
        passed=all(checks.values()),
        checks=checks,
        metrics={
            "final_text_length": len(text),
            "tool_call_count": len(tool_calls),
            "tool_error_count": len(tool_errors),
            "chart_block_count": len(chart_blocks(text)),
            "valid_chart_count": valid_chart_count(text),
            "has_midturn_before_tool": bool(collect_text_before_first_tool(events)),
            "terminal_status": terminal_lifecycle_status(events),
        },
    )


def trial_score(turn_evaluations: list[TurnEvaluation]) -> float:
    checks = [value for evaluation in turn_evaluations for value in evaluation.checks.values()]
    return sum(1 for value in checks if value) / len(checks) if checks else 0.0
