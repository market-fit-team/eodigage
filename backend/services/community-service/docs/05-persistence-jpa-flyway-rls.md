# Persistence: JPA, Flyway, PostgreSQL RLS

이 서버는 Spring Data JPA와 PostgreSQL을 사용하며, Flyway SQL migration으로 schema를 관리한다. 중요한 특징은 PostgreSQL Row Level Security(RLS)를 애플리케이션 권한 방어선의 일부로 사용한다는 점이다.

## 구성 요소

| 구성 요소          | 위치                                                  | 역할                         |
| ------------------ | ----------------------------------------------------- | ---------------------------- |
| Entity             | `core/<domain>`                                       | JPA entity와 비즈니스 메서드 |
| Repository         | `infrastructure/persistence/<domain>`                 | Spring Data JPA repository   |
| Query Projection   | `infrastructure/persistence/post/query`               | 읽기 전용 view/projection    |
| Migration SQL      | `src/main/resources/db/migration`                     | Flyway versioned migrations  |
| DB session context | `infrastructure/persistence/session/DbSessionContext` | RLS용 current user 설정      |

## JPA 설정

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

`ddl-auto: validate`는 Hibernate가 schema를 생성하지 않고 Entity와 실제 DB schema가 일치하는지 검증만 한다. Schema 변경은 Flyway migration으로 수행한다.

## Flyway 설정

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    validate-on-migrate: true
    baseline-on-migrate: true
    baseline-version: 0
```

Migration 파일은 다음 naming convention을 따른다.

```text
V1__create_users_and_posts.sql
V2__enable_posts_rls.sql
V3__add_post_timestamps.sql
...
```

## 현재 migration 요약

| Version | 파일                                            | 설명                                         |
| ------- | ----------------------------------------------- | -------------------------------------------- |
| V1      | `create_users_and_posts`                        | `app_users`, `posts` 생성                    |
| V2      | `enable_posts_rls`                              | `app_current_user_id()` 함수, posts RLS 정책 |
| V3      | `add_post_timestamps`                           | `created_at`, `updated_at`, trigger, index   |
| V4      | `create_post_likes`                             | 좋아요 테이블, unique constraint, RLS        |
| V5      | `create_post_list_view`                         | 과거 목록 view                               |
| V6      | `convert_posts_to_threaded_microblog`           | thread 구조, parent/root/depth, soft delete  |
| V7      | `create_post_summary_view`                      | 현재 게시글 summary view                     |
| V8      | `create_notifications`                          | 알림 테이블, RLS                             |
| V9      | `adjust_notifications_rls_for_insert_returning` | insert returning 경로 보완                   |
| V10     | `add_notifications_delete_rls_policy`           | 알림 삭제 정책                               |
| V11     | `create_notification_delivery_events`           | 알림 delivery tracking 테이블                |
| V12     | `create_scheduled_posts`                        | 예약 게시글 테이블, RLS                      |
| V13     | `create_post_media_attachments`                 | 미디어 첨부 테이블, RLS                      |
| V14     | `add_scheduled_post_media_attachment_ids`       | 예약 게시글 media attachment id 배열과 제한  |
| V15     | `create_llm_threads`                            | LangGraph thread 소유권 테이블, RLS          |

## RLS 핵심 아이디어

PostgreSQL session setting에 현재 사용자 ID를 넣고, RLS policy가 이 값을 읽어 row 접근을 제한한다.

```sql
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::BIGINT
$$;
```

Java 쪽에서는 트랜잭션 안에서 다음을 호출한다.

```java
entityManager
    .createNativeQuery("select set_config('app.current_user_id', :userId, true)")
    .setParameter("userId", userId.toString())
    .getSingleResult();
```

세 번째 인자 `true`는 current transaction scope에 설정을 묶는다.

## 쓰기 서비스에서 RLS 설정하기

쓰기 작업에서는 repository 호출 전에 반드시 현재 사용자 ID를 DB session에 설정한다.

```java
@Transactional
public Post create(String content, List<Long> mediaAttachmentIds, User currentUser) {
    dbSessionContext.setCurrentUserId(currentUser.getId());
    Post post = Post.createRoot(content, currentUser);
    return postRepository.saveAndFlush(post);
}
```

RLS가 필요한 테이블:

- `posts`
- `post_likes`
- `notifications`
- `scheduled_posts`
- `post_media_attachments`

## posts 정책

- SELECT: 전체 공개
- INSERT: 현재 사용자와 `user_id`가 같아야 함
- UPDATE: 기존 row와 새 row 모두 현재 사용자 소유여야 함
- DELETE: 현재 사용자 소유 row만 가능

## post_likes 정책

- SELECT: 전체 공개. 전체 like count 계산을 위해 필요하다.
- INSERT: 현재 사용자 본인의 좋아요만 생성 가능
- DELETE: 현재 사용자 본인의 좋아요만 삭제 가능

## notifications 정책

- SELECT: 수신자 또는 actor가 조회 가능하도록 보완됨
- INSERT: actor가 현재 사용자여야 함
- UPDATE: 수신자만 읽음 처리 가능
- DELETE: 수신자만 삭제 가능

## scheduled_posts 정책

- SELECT/INSERT/UPDATE: user_id가 현재 사용자여야 함
- `media_attachment_ids`는 JSONB 배열이며 최대 4개까지만 허용한다.
- 예약 발행 시 저장된 media id 배열을 `ScheduledPost.toPostDraft()` 경로로 일반 게시글 생성 로직에 전달한다.

## llm_threads 정책

`llm_threads`는 upstream LangGraph thread id와 서버 사용자 소유권을 연결한다.

- `upstream_thread_id`: LangGraph Agent Server의 `thread_id`
- `owner_user_id`: 서버의 `app_users.id`
- `status`: upstream thread status snapshot
- `metadata_json`: upstream metadata snapshot
- index: `(owner_user_id, updated_at desc)`로 내 thread 목록 조회 최적화

RLS 정책:

- SELECT: 현재 사용자 소유 thread만 조회 가능
- INSERT: 현재 사용자 소유 thread만 생성 가능
- UPDATE: 기존 row와 새 row 모두 현재 사용자 소유여야 함
- DELETE: 현재 사용자 소유 thread만 삭제 가능

`LlmGatewayService`는 thread 생성/조회/stream 전에 `DbSessionContext#setCurrentUserId`를 호출하고, 애플리케이션 레벨에서도 `LlmThread#isOwnedBy`로 owner를 확인한다.

## media 정책

- owner는 자신의 media 조회/수정 가능
- attached 상태의 삭제되지 않은 media는 공개 조회 가능
- insert/update는 owner만 가능

## Query View

`post_summary_view`는 feed와 thread 조회에 필요한 값을 미리 조합한다.

포함 정보:

- 게시글 본문 / 삭제 여부
- 작성자 정보
- parent/root/depth
- like count
- reply count
- current user 기준 `liked_by_me`

RLS와 current user setting을 유지하려면 view에 `security_invoker = true`를 사용한다.

## Migration 작성 규칙

- 이미 main에 들어간 migration 파일은 수정하지 않는다.
- schema 변경은 새 `V{n}__description.sql` 파일로 추가한다.
- Entity 변경과 migration은 같은 PR에 포함한다.
- `ddl-auto=validate`가 통과해야 한다.
- RLS 대상 테이블은 `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`를 둘 다 고려한다.
- insert/update/delete 경로마다 정책을 명시한다.
- Testcontainers 기반 migration 테스트를 추가한다.

## RLS 테스트 체크리스트

- [ ] 소유자가 자신의 row를 생성/수정/삭제할 수 있는가?
- [ ] 다른 사용자가 row를 수정/삭제할 수 없는가?
- [ ] public SELECT 정책이 의도보다 많은 정보를 노출하지 않는가?
- [ ] insert returning 경로가 RLS SELECT 정책에 막히지 않는가?
- [ ] service에서 `DbSessionContext#setCurrentUserId` 호출이 누락되지 않았는가?

## 참고 링크

- Spring Data JPA Reference — https://docs.spring.io/spring-data/jpa/reference/index.html
- Flyway Migrations — https://documentation.red-gate.com/fd/migrations-271585107.html
- PostgreSQL Row Security Policies — https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL CREATE POLICY — https://www.postgresql.org/docs/current/sql-createpolicy.html
