from __future__ import annotations

import json
import re
from typing import Any

from harness_eval.models import StreamRecord


class SseParser:
    def __init__(self) -> None:
        self._buffer = ""

    def feed(self, chunk: str) -> list[StreamRecord]:
        self._buffer += chunk
        self._buffer = self._buffer.replace("\r\n", "\n")
        records: list[StreamRecord] = []
        while "\n\n" in self._buffer:
            raw, self._buffer = self._buffer.split("\n\n", 1)
            if raw.strip():
                record = parse_sse_frame(raw + "\n\n")
                if record is not None:
                    records.append(record)
        return records

    def flush(self) -> list[StreamRecord]:
        if not self._buffer.strip():
            self._buffer = ""
            return []
        raw = self._buffer
        self._buffer = ""
        record = parse_sse_frame(raw)
        return [record] if record is not None else []


def parse_sse_frame(raw: str) -> StreamRecord | None:
    event = "message"
    data_lines: list[str] = []
    has_event = False
    for line in raw.splitlines():
        if line.startswith("event:"):
            has_event = True
            event = line.split(":", 1)[1].strip()
        elif line.startswith("data:"):
            data_lines.append(line.split(":", 1)[1].lstrip())
    if not has_event and not data_lines:
        return None

    data_text = "\n".join(data_lines)
    if not data_text:
        return StreamRecord(event=event, data={}, raw=raw)
    loaded = json.loads(data_text)
    data = loaded if isinstance(loaded, dict) else {"value": loaded}
    return StreamRecord(event=event, data=data, raw=raw)


def collect_model_text(events: list[StreamRecord]) -> str:
    chunks: list[str] = []
    for event in events:
        text = _extract_protocol_v2_message_text(event)
        if text:
            chunks.append(text)
    return "".join(chunks).strip()


def collect_tool_calls(events: list[StreamRecord]) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for event in events:
        tool_call = protocol_v2_tool_call(event)
        if tool_call is None:
            continue
        name, args = tool_call
        key = (name, json.dumps(args, ensure_ascii=False, sort_keys=True))
        if key in seen:
            continue
        seen.add(key)
        calls.append({"name": name, "args": args})
    return calls


def collect_tool_events(events: list[StreamRecord]) -> list[dict[str, Any]]:
    tool_events: list[dict[str, Any]] = []
    for event in events:
        if event.event != "tools":
            continue
        data = _protocol_data(event)
        if data:
            tool_events.append(data)
    return tool_events


def collect_tool_errors(events: list[StreamRecord]) -> list[str]:
    errors: list[str] = []
    for event in events:
        data = _protocol_data(event)
        if not data:
            continue
        status = data.get("status")
        event_name = data.get("event")
        if status == "error" or event_name in {"tool-error", "tool-failed"}:
            errors.append(json.dumps(data, ensure_ascii=False, default=str))
    text = collect_model_text(events)
    if "도구 실행 실패" in text or "tool" in text.lower() and "fail" in text.lower():
        errors.append("final_text_reports_tool_failure")
    return errors


def collect_text_before_first_tool(events: list[StreamRecord]) -> str:
    chunks: list[str] = []
    for event in events:
        if protocol_v2_tool_call(event) is not None:
            break
        text = _extract_protocol_v2_message_text(event)
        if text:
            chunks.append(text)
    return "".join(chunks).strip()


def terminal_lifecycle_status(events: list[StreamRecord]) -> str | None:
    for event in reversed(events):
        if not is_terminal_protocol_event(event):
            continue
        data = _protocol_data(event)
        return str(data.get("event")) if data else None
    return None


def interrupt_requests(events: list[StreamRecord]) -> list[dict[str, Any]]:
    requests: list[dict[str, Any]] = []
    for event in events:
        if event.event != "input.requested":
            continue
        params = event.data.get("params", {})
        data = params.get("data", {}) if isinstance(params, dict) else {}
        payload = data.get("payload") if isinstance(data, dict) else None
        interrupt_id = data.get("interrupt_id") if isinstance(data, dict) else None
        namespace = params.get("namespace", []) if isinstance(params, dict) else []
        if isinstance(payload, dict) and isinstance(interrupt_id, str):
            requests.append(
                {
                    "interrupt_id": interrupt_id,
                    "namespace": namespace if isinstance(namespace, list) else [],
                    "value": payload,
                }
            )
    return requests


def is_terminal_protocol_event(event: StreamRecord) -> bool:
    if event.event != "lifecycle":
        return False
    data = _protocol_data(event)
    return data.get("event") in {"completed", "failed", "interrupted"} if data else False


def protocol_v2_tool_started(event: StreamRecord) -> tuple[str, dict[str, Any]] | None:
    if event.event != "tools":
        return None
    data = _protocol_data(event)
    if not data or data.get("event") != "tool-started":
        return None
    name = data.get("tool_name")
    args = data.get("input", {})
    if not isinstance(name, str):
        return None
    return name, args if isinstance(args, dict) else {}


def protocol_v2_tool_call(event: StreamRecord) -> tuple[str, dict[str, Any]] | None:
    started = protocol_v2_tool_started(event)
    if started is not None:
        return started
    if event.event != "messages":
        return None
    data = _protocol_data(event)
    if not data or data.get("event") != "content-block-finish":
        return None
    content = data.get("content", {})
    if not isinstance(content, dict) or content.get("type") not in {"tool_call", "tool_use"}:
        return None
    name = content.get("name")
    args = content.get("args", content.get("input", {}))
    if not isinstance(name, str):
        return None
    return name, args if isinstance(args, dict) else {}


def chart_blocks(text: str) -> list[str]:
    return [
        match.group(1).strip()
        for match in re.finditer(r"```chart\s*(.*?)```", text, re.IGNORECASE | re.DOTALL)
    ]


def valid_chart_count(text: str) -> int:
    return sum(1 for block in chart_blocks(text) if _is_valid_chart_json(block))


def _is_valid_chart_json(block: str) -> bool:
    try:
        value = json.loads(block)
    except json.JSONDecodeError:
        return False
    if not isinstance(value, dict):
        return False
    chart_type = value.get("type")
    data = value.get("data")
    if chart_type in {"bar", "line"}:
        return (
            isinstance(value.get("title"), str)
            and isinstance(value.get("xKey"), str)
            and isinstance(value.get("series"), list)
            and _series_keys_exist(value.get("series"), data)
        )
    if chart_type == "pie":
        data_key = value.get("dataKey")
        return (
            isinstance(value.get("title"), str)
            and isinstance(value.get("nameKey"), str)
            and isinstance(data_key, str)
            and isinstance(data, list)
            and all(isinstance(row, dict) and isinstance(row.get(data_key), int | float) for row in data)
        )
    return False


def _series_keys_exist(series: Any, data: Any) -> bool:
    if not isinstance(series, list) or not series or not isinstance(data, list) or not data:
        return False
    keys = [item.get("key") for item in series if isinstance(item, dict)]
    if not keys or not all(isinstance(key, str) for key in keys):
        return False
    return all(
        isinstance(row, dict) and all(isinstance(row.get(key), int | float) for key in keys)
        for row in data
    )


def _extract_protocol_v2_message_text(event: StreamRecord) -> str:
    if event.event != "messages":
        return ""
    data = _protocol_data(event)
    if not data or data.get("event") != "content-block-delta":
        return ""
    delta = data.get("delta", {})
    if not isinstance(delta, dict) or delta.get("type") != "text-delta":
        return ""
    text = delta.get("text")
    return text if isinstance(text, str) else ""


def _protocol_data(event: StreamRecord) -> dict[str, Any]:
    params = event.data.get("params", {})
    data = params.get("data", {}) if isinstance(params, dict) else {}
    return data if isinstance(data, dict) else {}
