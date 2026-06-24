# agent workspace terms

`agent-service`는 사용자 자산과 채팅 중간 산출물을 PostgreSQL에 나눠 둔다.  
사용자가 여러 채팅에서 다시 쓰는 데이터와 현재 스레드 안에서만 쓰는 데이터를 같은 개념으로 보지 않는다.

## memory

`agent_memories`는 사용자 장기 메모리다.

```text
memory_search
memory_create
memory_update
memory_delete
```

- 사용자 기준 저장물이다.
- 여러 채팅에서 공통으로 다시 읽을 수 있다.
- LLM이 자동으로 전부 받는 버퍼가 아니라 tool로 조회한다.

## onboarding context

`agent_thread_onboarding_contexts`는 스레드에 연결된 성향 결과 포인터다.

```text
result_code
selected_category_code
source
```

- 실제 성향 결과 본문은 `onboarding-service`가 가진다.
- `onboarding_*` tool은 필요할 때 외부 서비스를 호출한다.
- 스레드에는 현재 어떤 성향 결과를 참조하는지만 남긴다.

## content

`agent_contents`는 artifact와 document가 공통으로 참조하는 본문 테이블이다.

```text
id
type
title
summary
raw_text
created_at
updated_at
```

```text
content.type
-> commercial_report
-> search_report
-> research_report
-> markdown
-> code
```

- 본문 저장의 단일 소스다.
- `type`, `title`, `summary`, `raw_text`가 여기서 관리된다.
- `artifact`와 `document`는 이 row를 직접 공유하지 않는다.
- `artifact -> document 저장` 시에는 본문 row를 복사한다.

## artifact

`agent_artifacts`는 스레드 소속 중간 산출물 테이블이다.

```text
id
auth_user_uuid
thread_id
langgraph_thread_id
content_id
version
source_message_id
source_tool_call_id
created_at
updated_at
```

- 현재 스레드 맥락에서 쓰는 결과물이다.
- 우측 패널 같은 채팅 UI에서 바로 보여줄 수 있는 저장물이다.
- 본문은 직접 저장하지 않고 `content_id -> agent_contents.id`로 읽는다.
- 삭제 API는 두지 않는다.
- 스레드 삭제 시 cascade로 함께 정리된다.

```text
artifact_get
artifact_create
artifact_update
artifact_save_as_document
```

## document

`agent_documents`는 여러 채팅과 마이페이지에서 재사용하는 사용자 자산이다.

```text
id
auth_user_uuid
content_id
source_artifact_id
created_at
updated_at
deleted_at
```

- 본문은 직접 저장하지 않고 `content_id -> agent_contents.id`로 읽는다.
- 삭제는 `deleted_at` 기반 soft delete다.
- `source_artifact_id`로 원본 artifact를 추적할 수 있다.
- 저장 후에는 artifact와 document가 서로 독립적으로 수정된다.

## document API

`src/agent/api/routes/workspace.py`는 문서 CRUD를 아래 경로로 연다.

```text
GET    /api/v1/agent/documents
POST   /api/v1/agent/documents
GET    /api/v1/agent/documents/{document_id}
PATCH  /api/v1/agent/documents/{document_id}
DELETE /api/v1/agent/documents/{document_id}
```

- 사용자 JWT 기준으로 owner를 제한한다.
- 응답 본문은 공통 content를 join해서 `type`, `title`, `summary`, `raw_text`를 평탄화한다.
- 수정 이력 테이블은 두지 않고 현재본만 유지한다.

## artifact API

`src/agent/api/routes/workspace.py`는 아티팩트 API를 아래 경로로 연다.

```text
GET    /api/v1/agent/artifacts
POST   /api/v1/agent/artifacts
GET    /api/v1/agent/artifacts/{artifact_id}
PATCH  /api/v1/agent/artifacts/{artifact_id}
POST   /api/v1/agent/artifacts/{artifact_id}/save-as-document
```

- 사용자 JWT 기준으로 owner를 제한한다.
- 응답 본문은 공통 content를 join해서 `type`, `title`, `summary`, `raw_text`를 평탄화한다.
- `save-as-document`는 새 document와 새 content row를 만든다.

## document tools

문서 tool은 CRUD 전체를 가진다.

```text
document_search
document_read
document_create
document_update
document_delete
```

- `document_search`는 제목, 요약, 타입 기준으로 찾는다.
- `document_read`는 원문 `raw_text`까지 반환한다.
- `document_create`, `document_update`, `document_delete`는 HITL 승인 뒤 실행한다.

## LLM 입력

현재 LLM 입력은 아래 둘이 중심이다.

```text
SystemMessage("도구 호출이 완료된 뒤에는 결과를 사용자에게 보고해야 합니다.")
+ state["messages"]
```

문서와 아티팩트 본문은 자동 주입하지 않는다.  
대신 세션 state 안의 `system_context` 스냅샷을 읽어
최신 사용자 메시지 하단에 메타데이터만 담은 `<system_context>`를 붙인다.

```text
selected_document_ids
-> document id / type / title / summary
selected_artifact_ids
-> artifact id / type / title / summary / version
system_context.memory_summary
-> has_memories / memory_count
system_context.onboarding_summary
-> has_default_profile / has_thread_context
-> <system_context>
-> 원문이 필요하면 document_read
-> 원문이 필요하면 artifact_get
-> 필요하면 memory_search
-> 필요하면 onboarding_*
```

- 선택 문서/아티팩트 참조는 턴 단위 입력으로 들어오고, 세션 state의 `system_context.selected_*`에 매 turn overwrite된다.
- `memory_summary`, `onboarding_summary`는 첫 chat run에서 lazy init되는 세션 스냅샷이다.
- 같은 세션 동안 외부 변경을 자동 재동기화하지 않는다.
- `raw_text`는 `<system_context>`에 자동 주입하지 않는다.

## 주요 파일

- `src/agent/db/models.py`
- `src/agent/schemas/workspace.py`
- `src/agent/services/workspace/service.py`
- `src/agent/services/chat/tools/artifact_tool/artifact_tool.py`
- `src/agent/services/chat/tools/document_tool/document_tool.py`
- `src/agent/services/chat/system_context.py`
- `src/agent/services/chat/system_context_state.py`
- `src/agent/services/chat/nodes.py`
