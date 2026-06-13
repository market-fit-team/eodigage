# Semantic Search and LLM Gateway

이 서버는 외부 LLM/Semantic upstream과 통신하여 다음 기능을 제공한다.

- 게시글 semantic index upsert/status update
- 관련 게시글 조회
- LangGraph thread/run 기반 LLM gateway
- LangGraph SSE stream relay
- 사용자별 LLM thread 소유권 저장과 접근 제어

## 구성 요소

| 구성 요소                       | 위치                            | 역할                                      |
| ------------------------------- | ------------------------------- | ----------------------------------------- |
| `RelatedPostsController`        | `api/semantic`                  | 관련 게시글 API                           |
| `RelatedPostsQueryService`      | `application/semantic`          | 관련 게시글 조회 orchestration            |
| `PostSemanticSyncService`       | `application/semantic`          | semantic index sync 처리                  |
| `PostSemanticSyncEventListener` | `application/semantic`          | post 변경 이벤트 수신                     |
| `PostSemanticSyncEvent`         | `core/semantic/event`           | semantic sync event                       |
| `PostSemanticIndexClient`       | `infrastructure/http/semantic`  | semantic upstream HTTP client             |
| `PostSemanticDocumentFactory`   | `infrastructure/http/semantic`  | index document 구성                       |
| `RelatedPostsCacheRepository`   | `infrastructure/cache/semantic` | Redis cache                               |
| `LlmGatewayController`          | `api/llm`                       | LangGraph thread/run gateway HTTP API     |
| `LlmGatewayResponseAssembler`   | `api/llm/assembler`             | tools/models 응답 DTO 조립                |
| `LlmGatewayService`             | `application/llm`               | LLM gateway orchestration, owner check    |
| `LlmGatewayUpstreamPort`        | `application/llm/port`          | LangGraph upstream 추상화 포트            |
| `LlmStreamRelay`                | `application/llm/model`         | upstream SSE header/body relay 모델       |
| `LlmThread`                     | `core/llm`                      | 사용자 소유 LangGraph thread entity       |
| `LlmGatewayHttpGateway`         | `infrastructure/http/llm`       | LangGraph upstream port adapter           |
| `LlmGatewayHttpClientSupport`   | `infrastructure/http/llm/client`| base URL, API key, path encoding 지원     |
| `LlmGatewayUpstreamResponseMapper` | `infrastructure/http/llm/mapper` | tools/models upstream 응답 변환        |
| `LlmThreadRepository`           | `infrastructure/persistence/llm`| `llm_threads` JPA repository              |

## 설정

```yaml
llm:
  gateway:
    base-url: ${LLM_GATEWAY_BASE_URL:http://localhost:8000}
    api-key: ${LLM_GATEWAY_API_KEY:}
    semantic-timeout: ${LLM_GATEWAY_SEMANTIC_TIMEOUT:5s}

app:
  post:
    semantic:
      related-default-limit: ${POST_SEMANTIC_RELATED_DEFAULT_LIMIT:10}
      related-max-limit: ${POST_SEMANTIC_RELATED_MAX_LIMIT:20}
      related-cache-ttl: ${POST_SEMANTIC_RELATED_CACHE_TTL:P3D}
```

`llm.gateway.base-url`은 semantic HTTP client와 LangGraph gateway adapter가 함께 사용한다.
LangGraph gateway 요청은 필요하면 `X-API-Key` header를 upstream에 전달한다.

## Semantic Sync 흐름

게시글 생성/수정/삭제 시 `PostCommandService`는 semantic sync event를 발행한다.

```text
PostCommandService
  -> publish PostSemanticSyncEvent(postId, INDEX_UPSERT or STATUS_UPDATE)
     -> PostSemanticSyncEventListener
        -> PostSemanticSyncService
           -> PostSemanticDocumentFactory
           -> PostSemanticIndexClient
              -> LLM/Semantic upstream
```

Event type:

```text
INDEX_UPSERT
STATUS_UPDATE
```

## Related Posts 흐름

```text
GET /api/v1/posts/{postId}/related
  -> RelatedPostsController
     -> RelatedPostsQueryService
        -> RelatedPostsCacheRepository lookup
        -> PostSemanticIndexClient fetch if cache miss
        -> PostQueryService/Repository로 최신 게시글 상태 조합
        -> response
```

## Cache 전략

관련 게시글은 semantic upstream 비용이 큰 작업이므로 Redis cache를 사용한다.

- default limit: 10
- max limit: 20
- TTL: 기본 P3D

주의할 점:

- 게시글이 삭제되었거나 수정된 경우 stale result가 될 수 있다.
- 캐시는 ranking 후보를 저장하고, 응답 조합 시 최신 post 상태를 다시 확인하는 방식이 안전하다.
- cache key는 postId, limit, 모델 버전 등을 고려해야 한다.

## LLM Gateway API

Spring 공개 endpoint는 `/api/v1/llm` 아래에 있고, LangGraph upstream endpoint는 `/api/v1/langgraph` 아래로 relay한다.
Thread/run 계열 request/response body는 `JsonNode`로 받아 upstream Agent Server API shape를 그대로 통과시킨다.

```text
GET  /api/v1/llm/tools
GET  /api/v1/llm/models
POST /api/v1/llm/threads
GET  /api/v1/llm/threads/{threadId}
POST /api/v1/llm/threads/search
GET  /api/v1/llm/threads/{threadId}/state
POST /api/v1/llm/threads/{threadId}/history
POST /api/v1/llm/threads/{threadId}/runs/stream
POST /api/v1/llm/threads/{threadId}/runs/{runId}/cancel?action=interrupt
GET  /api/v1/llm/threads/{threadId}/runs/{runId}/stream
```

### Endpoint mapping

| Spring endpoint | Upstream/처리 | 응답 |
| --- | --- | --- |
| `GET /api/v1/llm/tools` | `GET /api/v1/langgraph/tools` | typed `ListLlmToolsResponse` |
| `GET /api/v1/llm/models` | `GET /api/v1/langgraph/models` | typed `ListLlmModelsResponse` |
| `POST /api/v1/llm/threads` | `POST /api/v1/langgraph/threads` | upstream JSON 그대로 반환 |
| `GET /api/v1/llm/threads/{threadId}` | owner check 후 `GET /api/v1/langgraph/threads/{threadId}` | upstream JSON 그대로 반환 |
| `POST /api/v1/llm/threads/search` | local `llm_threads`에서 내 thread 최대 100개 조회 후 upstream thread 조회 | JSON array |
| `GET /api/v1/llm/threads/{threadId}/state` | owner check 후 `GET /api/v1/langgraph/threads/{threadId}/state` | upstream JSON 그대로 반환 |
| `POST /api/v1/llm/threads/{threadId}/history` | owner check 후 `POST /api/v1/langgraph/threads/{threadId}/history` | upstream JSON 그대로 반환 |
| `POST /api/v1/llm/threads/{threadId}/runs/stream` | owner check 후 `POST /api/v1/langgraph/threads/{threadId}/runs/stream` | `text/event-stream` relay |
| `POST /api/v1/llm/threads/{threadId}/runs/{runId}/cancel` | owner check 후 `POST /api/v1/langgraph/threads/{threadId}/runs/{runId}/cancel?action=...` | upstream JSON 그대로 반환 |
| `GET /api/v1/llm/threads/{threadId}/runs/{runId}/stream` | owner check 후 `GET /api/v1/langgraph/threads/{threadId}/runs/{runId}/stream` | `text/event-stream` relay |

기존 `stream-sessions` API와 local one-shot session store는 제거되었다.
서버는 더 이상 `CreateLlmStreamSessionRequest`, `ResumeLlmThreadRequest`, `interruptOn`, `allowedTools` 같은 custom chat DTO를 조립하지 않는다.
Run 생성, HITL resume, interrupt resume payload는 LangGraph Agent Server API와 client SDK 계약을 그대로 따른다.

### Thread 생성과 소유권 저장

`POST /api/v1/llm/threads`는 요청 body가 없으면 `{}`로 처리하고, `metadata.ownerUserId`를 현재 로그인 사용자 ID로 주입한다.
Upstream 응답에서 `thread_id`가 반드시 필요하다.
응답을 받은 뒤 `llm_threads`에 `upstream_thread_id`, `owner_user_id`, `status`, `metadata_json`을 저장하거나 갱신한다.

예시 request:

```json
{
  "metadata": {
    "title": "새 대화"
  }
}
```

예시 흐름:

```text
Client
  -> POST /api/v1/llm/threads
     -> LlmGatewayController
        -> LlmGatewayService
           -> metadata.ownerUserId 주입
           -> LlmGatewayUpstreamPort.createThread
              -> LlmGatewayHttpGateway
                 -> POST /api/v1/langgraph/threads
           -> LlmThreadRepository upsert
        -> upstream thread JSON 반환
```

Thread 조회, state/history 조회, run stream, cancel, stream 재연결은 모두 먼저 `llm_threads`에서 현재 사용자의 소유 thread인지 확인한다.
다른 사용자의 thread는 upstream 호출 전에 차단된다.

### Run stream과 재연결

Run 생성 stream:

```text
POST /api/v1/llm/threads/{threadId}/runs/stream
Accept: text/event-stream
Content-Type: application/json
```

Request body는 Agent Server API compatible JSON을 그대로 사용한다.
Spring 서버는 body schema를 강하게 검증하지 않고 upstream으로 전달한다.

SSE response 처리:

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `X-Accel-Buffering: no`
- upstream의 `Location`, `Content-Location` header가 있으면 client에 그대로 전달
- upstream response body `InputStream`을 `StreamingResponseBody`로 relay

Run stream 재연결:

```text
GET /api/v1/llm/threads/{threadId}/runs/{runId}/stream
Accept: text/event-stream
Last-Event-ID: <optional-event-id>
```

`Last-Event-ID`가 있으면 upstream join stream 요청에도 전달한다.

### HITL 처리 방식

HITL은 더 이상 서버가 custom `approve/edit/reject/respond` DTO를 검증하고 snake_case로 변환하는 방식이 아니다.
서버는 LangGraph thread/run API의 gateway 역할만 한다.
따라서 human-in-the-loop 승인, 수정, 거절, 응답 payload는 client와 LangGraph Agent Server API가 합의한 JSON shape를 `runs/stream` 요청 body에 담아 보낸다.

서버가 책임지는 것은 다음으로 제한된다.

- 인증 사용자 확인
- thread 소유권 확인
- upstream으로 JSON body 전달
- upstream SSE stream relay
- upstream `Location`/`Content-Location` header 전달
- upstream failure를 `502 Bad Gateway` 계열로 요약 전달

### Tools / Models

`GET /api/v1/llm/tools`와 `GET /api/v1/llm/models`는 여전히 서버가 응답 shape를 typed DTO로 조립한다.
Upstream은 LangGraph gateway의 `/api/v1/langgraph/tools`, `/api/v1/langgraph/models`를 호출한다.

Tools response는 camelCase를 유지한다.

```json
{
  "tools": [
    {
      "name": "divide",
      "description": "...",
      "category": "calculator",
      "defaultAllowed": true,
      "allowedDecisions": ["approve"]
    }
  ]
}
```

Models response도 기존 OpenAI-style list shape를 유지한다.

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-oss-20b",
      "object": "model",
      "created": 1677610602,
      "supportedReasoningEfforts": ["none", "low"]
    }
  ]
}
```

## Upstream Adapter 규칙

- JSON 요청은 `Accept: application/json`, `Content-Type: application/json`을 명시한다.
- Stream 요청은 `Accept: text/event-stream`을 명시한다.
- timeout은 현재 LangGraph gateway adapter에서 30분으로 둔다.
- API key가 있으면 `X-API-Key` header로 전달한다.
- path variable은 `LlmGatewayHttpClientSupport#encodePath`로 인코딩한다.
- upstream error body는 `summarizeBody`로 요약해 `ResponseStatusException` message에 포함한다.
- application은 upstream DTO를 직접 모르고 `port` + internal model 또는 `JsonNode`만 다룬다.
- tools/models처럼 서버 응답 계약이 별도로 있는 경우에만 mapper를 둔다.
- upstream schema가 바뀌면 API 통합 테스트 또는 mapper 테스트를 추가한다.

## 장애 대응

| 장애                               | 처리 방향                                  |
| ---------------------------------- | ------------------------------------------ |
| semantic upstream timeout          | cache fallback 또는 빈 결과 반환 정책 결정 |
| related cache miss + upstream down | 사용자에게 degraded response 또는 502/503  |
| index sync 실패                    | 로그/재시도 queue 고려                     |
| LangGraph JSON 호출 실패           | `502 Bad Gateway`로 upstream status/body 요약 전달 |
| LangGraph stream 중간 종료         | SSE stream close로 처리, client 재연결 고려 |
| thread owner mismatch              | upstream 호출 전에 403 또는 조회 불가 처리 |

## 테스트 포인트

- 게시글 생성/수정/삭제 시 sync event가 발행되는가?
- upstream client가 timeout/error를 안전하게 처리하는가?
- related posts cache hit/miss가 기대대로 동작하는가?
- 삭제된 게시글이 related response에 노출되지 않는가?
- LLM endpoint가 인증 사용자에게만 허용되는가?
- thread 생성 시 `metadata.ownerUserId`가 주입되고 `llm_threads`에 저장되는가?
- 다른 사용자의 thread 접근이 upstream 호출 전에 차단되는가?
- run stream 응답이 SSE로 relay되고 `Content-Location` header가 유지되는가?
- tools/models 응답 계약이 기존 camelCase/OpenAI-style shape를 유지하는가?

## 참고 링크

- LangGraph Agent Server API — https://docs.langchain.com/langsmith/agent-server-api
- LangGraph Threads API — https://docs.langchain.com/langsmith/agent-server-api/threads
- LangGraph Thread Runs API — https://docs.langchain.com/langsmith/agent-server-api/thread-runs
- Spring MVC StreamingResponseBody — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html
- Spring Cache — https://docs.spring.io/spring-boot/reference/io/caching.html
