from pathlib import Path

from harness_eval.evaluate import evaluate_turn
from harness_eval.models import ConversationTurn, StreamRecord, TurnExpectation
from harness_eval.runner import dump_runtime_plan
from harness_eval.config import load_config
from harness_eval.sse import SseParser, collect_model_text, collect_tool_calls

HARNESS_EVAL_ROOT = Path(__file__).resolve().parents[2] / "harness-evals"


def protocol_event(event: str, data: dict) -> StreamRecord:
    return StreamRecord(event=event, data={"params": {"namespace": [], "data": data}}, raw="")


def test_harness_sse_parser_collects_text_and_tool_calls() -> None:
    """하네스 eval은 Protocol V2 텍스트와 도구 호출을 독립적으로 추출한다."""

    events = [
        protocol_event(
            "messages",
            {
                "event": "content-block-delta",
                "delta": {"type": "text-delta", "text": "검색해볼게요."},
            },
        ),
        protocol_event(
            "messages",
            {
                "event": "content-block-finish",
                "content": {"type": "tool_call", "name": "web_search", "args": {"query": "성수"}},
            },
        ),
    ]

    assert collect_model_text(events) == "검색해볼게요."
    assert collect_tool_calls(events) == [{"name": "web_search", "args": {"query": "성수"}}]


def test_harness_sse_parser_handles_split_frames() -> None:
    """SSE frame이 chunk 사이에서 잘려도 하나의 이벤트로 복원한다."""

    parser = SseParser()

    assert parser.feed('event: messages\ndata: {"params":') == []
    events = parser.feed(' {"data": {"event": "x"}}}\n\n')

    assert len(events) == 1
    assert events[0].event == "messages"


def test_harness_turn_evaluation_uses_control_expectations() -> None:
    """통제변수의 기대 조건으로 턴별 정량 체크를 만든다."""

    turn = ConversationTurn(
        id="trend_probe",
        prompt="검색해줘",
        expectations=TurnExpectation(require_tool="web_search", min_tool_calls=1),
    )
    events = [
        protocol_event(
            "messages",
            {
                "event": "content-block-delta",
                "delta": {"type": "text-delta", "text": "검색 결과를 확인했습니다."},
            },
        ),
        protocol_event(
            "messages",
            {
                "event": "content-block-finish",
                "content": {"type": "tool_call", "name": "web_search", "args": {}},
            },
        ),
        protocol_event("lifecycle", {"event": "completed"}),
    ]

    evaluation = evaluate_turn(turn, events)

    assert evaluation.passed
    assert evaluation.checks["tool_called:web_search"]
    assert evaluation.checks["non_empty_response"]


def test_harness_turn_evaluation_rejects_empty_visible_response() -> None:
    """빈 최종 응답은 run이 완료되어도 품질 실패로 본다."""

    turn = ConversationTurn(
        id="artifact_policy",
        prompt="짧게 정리해줘",
        expectations=TurnExpectation(),
    )
    events = [protocol_event("lifecycle", {"event": "completed"})]

    evaluation = evaluate_turn(turn, events)

    assert not evaluation.passed
    assert not evaluation.checks["non_empty_response"]


def test_harness_turn_evaluation_rejects_internal_tool_markup() -> None:
    """사용자 화면에 도구 DSL이나 내부 tool명이 보이면 실패로 본다."""

    turn = ConversationTurn(
        id="artifact_policy",
        prompt="기술적인 말 말고 알려줘",
        expectations=TurnExpectation(forbid_internal_type_names=True),
    )
    events = [
        protocol_event(
            "messages",
            {
                "event": "content-block-delta",
                "delta": {
                    "type": "text-delta",
                    "text": "<｜｜DSML｜｜tool_calls> artifact_create document_create",
                },
            },
        ),
        protocol_event("lifecycle", {"event": "completed"}),
    ]

    evaluation = evaluate_turn(turn, events)

    assert not evaluation.passed
    assert not evaluation.checks["no_internal_type_names"]


def test_harness_turn_evaluation_allows_search_unavailable_message() -> None:
    """검색 결과가 비거나 메타서치 한계가 있을 수 있으므로 검색 불가 표현만으로 실패시키지 않는다."""

    turn = ConversationTurn(
        id="trend_probe",
        prompt="요즘 분위기 봐줘",
        expectations=TurnExpectation(require_tool="web_search"),
    )
    events = [
        protocol_event(
            "messages",
            {
                "event": "content-block-finish",
                "content": {"type": "tool_call", "name": "web_search", "args": {}},
            },
        ),
        protocol_event(
            "messages",
            {
                "event": "content-block-delta",
                "delta": {
                    "type": "text-delta",
                    "text": "검색 기능이 원활하지 않아 기존 지식으로 답합니다.",
                },
            },
        ),
        protocol_event("lifecycle", {"event": "completed"}),
    ]

    evaluation = evaluate_turn(turn, events)

    assert evaluation.passed
    assert "no_false_search_unavailable" not in evaluation.checks


def test_harness_runtime_plan_keeps_same_model_sequential() -> None:
    """모델별 반복은 worker 내부 순차 실행으로 계획된다."""

    config = load_config(HARNESS_EVAL_ROOT / "config.yaml")
    plan = dump_runtime_plan(config, "round-01")

    assert '"same_model_concurrency": 1' in plan
    assert '"repetitions_per_model": 3' in plan
    assert '"parallel_models": true' in plan
