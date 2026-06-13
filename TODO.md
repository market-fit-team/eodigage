# TODO

문서 작업용 메모다.  
이 파일만 읽어도 다음 AI가 바로 이어서 작성할 수 있게 남은 문서와 근거 파일을 적는다.
모든 웹 문서는 직접 확인해본다.

## 먼저 볼 것

- 문체와 형식 규칙: `AGENTS.md`
- 기준 샘플 1: `frontend/docs/bff-proxy.md`
- 기준 샘플 2: `frontend/docs/auth.md`

문서를 새로 쓸 때는 항상:

1. 관련 코드 파일을 먼저 읽는다.
2. 관련 공식 웹 문서를 다시 확인한다.
3. `주요 파일`은 상대경로만 쓴다.
4. `참고 문서`는 웹 링크만 쓴다.
5. 운영/정책/체크리스트/한계 같은 섹션은 만들지 않는다.

## 현재 작성된 문서

- `frontend/docs/auth.md`
- `frontend/docs/bff-proxy.md`

## 남은 문서

### frontend/docs

#### `frontend/docs/chat.md`

- 채팅 화면과 스트리밍 경계
- `@langchain/react useStream`
- `/api/proxy/agent`
- model/tool catalog fetch
- `submit`, `respond`, `toolCalls`, `interrupts`

주요 파일:

- `src/app/chat/page.tsx`
- `src/features/llm-chat/page/chat-page.tsx`
- `src/features/llm-chat/page/components/chat-shell.tsx`
- `src/features/llm-chat/hooks/langgraph-chat-stream-provider.tsx`
- `src/features/llm-chat/hooks/langgraph-chat-stream-context.ts`
- `src/features/llm-chat/lib/langgraph/build-submit-config.ts`
- `src/features/llm-chat/lib/langgraph/build-submit-input.ts`
- `src/features/llm-chat/lib/agent-catalog/use-agent-catalog.ts`

참고 문서 후보:

- `https://reference.langchain.com/javascript/langchain-react/use-stream`
- `https://docs.langchain.com/langsmith/agent-server-api/streaming/protocol-v2-command`
- `https://docs.langchain.com/langsmith/agent-server-api/streaming/protocol-v2-event-stream-sse`
- `https://docs.langchain.com/oss/python/langgraph/interrupts`

#### `frontend/docs/data-fetching.md`

- TanStack Query 전역 설정
- `dehydrate` / `HydrationBoundary`
- suspense query
- generated hook과 수동 fetch 사용 위치

주요 파일:

- `src/app/providers.tsx`
- `src/shared/lib/react-query.ts`
- `src/app/community/posts/page.tsx`
- `src/app/playground/page.tsx`
- `src/features/llm-chat/lib/agent-catalog/use-agent-catalog.ts`
- `src/features/posts/components/post-list.tsx`
- `src/features/posts/components/create-post.tsx`

참고 문서 후보:

- `https://tanstack.com/query/latest/docs/framework/react/overview`
- `https://tanstack.com/query/latest/docs/framework/react/guides/ssr`
- `https://tanstack.com/query/latest/docs/framework/react/reference/hydration`
- `https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery`

#### `frontend/docs/api-codegen.md`

- `orval.config.ts`
- generated output 경로
- 어떤 API가 generated hook을 쓰는지
- agent API는 왜 generated client를 안 쓰는지

주요 파일:

- `orval.config.ts`
- `package.json`
- `src/app/community/posts/page.tsx`
- `src/features/posts/components/post-list.tsx`
- `src/features/posts/components/create-post.tsx`
- `src/features/scheduled-posts/components/create-scheduled-post.tsx`
- `src/app/playground/page.tsx`

참고 문서 후보:

- `https://orval.dev/docs`
- `https://orval.dev/docs/reference/configuration/output`
- `https://orval.dev/docs/guides/react-query`
- `https://orval.dev/docs/guides/set-base-url`

#### `frontend/docs/app-structure.md`

- `src/app`
- `src/features`
- `src/shared`
- route handler, page, provider, db, generated client 위치

주요 파일:

- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/page.tsx`
- `src/shared/db/index.ts`
- `src/shared/db/schema.ts`
- `src/shared/api/problem-detail-schema.ts`

참고 문서 후보:

- `https://nextjs.org/docs/app`
- `https://nextjs.org/docs/app/getting-started/server-and-client-components`

### backend/services/community-service/docs

#### `backend/services/community-service/docs/README.md`

- 서비스가 실제로 구현하는 기능 목록
- posts / likes / media / notifications / scheduled posts
- 기술 스택
- 문서 인덱스

주요 파일:

- `build.gradle`
- `src/main/resources/application.yaml`
- `src/main/java/com/example/server/ServerApplication.java`
- `src/main/java/com/example/server/infrastructure/openapi/OpenApiConfig.java`

#### `backend/services/community-service/docs/architecture.md`

- `api -> application -> core -> infrastructure`
- 요청 흐름
- 알림과 예약 게시글이 어디를 타는지

주요 파일:

- `src/main/java/com/example/server/api/post/PostCommandController.java`
- `src/main/java/com/example/server/application/post/query/PostQueryService.java`
- `src/main/java/com/example/server/core/post/PostCommandService.java`
- `src/main/java/com/example/server/application/notification/NotificationSseService.java`
- `src/main/java/com/example/server/infrastructure/messaging/scheduledpost/ScheduledPostPublisherScheduler.java`

참고 문서 후보:

- `https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html`
- `https://docs.spring.io/spring-framework/reference/web/webmvc.html`
- `https://docs.spring.io/spring-framework/reference/integration/scheduling.html`

#### `backend/services/community-service/docs/api.md`

- 실제 HTTP API만 정리
- posts / likes / media / notifications / scheduled posts
- 존재하지 않는 `llm` API는 적지 않기

주요 파일:

- `src/main/java/com/example/server/api/post/*.java`
- `src/main/java/com/example/server/api/postlike/PostLikeController.java`
- `src/main/java/com/example/server/api/media/MediaAttachmentController.java`
- `src/main/java/com/example/server/api/notification/*.java`
- `src/main/java/com/example/server/api/scheduledpost/*.java`

참고 문서 후보:

- `https://docs.spring.io/spring-framework/reference/web/webmvc.html`
- `https://springdoc.org/`
- `https://springdoc.org/getting-started.html`

#### `backend/services/community-service/docs/security.md`

- Resource Server JWT 검증
- `issuer`, `audience`, `jwk-set-uri`
- `authenticated()`와 데이터 소유권 검증

주요 파일:

- `src/main/java/com/example/server/infrastructure/security/SecurityConfig.java`
- `src/main/java/com/example/server/application/auth/CurrentUserService.java`
- `src/test/java/com/example/server/api/post/PostApiAuthorizationTest.java`

참고 문서 후보:

- `https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html`
- `https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html`

#### `backend/services/community-service/docs/persistence.md`

- PostgreSQL
- JPA/Hibernate validate mode
- Flyway migration
- RLS
- `DbSessionContext`

주요 파일:

- `src/main/resources/db/migration/*.sql`
- `src/main/java/com/example/server/infrastructure/persistence/session/DbSessionContext.java`
- `src/test/java/com/example/server/db/FlywayMigrationTest.java`
- `src/test/java/com/example/server/db/PostRlsPolicyTest.java`

참고 문서 후보:

- `https://docs.spring.io/spring-data/jpa/reference/index.html`
- `https://documentation.red-gate.com/fd/migrations-271585107.html`
- `https://www.postgresql.org/docs/current/ddl-rowsecurity.html`
- `https://www.postgresql.org/docs/current/sql-createpolicy.html`

#### `backend/services/community-service/docs/caching.md`

- Redis cache가 실제로 어디에 붙는지
- 단건 post cache와 eviction

주요 파일:

- `src/main/java/com/example/server/infrastructure/cache/config/RedisConfig.java`
- `src/main/java/com/example/server/application/post/query/PostQueryService.java`
- `src/main/java/com/example/server/core/post/PostCommandService.java`
- `src/main/java/com/example/server/core/postlike/PostLikeCommandService.java`
- `src/test/java/com/example/server/api/post/PostCacheTest.java`

참고 문서 후보:

- `https://docs.spring.io/spring-boot/reference/io/caching.html`
- `https://docs.spring.io/spring-data/redis/reference/index.html`
- `https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html`

#### `backend/services/community-service/docs/messaging.md`

- RabbitMQ exchange / queue / routing key
- notification 흐름
- scheduled post publish 흐름

주요 파일:

- `src/main/java/com/example/server/infrastructure/messaging/config/RabbitConfig.java`
- `src/main/java/com/example/server/infrastructure/messaging/notification/*.java`
- `src/main/java/com/example/server/infrastructure/messaging/scheduledpost/*.java`

참고 문서 후보:

- `https://docs.spring.io/spring-boot/reference/messaging/amqp.html`
- `https://docs.spring.io/spring-amqp/reference/index.html`
- `https://www.rabbitmq.com/tutorials/amqp-concepts`

#### `backend/services/community-service/docs/media-storage.md`

- multipart 업로드
- S3 저장
- presigned GET URL
- attachment 상태

주요 파일:

- `src/main/java/com/example/server/api/media/MediaAttachmentController.java`
- `src/main/java/com/example/server/core/media/MediaCommandService.java`
- `src/main/java/com/example/server/infrastructure/storage/config/S3Config.java`
- `src/main/java/com/example/server/infrastructure/storage/media/S3StorageService.java`
- `src/main/java/com/example/server/infrastructure/storage/media/MediaUploadValidator.java`

참고 문서 후보:

- `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html`
- `https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html`
- `https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html`

#### `backend/services/community-service/docs/notifications.md`

- 저장형 알림
- SSE
- RabbitMQ consumer와 연결

주요 파일:

- `src/main/java/com/example/server/api/notification/NotificationController.java`
- `src/main/java/com/example/server/api/notification/NotificationStreamController.java`
- `src/main/java/com/example/server/application/notification/NotificationSseService.java`
- `src/main/java/com/example/server/core/notification/*.java`

참고 문서 후보:

- `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html`
- `https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events`

#### `backend/services/community-service/docs/testing.md`

- `@SpringBootTest`
- `MockMvc`
- `spring-security-test`
- Testcontainers

주요 파일:

- `src/test/java/com/example/server/support/IntegrationTestSupport.java`
- `src/test/java/com/example/server/api/post/*.java`
- `src/test/java/com/example/server/api/notification/NotificationApiTest.java`
- `src/test/java/com/example/server/api/scheduledpost/ScheduledPostApiTest.java`
- `src/test/java/com/example/server/db/*.java`

참고 문서 후보:

- `https://docs.spring.io/spring-boot/reference/testing/index.html`
- `https://docs.spring.io/spring-framework/reference/testing/mockmvc.html`
- `https://docs.spring.io/spring-security/reference/servlet/test/index.html`
- `https://java.testcontainers.org/test_framework_integration/junit_5/`

#### `backend/services/community-service/docs/local-dev.md`

- `.env`
- backing services
- `./gradlew bootRun`
- swagger / posts / JWT 확인 경로

주요 파일:

- `src/main/resources/application.yaml`
- `build.gradle`
- `src/main/java/com/example/server/infrastructure/storage/config/S3Config.java`
- `src/main/java/com/example/server/infrastructure/messaging/config/RabbitConfig.java`

### backend/services/agent-service/docs

#### `backend/services/agent-service/docs/README.md`

- native Agent Server
- custom routes 2개
- chat graph
- 내부 RAG/evals 존재

주요 파일:

- `langgraph.json`
- `README.md`
- `src/agent/webapp.py`
- `src/agent/security/auth.py`

#### `backend/services/agent-service/docs/architecture.md`

- `langgraph.json`
- graph / custom app / custom auth 연결
- chat / providers / rag / evals 디렉터리 구조

주요 파일:

- `langgraph.json`
- `src/agent/services/chat/graph.py`
- `src/agent/repositories/qdrant_setup.py`
- `pyproject.toml`

참고 문서 후보:

- `https://docs.langchain.com/langsmith/agent-server`
- `https://docs.langchain.com/langsmith/custom-routes`
- `https://docs.langchain.com/langsmith/cli`

#### `backend/services/agent-service/docs/chat-graph.md`

- `chat_model -> approval_gate -> tools -> chat_model`
- `ChatState`
- `ChatRuntimeContext`
- `route_after_chat_model`

주요 파일:

- `src/agent/services/chat/graph.py`
- `src/agent/services/chat/nodes.py`
- `src/agent/services/chat/routing.py`
- `src/agent/services/chat/context.py`
- `src/agent/services/chat/state.py`

참고 문서 후보:

- `https://reference.langchain.com/python/langgraph/graph/state/StateGraph`
- `https://reference.langchain.com/python/langgraph/runtime/Runtime`
- `https://reference.langchain.com/python/langgraph/graph/message/add_messages`

#### `backend/services/agent-service/docs/streaming.md`

- Protocol V2만 다루기
- `/stream/events`
- `/commands`
- eval harness가 실제로 어떻게 읽는지

주요 파일:

- `evals/agent_eval/client.py`
- `evals/agent_eval/sse.py`
- `evals/agent_eval/runner.py`
- `tests/unit_tests/test_eval_protocol_v2.py`

참고 문서 후보:

- `https://docs.langchain.com/langsmith/agent-server-api/streaming/protocol-v2-event-stream-sse`
- `https://docs.langchain.com/langsmith/agent-server-api/streaming/protocol-v2-command`
- `https://docs.langchain.com/langsmith/agent-server-changelog`

#### `backend/services/agent-service/docs/hitl-and-tools.md`

- tool registry
- `ToolSpec`
- approval policy
- `interrupt_on`
- decision type

주요 파일:

- `src/agent/services/chat/toolkits/chat_toolkit.py`
- `src/agent/services/chat/tools/tool_spec.py`
- `src/agent/services/chat/tools/calculator_tool/calculator_tool.py`
- `src/agent/services/chat/approvals/policy.py`
- `src/agent/services/chat/approvals/nodes.py`
- `src/agent/services/chat/approvals/schemas.py`

참고 문서 후보:

- `https://docs.langchain.com/oss/python/langchain/tools`
- `https://docs.langchain.com/oss/python/langchain/human-in-the-loop`
- `https://docs.langchain.com/oss/python/langgraph/interrupts`

#### `backend/services/agent-service/docs/models-and-providers.md`

- public model ids
- model cards
- fallback order
- provider adapters

주요 파일:

- `src/agent/services/chat/model_cards.py`
- `src/agent/services/chat/model_catalog.py`
- `src/agent/services/chat/models.py`
- `src/agent/services/chat/fallback/runner.py`
- `src/agent/services/chat/providers/*.py`

참고 문서 후보:

- `https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai`
- `https://docs.langchain.com/oss/python/integrations/chat/openai`
- `https://docs.langchain.com/oss/python/integrations/chat/openrouter`
- `https://openrouter.ai/docs/api/reference/parameters`

#### `backend/services/agent-service/docs/catalog-api.md`

- `/api/v1/llm/models`
- `/api/v1/llm/tools`
- custom route auth와 OpenAPI 문서화

주요 파일:

- `src/agent/webapp.py`
- `src/agent/schemas/chat.py`
- `src/agent/services/chat/model_catalog.py`
- `src/agent/services/chat/toolkits/chat_toolkit.py`
- `src/agent/core/exception_handlers.py`

참고 문서 후보:

- `https://docs.langchain.com/langsmith/custom-routes`
- `https://docs.langchain.com/langsmith/openapi-security`
- `https://fastapi.tiangolo.com/reference/security/`

#### `backend/services/agent-service/docs/rag.md`

- 내부 RAG 계층
- schema
- embedding
- Qdrant repository
- alias / collection / payload
- HTTP route는 없다는 점 포함

주요 파일:

- `src/agent/schemas/rag.py`
- `src/agent/services/rag/embeddings.py`
- `src/agent/services/rag/posts/ingestion.py`
- `src/agent/services/rag/posts/retrieval.py`
- `src/agent/services/rag/sources/post/source.py`
- `src/agent/repositories/qdrant.py`
- `src/agent/repositories/qdrant_setup.py`

참고 문서 후보:

- `https://ai.google.dev/gemini-api/docs/embeddings`
- `https://qdrant.tech/documentation/manage-data/collections/`
- `https://qdrant.tech/documentation/manage-data/indexing/`
- `https://qdrant.tech/documentation/search/filtering/`

#### `backend/services/agent-service/docs/security.md`

- Better Auth JWT 검증
- JWKS fetch
- `kid`, `alg`, `aud`, `iss`, `sub`
- custom route 문서화와 실제 auth 경계 구분

주요 파일:

- `src/agent/security/auth.py`
- `src/agent/webapp.py`
- `src/agent/core/config.py`
- `src/agent/core/security.py`
- `src/agent/core/exception_handlers.py`

참고 문서 후보:

- `https://docs.langchain.com/langsmith/auth`
- `https://docs.langchain.com/langsmith/custom-auth`
- `https://www.python-httpx.org/async/`
- `https://pyjwt.readthedocs.io/en/stable/api.html`

#### `backend/services/agent-service/docs/evals-and-testing.md`

- pytest 트리
- eval harness
- scenario와 validator

주요 파일:

- `tests/unit_tests/*.py`
- `tests/integration_tests/test_graph.py`
- `evals/agent_eval/*.py`
- `evals/scenarios/*.yaml`
- `evals/config.yaml`

참고 문서 후보:

- `https://docs.langchain.com/langsmith/local-dev-testing`
- `https://docs.pytest.org/`

#### `backend/services/agent-service/docs/local-dev.md`

- `.env.example`
- `uv sync`
- `langgraph dev`
- `docker compose`
- Qdrant 준비

주요 파일:

- `.env.example`
- `Makefile`
- `pyproject.toml`
- `docker-compose.yml`
- `scripts/qdrant_alias_switch.py`
- `scripts/qdrant_reindex.py`
