# Folder Structure

현재 서버는 상위 레이어를 먼저 두고, 그 아래 도메인별 패키지를 나누는 구조를 사용한다.

```text
com.example.server
 ├─ api
 ├─ application
 ├─ core
 └─ infrastructure
```

이 구조는 완전한 DDD를 선언하기 위한 구조라기보다, Spring Boot 코드베이스에서 **HTTP 경계, 유스케이스/조회 조합, 핵심 모델, 기술 구현**을 분리하기 위한 실용적 구조다.

## 레이어별 책임

| 레이어           | 책임                                                                                         | 예시                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `api`            | HTTP Controller, HTTP request/response DTO, API error response                               | `PostCommandController`, `CreatePostRequest`                                            |
| `application`    | 조회 조합, QueryService, CursorCodec, SSE orchestration, 외부 이벤트 listener orchestration  | `PostQueryService`, `ScheduledPostQueryService`, `RelatedPostsQueryService`             |
| `core`           | Entity, command service, business rule, domain event, command value object                   | `Post`, `PostDraft`, `PostCommandService`, `ScheduledPostCommandService`                |
| `infrastructure` | Repository, JPA query projection, Redis, RabbitMQ, S3, external HTTP client, security/config | `PostRepository`, `ScheduledPostPublishConsumer`, `S3StorageService`, `SecurityConfig` |

---

## 각 레이어를 더 구체적으로

### `api` — HTTP 경계

외부 세계(클라이언트)와 서버가 만나는 유일한 지점이다. HTTP 프로토콜에 관한 모든 것이 여기에 있다.

- `@RestController`, `@RequestMapping` 같은 Spring MVC 어노테이션은 이 레이어에서만 쓴다.
- Request/Response DTO는 이 레이어 소유다. `core`의 엔티티를 직접 응답으로 내보내지 않는다.
- 예외 응답은 가능한 한 Spring Boot Problem Details 기본 동작을 사용하고, 보안 예외만 `SecurityConfig`에서 처리한다.

```
api/post/
 ├─ PostCommandController.java   ← 상태 변경 요청 처리
 ├─ PostQueryController.java     ← 조회 요청 처리
 └─ dto/
     ├─ CreatePostRequest.java
     └─ PostResponse.java
```

`PostCommandController`와 `PostQueryController`를 분리하는 이유는 쓰기 흐름과 읽기 흐름이 의존하는 레이어가 다르기 때문이다. (쓰기 → `core`, 읽기 → `application`)

---

### `application` — 조회와 유스케이스 조합

단일 도메인으로 해결되지 않는 **"여러 조각을 조합하는 로직"** 이 여기에 있다.

- 여러 Repository나 외부 데이터를 조합해서 응답을 만드는 QueryService
- SSE, 이벤트 수신 같은 오케스트레이션
- 커서 인코딩/디코딩처럼 조회 전용 유틸

```
application/post/query/
 ├─ PostQueryService.java         ← 피드, 커서 목록, 관련 게시글 조합
 └─ PostSummaryProjection.java    ← 읽기 전용 조회 결과
```

`core`의 `PostCommandService`와 구분되는 점은, 이 레이어의 서비스는 **상태를 바꾸지 않는다**는 것이다. 읽고 조합해서 반환할 뿐이다.

---

### `core` — 비즈니스 모델의 중심

서버에서 가장 중요한 레이어다. HTTP도 모르고, Redis도 모르고, RabbitMQ도 모른다. 순수하게 **"이 서비스가 무엇을 하는가"** 만 알고 있다.

- 엔티티(`Post`, `User`)와 그 행위 메서드
- 상태를 바꾸는 `CommandService`
- 기술 구현을 추상화한 Port 인터페이스 (`MediaStoragePort`, `NotificationPort`)
- 도메인 이벤트 (`PostCreatedEvent`, `NotificationCreatedEvent`)

```
core/post/
 ├─ Post.java                     ← 엔티티 + 도메인 로직
 ├─ PostDraft.java                ← 일반/예약 게시글 생성 입력 모델
 └─ PostCommandService.java       ← 생성/수정/삭제 유스케이스
```

현재 프로젝트는 실용성을 위해 `core` command service에서 Spring Data repository 구현체를 직접 주입하는 방식을 허용한다. 대신 HTTP request DTO나 controller 세부 구현은 `core`로 들어오지 않게 막고, 게시글 생성 입력은 `PostDraft` 같은 내부 command value object로 통일한다.

---

### `infrastructure` — 기술 구현의 집합

외부 시스템(DB, Redis, S3, RabbitMQ, 외부 API)과의 실제 연결을 담당한다. `core`가 정의한 인터페이스를 여기서 구현한다.

도메인별이 아니라 **기술 종류별**로 나뉘는 게 포인트다.

```
infrastructure/
 ├─ persistence/       ← JPA Repository 구현체, 쿼리 프로젝션
 ├─ cache/            ← Redis 설정, 캐시 어댑터
 ├─ messaging/        ← RabbitMQ 설정, Publisher/Consumer
 ├─ storage/          ← S3 연동 (MediaStoragePort 구현)
 ├─ http/             ← 외부 API 클라이언트
 └─ security/         ← Spring Security 설정, JWT 필터
```

`SecurityConfig`나 `RabbitConfig`가 여기 있는 이유는, 이것들이 비즈니스 규칙이 아니라 **기술적 설정**이기 때문이다. 비즈니스가 바뀌어도 이 파일들은 건드릴 일이 없다.

---

## 레이어 간 의존 방향을 코드로 보면

```
[클라이언트 요청]
      ↓
  api/PostCommandController
      ↓  (Command Service 호출)
  core/PostCommandService
      ↓  (엔티티 조작 후 저장)
  infrastructure/persistence/post/PostRepository
```

```
[클라이언트 조회 요청]
      ↓
  api/PostQueryController
      ↓  (조회 서비스 호출)
  application/PostQueryService
      ↓  (DB 직접 조회 + 조합)
  infrastructure/persistence/query/PostSummaryRepository
```

이 방향을 지키면 생기는 실질적인 이점은, **테스트 작성이 쉬워진다**는 것이다. `core`는 외부 의존 없이 단위 테스트가 가능하고, `infrastructure` 구현체만 교체해서 통합 테스트 환경을 구성할 수 있다.

## 현재 주요 패키지

```text
api
 ├─ auth
 ├─ common/error
 ├─ llm
 ├─ media
 ├─ notification
 ├─ post
 ├─ postlike
 ├─ scheduledpost
 └─ semantic

application
 ├─ auth
 ├─ llm
 │   ├─ model
 │   └─ port
 ├─ media
 ├─ notification
 │   └─ support
 ├─ post
 │   └─ query
 ├─ scheduledpost
 └─ semantic

core
 ├─ llm
 ├─ media
 ├─ notification
 │   └─ event
 ├─ post
 ├─ postlike
 ├─ scheduledpost
 │   └─ event
 ├─ semantic
 │   └─ event
 └─ user

infrastructure
 ├─ cache
 │   └─ semantic
 ├─ http
 │   ├─ llm
 │   └─ semantic
 ├─ messaging
 │   ├─ notification
 │   └─ scheduledpost
 ├─ persistence
 │   ├─ llm
 │   ├─ media
 │   ├─ notification
 │   ├─ post
 │   ├─ postlike
 │   ├─ scheduledpost
 │   ├─ session
 │   └─ user
 ├─ security
 │   └─ oidc
 └─ storage
     └─ media
```

## 의존 방향

권장 의존 방향:

```text
api -> application
api -> core
application -> core
application -> infrastructure
core -> infrastructure   // 현재 프로젝트에서는 Spring Data Repository 직접 주입을 허용
infrastructure -> core
```

금지에 가까운 의존:

```text
api -> infrastructure 직접 호출
entity/core model -> api DTO 의존
entity/core model -> web/session/security 세부 구현 의존
infrastructure -> api 의존
repository -> controller/service 호출
```

## Write Flow

상태를 바꾸는 요청은 보통 `api -> core -> infrastructure` 흐름을 따른다.

```text
api/post/PostCommandController
  -> core/post/PostCommandService
     -> core/post/Post
     -> infrastructure/persistence/post/PostRepository
     -> infrastructure/persistence/session/DbSessionContext
```

예시:

- 게시글 생성
- 게시글 수정/삭제
- 좋아요 생성/삭제
- 미디어 업로드/삭제
- 알림 읽음 처리
- 예약 게시글 생성/취소

게시글 생성은 일반 작성과 예약 발행이 같은 내부 생성 로직을 공유한다.

```text
api/post/PostCommandController
  -> PostDraft
  -> core/post/PostCommandService.create(...)
     -> createRootPost(...)
     -> attachMedia(...)
     -> publishSemanticSync(...)

infrastructure/messaging/scheduledpost/ScheduledPostPublishConsumer
  -> ScheduledPost.toPostDraft()
  -> core/post/PostCommandService.createRootFromScheduled(...)
     -> createRootPost(...)
     -> attachMedia(...)
     -> publishSemanticSync(...)
```

이 패턴의 목적은 예약 게시글이 발행될 때도 일반 게시글과 동일하게 미디어 attach, 캐시 무효화, 알림, semantic indexing 규칙을 타도록 만드는 것이다. controller/request DTO는 달라도 `PostDraft` 이후의 생성 규칙은 한곳에서 관리한다.

## Read Flow

읽기 요청은 보통 `api -> application -> infrastructure` 흐름을 따른다.

```text
api/post/PostQueryController
  -> application/post/query/PostQueryService
     -> infrastructure/persistence/post/query/PostSummaryRepository
     -> application/media/MediaQueryService
```

예시:

- 게시글 피드 조회
- 커서 기반 목록 조회
- 댓글 스레드 조회
- 알림 목록 조회
- 관련 게시글 조회

## DTO 배치 규칙

DTO는 “어디로 오가는 데이터인가”를 기준으로 둔다.

| DTO 종류                           | 위치                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| HTTP request/response DTO          | `api/<domain>/dto`                                                   |
| 조회 조합 전용 DTO                 | `application/<domain>` 또는 `api/<domain>/dto` 중 API 응답이면 `api` |
| 외부 upstream request/response DTO | `infrastructure/http/<domain>/dto`                                   |
| RabbitMQ message DTO               | `infrastructure/messaging/<domain>`                                  |
| domain event                       | `core/<domain>/event`                                                |

## 책임 분리 패턴 권장

레이어를 나눴다고 해서 자동으로 관심사가 분리되지는 않는다. 클래스가 비대해지기 시작하면 아래 패턴을 이용해 책임을 더 강하게 쪼개는 쪽을 권장한다.

- `Assembler`
  - HTTP request/response DTO와 내부 command/view model 변환
  - controller가 payload shape 변환까지 떠안지 않게 한다.
- `Factory`
  - 외부 시스템 요청 payload, 문서, message body처럼 생성 규칙이 있는 값을 조립
  - application service가 snake_case payload나 복잡한 map 조립을 직접 하지 않게 한다.
- `Port + Adapter`
  - application/core는 추상화된 port에만 의존
  - infrastructure는 adapter로 port를 구현
  - 외부 HTTP client, storage, messaging, cache 같은 기술 구현을 안쪽 레이어에서 직접 알지 않게 한다.

예:

```text
api/controller
  -> assembler or raw JsonNode boundary
  -> application service
     -> port
        -> infrastructure adapter
           -> client support / factory / mapper
```

LLM LangGraph gateway처럼 upstream API shape를 거의 그대로 통과시키는 경우에는 request DTO/command assembler를 억지로 만들지 않는다. 대신 `api`는 인증과 HTTP stream response 경계를 담당하고, `application`은 owner check와 orchestration, `infrastructure/http`는 upstream transport를 담당한다.

특히 다음 냄새가 보이면 분리를 검토한다.

- controller가 request validation, payload 변환, response 조립을 다 한다.
- application service가 API DTO나 외부 upstream DTO를 직접 import한다.
- 외부 client 하나가 transport, serialization, mapping, error handling, business branching을 모두 가진다.
- camelCase/snake_case 변환, path 조립, message body 조립이 여러 레이어에 흩어진다.

## 새 기능 추가 기준

예를 들어 `bookmark` 기능을 추가한다면 다음처럼 시작한다.

```text
api/bookmark
application/bookmark
core/bookmark
infrastructure/persistence/bookmark
```

단, 처음부터 모든 폴더를 빈 폴더로 만들 필요는 없다. 파일이 생길 때 해당 위치에 둔다.

## 왜 `controller/service/repository/dto/entity`가 아닌가

이 서버는 RabbitMQ, SSE, Redis, S3, external HTTP, RLS처럼 기술 경계가 많다. 단순히 파일 종류별로 `controller/service/repository/dto/entity`를 상위에 두면 `service`와 `dto`가 너무 넓은 의미가 되어 다시 잡동사니가 되기 쉽다.

따라서 이 프로젝트는 다음처럼 더 큰 책임 단위로 나눈다.

```text
api = HTTP boundary
application = query/use-case orchestration
core = business model and command behavior
infrastructure = technical implementation
```

## Spring Boot / Modulith 관점

Spring Boot 자체는 특정 패키지 구조를 강제하지 않는다. 다만 메인 애플리케이션 클래스를 루트 패키지에 두고 하위 패키지가 component scan 되도록 하는 구조가 일반적이다.

Spring Modulith는 도메인 기반 application module을 강조한다. 이 프로젝트는 아직 Spring Modulith dependency를 직접 사용하지 않지만, 추후 `ApplicationModules.verify()` 같은 모듈 경계 검증을 도입할 수 있도록 도메인별 하위 패키지를 유지한다.

## 참고 링크

- Spring Boot: Structuring Your Code — https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html
- Spring Modulith Fundamentals — https://docs.spring.io/spring-modulith/reference/fundamentals.html
- Spring Modulith GitHub — https://github.com/spring-projects/spring-modulith
