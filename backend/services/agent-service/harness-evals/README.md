# Harness Evals

`harness-evals`는 채팅 에이전트의 하네스 조합을 평가하는 독립 실행 시스템입니다.
기존 `evals/`를 import하지 않으며, 실제 LangGraph Agent Server의 Protocol V2
`/threads`, `/stream/events`, `/commands` 경로를 호출합니다.

## 평가 대상

사용자 프롬프트는 통제변수로 고정하고, 아래 조합을 독립변수로 둡니다.

- 시스템 프롬프트
- `system_context.py`가 실제로 렌더링하는 `<system_context>` 상태
- 도구 설명
- 도구 allowlist 및 HITL 정책

## 실행

먼저 agent-service 서버를 SQLite 기반 eval 모드로 실행합니다.

```bash
cd backend/services/agent-service
DATABASE_URL=sqlite+aiosqlite:///harness-evals/.workdir/harness.db \
AUTO_CREATE_SCHEMA=true \
FF_V2_EVENT_STREAMING=true \
LANGGRAPH_DISABLE_FILE_PERSISTENCE=true \
uv run langgraph dev --config langgraph.eval.json \
  --no-browser --no-reload --host 127.0.0.1 --port 2024
```

다른 셸에서 평가를 실행합니다.

```bash
cd backend/services/agent-service
uv run python harness-evals/run.py --config harness-evals/config.yaml --round round-01
```

현재 작성된 모든 round를 실행하려면 아래처럼 실행합니다.

```bash
uv run python harness-evals/run.py --config harness-evals/config.yaml --round all
```

## 결과

커밋 대상:

- `results/<round>/manifest.yaml`
- `results/<round>/metrics.json`
- `results/<round>/responses.md`
- `results/<round>/teacher-review.md`
- `results/<round>/trials/*.json`

ignore 대상:

- `.workdir/`
- `results/**/raw-events/`
- `results/**/server.log`
- SQLite DB, cache, 전체 SSE raw stream
