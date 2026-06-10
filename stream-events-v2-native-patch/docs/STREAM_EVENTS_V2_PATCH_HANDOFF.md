# Stream Events V2 Native 전환 패치 인수인계서

## 1. 목적

이 패치는 직전 커밋에서 추가된 LangGraph `tools` stream mode validator 몽키패치를 제거하고, 클라이언트와 서버를 Agent Server native Stream Events V2 계약으로 맞추기 위한 한 번짜리 적용 패치입니다.

핵심 방향은 다음과 같습니다.

- `backend/services/agent-service/sitecustomize.py` 제거
- Docker/Compose의 패치 로딩 환경변수 제거
- 클라이언트 `streamMode`를 단일 상수로 고정
- HITL `resume`에서도 최초 submit과 동일한 full context 전달
- 서버 model node에서 context 누락 시 모델 카드 기본값으로 방어
- 패치 제거 후 `tools` stream mode가 native validator를 통과하는지 테스트 게이트 추가

## 2. 근거 URL

- LangGraph Agent Server stream endpoint는 `context`, `stream_mode`, `stream_resumable`을 run body로 받음  
  https://docs.langchain.com/langsmith/agent-server-api/thread-runs/create-run-stream-output
- Agent Server streaming 문서에서 여러 stream mode를 배열로 전달 가능  
  https://docs.langchain.com/langsmith/streaming#stream-multiple-modes
- `messages-tuple`은 LLM token과 metadata tuple을 stream하는 공식 token mode  
  https://docs.langchain.com/langsmith/streaming#llm-tokens
- LangGraph Python stream v2는 여러 mode를 `StreamPart`로 구분  
  https://docs.langchain.com/oss/python/langgraph/streaming#multiple-modes-at-once
- LangGraph JS도 여러 stream mode 배열을 지원  
  https://docs.langchain.com/oss/javascript/langgraph/streaming#multiple-modes-at-once
- `Runtime.context`는 run-scoped static context를 node에 주입  
  https://reference.langchain.com/python/langgraph/runtime/Runtime
- `StateGraph.context_schema`는 node에서 사용할 immutable context schema  
  https://reference.langchain.com/python/langgraph/graph/state/StateGraph
- interrupt 후 resume은 `Command(resume=...)`로 이어감  
  https://docs.langchain.com/oss/python/langgraph/interrupts#resuming-interrupts
- `langgraph-api==0.9.0` validator가 `tools/lifecycle`을 거부하는 upstream issue  
  https://github.com/langchain-ai/langgraph/issues/7986
- LangGraph CLI는 Agent Server local/dev 실행 도구  
  https://docs.langchain.com/langsmith/cli

## 3. 생성/수정/삭제 파일

### 삭제

```text
backend/services/agent-service/sitecustomize.py
```

삭제 이유:

- `jsonschema_rs.validator_for`를 런타임에서 바꾸는 monkey patch였음
- Stream Events V2 전환 후에는 서버 의존성 자체가 `tools` stream mode를 받아야 함
- 삭제 후에도 `tools`가 422 없이 통과하는지는 추가 테스트로 검증

### 수정

```text
backend/services/agent-service/Dockerfile
```

수정 내용:

- `PYTHONPATH=/app` 제거
- `COPY sitecustomize.py ./sitecustomize.py` 제거

```text
docker-compose.yml
```

수정 내용:

- `PYTHONPATH=/app` 제거
- `PATCH_LANGGRAPH_STREAM_MODES=true` 제거

```text
frontend/src/features/llm-chat/lib/langgraph/build-submit-config.ts
```

수정 내용:

- stream mode 배열을 직접 들고 있지 않고 `CHAT_STREAM_MODES`를 재사용

```text
frontend/src/features/llm-chat/hooks/langgraph-chat-stream-provider.tsx
```

수정 내용:

- `resume()` 시에도 `buildSubmitContext(modelSelection, toolPolicy)`를 사용
- interrupt 이후 `tools -> chat_model`로 돌아가는 경우 `model`, `reasoning_effort` 누락 방지

```text
backend/services/agent-service/src/agent/services/chat/context.py
```

수정 내용:

- `resolve_chat_model_context()` 추가
- context 누락 시 모델 카탈로그 첫 번째 모델 사용
- reasoning effort 누락 시 선택 모델 카드의 기본 effort 사용

```text
backend/services/agent-service/src/agent/services/chat/nodes.py
```

수정 내용:

- `runtime.context["model"]` 직접 접근 대신 `resolve_chat_model_context(runtime.context)` 사용

### 생성

```text
frontend/src/features/llm-chat/lib/langgraph/stream-modes.ts
```

역할:

- Stream Events V2 mode를 한 곳에서 관리
- 현재 조합: `values`, `messages-tuple`, `tools`, `updates`

```text
backend/services/agent-service/tests/unit_tests/test_chat_runtime_context.py
```

역할:

- 서버 context 기본값 보정 로직 검증

```text
backend/services/agent-service/tests/unit_tests/test_stream_mode_contract.py
```

역할:

- `sitecustomize.py` 제거 확인
- `langgraph_api`가 설치된 환경에서 `tools` stream mode validator 통과 여부 검증

```text
docs/STREAM_EVENTS_V2_PATCH_HANDOFF.md
```

역할:

- 이 인수인계 문서

```text
APPLY_STREAM_EVENTS_V2_PATCH.sh
DELETE_FILES.txt
PATCH_FILE_LIST.txt
```

역할:

- 패치 적용 보조 스크립트 및 파일 목록

## 4. 인수자가 적용하는 방법

### 방법 A: 패치 zip을 repo root에 직접 덮어쓰기

1. 이 zip을 저장소 root에 압축 해제합니다.
2. 아래 파일을 삭제합니다.

```bash
rm -f backend/services/agent-service/sitecustomize.py
```

3. 의존성 갱신 후 검증합니다.

```bash
cd backend/services/agent-service
uv sync
uv run pytest tests/unit_tests/test_chat_runtime_context.py tests/unit_tests/test_stream_mode_contract.py
```

```bash
cd frontend
npm install
npm run typecheck
npm run lint
```

### 방법 B: apply script 사용

패치 zip을 별도 디렉터리에 푼 뒤 저장소 root를 인자로 넘깁니다.

```bash
./APPLY_STREAM_EVENTS_V2_PATCH.sh /path/to/repo
```

스크립트는 수정/생성 파일을 복사하고, `DELETE_FILES.txt`에 적힌 삭제 대상 파일을 제거합니다.

## 5. 내가 검증한 것

이 환경에서 실제로 검증한 내용입니다.

```bash
PYTHONPATH=backend/services/agent-service/src \
pytest -q \
  backend/services/agent-service/tests/unit_tests/test_chat_runtime_context.py \
  backend/services/agent-service/tests/unit_tests/test_stream_mode_contract.py
```

결과:

```text
4 passed, 1 skipped
```

설명:

- context 기본값 보정 테스트 3개 통과
- `sitecustomize.py` 제거 테스트 1개 통과
- `langgraph_api` validator native `tools` mode 테스트 1개는 이 샌드박스에 `langgraph_api`가 설치되어 있지 않아 skip

추가 정적 검증:

```bash
python -m py_compile \
  backend/services/agent-service/src/agent/services/chat/context.py \
  backend/services/agent-service/src/agent/services/chat/nodes.py \
  backend/services/agent-service/tests/unit_tests/test_chat_runtime_context.py \
  backend/services/agent-service/tests/unit_tests/test_stream_mode_contract.py
```

결과: 통과

TypeScript syntax-only 검증:

```bash
node <typescript.transpileModule 기반 syntax check>
```

대상:

```text
frontend/src/features/llm-chat/lib/langgraph/stream-modes.ts
frontend/src/features/llm-chat/lib/langgraph/build-submit-config.ts
frontend/src/features/llm-chat/hooks/langgraph-chat-stream-provider.tsx
```

결과: syntax ok

패치 제거 grep 검증:

```bash
grep -R "PATCH_LANGGRAPH_STREAM_MODES\|jsonschema_rs.validator_for\|langgraph-patch" \
  backend docker-compose.yml frontend
```

결과: 런타임 코드/설정에는 없음

## 6. 남은 검증

내 샌드박스에는 `langgraph_api`, `@langchain/langgraph-sdk`, Next 의존성, 실제 Ollama/Google/OpenRouter 키, Docker daemon이 없어서 아래는 실제 개발 환경에서 마무리 검증해야 합니다.

### 필수 런타임 검증

1. `langgraph-api` native validator 확인

```bash
cd backend/services/agent-service
uv sync
uv run pytest tests/unit_tests/test_stream_mode_contract.py
```

이 테스트가 실패하면 아직 upstream native `tools` stream mode가 통과하지 않는 환경입니다. 이 경우 `sitecustomize.py`를 되살리는 것이 아니라, `langgraph-api`/`langgraph-cli`를 `tools` validator가 고쳐진 버전으로 올려야 합니다.

2. Agent Server stream 직접 검증

```bash
curl -N \
  -H "content-type: application/json" \
  -H "accept: text/event-stream" \
  -H "authorization: Bearer <JWT>" \
  -d '{
    "assistant_id": "chat",
    "input": {"messages": [{"type": "human", "content": "1+2 계산해줘"}]},
    "context": {
      "model": "gpt-oss:120b",
      "reasoning_effort": "medium",
      "allowed_tools": ["add"],
      "interrupt_on": {}
    },
    "stream_mode": ["values", "messages-tuple", "tools", "updates"],
    "stream_resumable": true
  }' \
  http://localhost:2024/threads/<THREAD_ID>/runs/stream
```

통과 기준:

- HTTP 200
- `text/event-stream`
- 422 없음
- message token event 도착
- tool event 또는 toolProgress projection 가능

3. 프론트 타입 검증

```bash
cd frontend
npm install
npm run typecheck
npm run lint
```

4. 브라우저 E2E 검증

- 일반 답변 token streaming
- calculator tool 호출 시 `stream.toolProgress` 표시
- 승인 필요한 tool 호출 시 `stream.interrupts` 표시
- approve/reject/respond/edit resume 후 최종 답변 표시
- resume 후 모델이 바뀌거나 reasoning effort가 누락되지 않는지 확인

5. Docker/Nginx 검증

```bash
docker compose build agent-service
docker compose up agent-service nginx frontend
```

- `agent-service` 로그에 `[langgraph-patch]`가 절대 나오지 않아야 함
- `curl -N`으로 chunk가 마지막에 몰리지 않는지 확인
- Nginx `proxy_buffering off` 유지 확인

## 7. 아키텍처 최종 상태

```text
Client useStream
  -> /api/proxy/agent BFF
    -> LangGraph Agent Server native /runs/stream
      -> StateGraph(ChatState, context_schema=ChatRuntimeContext)
        -> call_chat_model
          -> resolve_chat_model_context
          -> get_chat_model
          -> FallbackChatModel
          -> provider route
        -> approval_gate / tools / resume
```

이 패치 이후에는 stream event를 직접 변환하는 custom adapter나 validator monkey patch가 없습니다. 클라이언트는 SDK projection을 사용하고, 서버는 native Agent Server stream contract를 그대로 받습니다.
