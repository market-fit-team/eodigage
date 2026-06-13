# Scheduled Posts

예약 게시글 기능은 사용자가 미래 시각에 루트 게시글 또는 댓글을 발행하도록 예약하는 기능이다. 현재 설계의 핵심은 **예약 발행이 일반 게시글 생성과 같은 `PostCommandService` 내부 생성 로직을 타는 것**이다.

## 구성 요소

| 구성 요소                         | 위치                                       | 역할                                   |
| --------------------------------- | ------------------------------------------ | -------------------------------------- |
| `ScheduledPostCommandController`  | `api/scheduledpost`                        | 예약 생성/수정/취소 API                |
| `ScheduledPostQueryController`    | `api/scheduledpost`                        | 예약 목록 조회 API                     |
| `ScheduledPostCommandService`     | `core/scheduledpost`                       | 예약 생성/수정/취소 command            |
| `ScheduledPostFailureService`     | `core/scheduledpost`                       | 발행 실패 상태 기록                    |
| `ScheduledPostQueryService`       | `application/scheduledpost`                | 예약 목록 조회                         |
| `ScheduledPostPublisherScheduler` | `infrastructure/messaging/scheduledpost`   | due 예약 조회 후 발행 queue 투입       |
| `ScheduledPostPublishConsumer`    | `infrastructure/messaging/scheduledpost`   | queue message 소비 후 실제 게시글 생성 |
| `ScheduledPostRepository`         | `infrastructure/persistence/scheduledpost` | 예약 저장/조회/claim 쿼리              |
| `PostDraft`                       | `core/post`                                | 일반/예약 게시글 생성 입력 모델        |
| `PostCommandService`              | `core/post`                                | 실제 게시글/댓글 생성 공통 로직        |

## API

```text
GET    /api/v1/scheduled-posts
POST   /api/v1/scheduled-posts
PUT    /api/v1/scheduled-posts/{id}
DELETE /api/v1/scheduled-posts/{id}
```

생성 request:

```json
{
  "content": "미래에 발행할 내용",
  "parentId": null,
  "mediaAttachmentIds": [1, 2],
  "scheduledAt": "2026-05-26T09:00:00Z"
}
```

- `parentId`가 없으면 루트 게시글 예약이다.
- `parentId`가 있으면 해당 게시글에 대한 예약 댓글이다.
- `content` 또는 `mediaAttachmentIds` 중 하나는 필요하다.
- `scheduledAt`은 현재 시각보다 최소 1분 이후여야 한다.

## 상태 모델

```text
SCHEDULED -> PUBLISHING -> PUBLISHED
          -> CANCELED
          -> FAILED
```

| 상태         | 의미                         |
| ------------ | ---------------------------- |
| `SCHEDULED`  | 예약됨                       |
| `PUBLISHING` | consumer가 발행 claim 완료   |
| `PUBLISHED`  | 실제 게시글로 발행 완료      |
| `CANCELED`   | 사용자가 취소                |
| `FAILED`     | 발행 중 예외 발생            |

`ScheduledPostRepository.claimForPublishing(id, now)`가 0을 반환하면 이미 다른 consumer가 처리했거나 발행 대상 상태가 아니므로 메시지를 무시한다. 이 claim 단계가 중복 발행 방어의 핵심이다.

## DB Schema

테이블:

```text
scheduled_posts
```

주요 컬럼:

- `user_id`
- `content`
- `parent_id`
- `media_attachment_ids`
- `scheduled_at`
- `status`
- `published_post_id`
- `locked_at`
- `published_at`
- `failed_reason`
- `created_at`
- `updated_at`

`media_attachment_ids`는 예약 시점에 선택한 첨부 ID를 JSONB로 저장한다. 실제 attach는 게시글이 만들어지는 발행 시점에 `PostCommandService`에서 수행한다.

## 생성/발행 흐름

### 1. 예약 생성

```text
ScheduledPostCommandController
  -> CurrentUserService.getRequiredUser(...)
  -> new PostDraft(request.content(), request.safeMediaAttachmentIds())
  -> ScheduledPostCommandService.create(user, draft, parentId, scheduledAt)
  -> ScheduledPost.create(user, draft, parent, scheduledAt)
  -> scheduled_posts row status=SCHEDULED
```

예약 생성 시점에 `PostDraft`를 사용하므로 일반 게시글과 동일하게 아래 규칙을 적용한다.

- 내용 또는 이미지 중 하나는 필수
- 미디어 첨부는 최대 4개
- null media list는 빈 리스트로 정규화

### 2. due 예약 enqueue

```text
ScheduledPostPublisherScheduler
  -> findDueIds(now, PageRequest.of(0, 100))
  -> ScheduledPostPublishMessage 생성
  -> RabbitMQ exchange로 publish
```

scheduler는 실제 게시글을 만들지 않는다. due 예약 ID를 message로 넘기고, 발행 책임은 consumer가 가진다.

### 3. consumer 발행

```text
ScheduledPostPublishConsumer
  -> claimForPublishing(scheduledPostId, now)
  -> ScheduledPost 조회
  -> scheduledPost.toPostDraft()
  -> parent 없음: PostCommandService.createRootFromScheduled(user, draft)
  -> parent 있음: PostCommandService.createReplyFromScheduled(user, parent, draft)
  -> scheduledPost.markPublished(publishedPost)
  -> ScheduledPostPublishedEvent 발행
```

`createRootFromScheduled`와 `createReplyFromScheduled`는 public entrypoint만 예약 전용이고, 내부에서는 일반 생성과 같은 private helper를 호출한다.

```text
create(...)                  -> createRootPost(...)
createRootFromScheduled(...) -> createRootPost(...)

createReply(...)              -> createReplyPost(...)
createReplyFromScheduled(...) -> createReplyPost(...)
```

이 디자인으로 예약 발행도 일반 게시글 작성과 같은 부수 효과를 공유한다.

- `posts` cache evict
- media attachment 소유자/상태 검증 및 attach
- 댓글 발행 시 reply notification 생성
- semantic index upsert event 발행
- 삭제된 parent에 대한 reply 방어

## RabbitMQ

Queue:

```text
post.scheduled.publish.queue
```

Routing key:

```text
post.scheduled.publish
```

DLQ:

```text
post.scheduled.publish.dlq
```

## RLS 정책

예약 게시글은 소유자만 조회/생성/수정할 수 있다.

```sql
app_current_user_id() IS NOT NULL
AND user_id = app_current_user_id()
```

command service는 사용자 요청 처리 시 `DbSessionContext`에 현재 사용자 ID를 설정한다. scheduler/consumer가 시스템 작업으로 row를 처리해야 하는 경우에는 RLS와 service user 권한 설계를 별도로 검토해야 한다.

## 실패 처리

consumer 발행 중 예외가 발생하면 `ScheduledPostFailureService`가 예약을 `FAILED`로 전이하고 `failed_reason`을 기록한다. 예외는 다시 던져 RabbitMQ retry/DLQ 정책과 함께 동작하게 한다.

실패 시 확인할 것:

- `FAILED` 상태 전이
- `failed_reason` 기록
- message retry/DLQ 이동
- 같은 예약이 중복 발행되지 않도록 claim/status 체크
- 발행 성공 후 `published_post_id` 기록

## 테스트 포인트

- 과거/현재보다 너무 이른 시각 예약을 막는가?
- content 없이 media만 있는 예약도 `PostDraft` 규칙에 따라 허용되는가?
- 미디어가 4개를 초과하면 일반/예약 모두 같은 오류가 나는가?
- 본인의 예약만 조회/수정/취소 가능한가?
- due 예약만 queue에 들어가는가?
- consumer가 중복 메시지를 받아도 중복 발행하지 않는가?
- parent post가 삭제되었을 때 reply 예약은 발행 중 실패/방어되는가?
- 발행 성공 시 일반 게시글과 같은 캐시 무효화, 알림, semantic sync가 실행되는가?
- 발행 실패 시 `FAILED`와 DLQ가 기대대로 동작하는가?

## 확장 아이디어

- 예약 발행 직전 알림
- timezone-aware scheduling
- retry policy / exponential backoff
- admin DLQ re-drive API
