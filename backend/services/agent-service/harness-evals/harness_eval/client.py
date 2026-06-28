from __future__ import annotations

import asyncio
from typing import Any

import httpx

from harness_eval.models import ServerConfig, StreamRecord
from harness_eval.sse import SseParser, is_terminal_protocol_event

PROTOCOL_V2_CHANNELS = [
    "values",
    "messages",
    "tools",
    "input",
    "lifecycle",
    "updates",
]


class AgentServerClient:
    def __init__(self, server: ServerConfig) -> None:
        self._client = httpx.AsyncClient(
            base_url=server.base_url,
            timeout=server.timeout_seconds,
        )
        self._last_seq_by_thread: dict[str, int] = {}

    async def aclose(self) -> None:
        await self._client.aclose()

    async def create_thread(self) -> str:
        response = await self._client.post(
            "/threads",
            headers=self._headers(accept="application/json"),
            json={},
        )
        response.raise_for_status()
        return str(response.json()["thread_id"])

    async def stream_run(self, *, thread_id: str, payload: dict[str, Any]) -> list[StreamRecord]:
        return await self._stream_command(
            thread_id=thread_id,
            command=self._build_run_start_command(payload),
        )

    async def stream_response(
        self,
        *,
        thread_id: str,
        interrupt_id: str,
        namespace: list[str],
        response_value: dict[str, Any],
        context: dict[str, Any],
    ) -> list[StreamRecord]:
        return await self._stream_command(
            thread_id=thread_id,
            command={
                "id": 2,
                "method": "input.respond",
                "params": {
                    "namespace": namespace,
                    "interrupt_id": interrupt_id,
                    "response": response_value,
                    "config": {"configurable": context},
                },
            },
        )

    async def _stream_command(
        self,
        *,
        thread_id: str,
        command: dict[str, Any],
    ) -> list[StreamRecord]:
        parser = SseParser()
        records: list[StreamRecord] = []

        async with self._client.stream(
            "POST",
            f"/threads/{thread_id}/stream/events",
            headers=self._headers(accept="text/event-stream"),
            json={
                "channels": PROTOCOL_V2_CHANNELS,
                "namespaces": [[]],
                "depth": 20,
                "since": self._last_seq_by_thread.get(thread_id, 0),
            },
        ) as response:
            response.raise_for_status()
            command_task = asyncio.create_task(
                self._send_command(thread_id=thread_id, command=command)
            )
            async for chunk in response.aiter_text():
                parsed = parser.feed(chunk)
                records.extend(parsed)
                self._advance_cursor(thread_id, parsed)
                if any(is_terminal_protocol_event(record) for record in records):
                    break
            await command_task

        flushed = parser.flush()
        records.extend(flushed)
        self._advance_cursor(thread_id, flushed)
        return records

    async def _send_command(self, *, thread_id: str, command: dict[str, Any]) -> None:
        response = await self._client.post(
            f"/threads/{thread_id}/commands",
            headers=self._headers(accept="application/json"),
            json=command,
        )
        response.raise_for_status()

    def _advance_cursor(self, thread_id: str, records: list[StreamRecord]) -> None:
        latest = self._last_seq_by_thread.get(thread_id, 0)
        for record in records:
            seq = record.data.get("seq")
            if isinstance(seq, int):
                latest = max(latest, seq)
        self._last_seq_by_thread[thread_id] = latest

    def _build_run_start_command(self, payload: dict[str, Any]) -> dict[str, Any]:
        params: dict[str, Any] = {
            "assistant_id": payload.get("assistant_id", "chat"),
            "input": payload.get("input"),
        }
        context = payload.get("context")
        if isinstance(context, dict):
            params["config"] = {"configurable": context}
        return {"id": 1, "method": "run.start", "params": params}

    @staticmethod
    def _headers(*, accept: str) -> dict[str, str]:
        return {
            "accept": accept,
            "content-type": "application/json",
            "x-supabase-api-version": "2024-10-01",
        }
