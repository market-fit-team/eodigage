# Post

`src/features/post`는 메인 AI 칼럼 캐러셀, AI 칼럼 상세 모달, 댓글 UI, 댓글 알림 UI를 담당한다.

AI 칼럼은 기본 seed 데이터와 post-service의 주간 스케줄러 기반으로 제공된다. 사용자가 화면에서 직접 "AI 리포트 생성" 또는 "최신 뉴스로 AI 칼럼 생성" 버튼을 눌러 칼럼을 만드는 기능은 현재 범위가 아니다.

사용자 대상 "칼럼 저장", "마이페이지 저장", "저장 기능 준비 중" 기능도 현재 범위가 아니다.

## Main AI Columns

`MainPostCarouselWidgetContainer`는 `/api/post/api/posts/main`으로 공개 AI 칼럼 목록을 보여준다. 칼럼을 클릭하면 상세 모달을 열고 `/api/post/api/posts/{postId}`로 전문을 조회한다.

```tsx
import { MainPostCarouselWidgetContainer } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget-container"

export default function Page() {
  return <MainPostCarouselWidgetContainer />
}
```

## Comments

AI 칼럼 상세 모달 하단에는 `PostComments`가 붙는다.

- 댓글 목록 조회는 공개 API다.
- 댓글 작성은 로그인 사용자만 가능하다.
- 댓글 수정/삭제는 작성자 본인만 가능하다.

Gateway 기준 경로:

```text
GET    /api/post/api/posts/{postId}/comments
POST   /api/post/api/posts/{postId}/comments
PUT    /api/post/api/posts/{postId}/comments/{commentId}
DELETE /api/post/api/posts/{postId}/comments/{commentId}
```

## Comment Notifications

댓글 작성 시 post-service가 `COMMENT_CREATED` 알림을 생성한다. 로그인 사용자는 `useCommentNotifications`로 SSE를 구독하고, `CommentNotificationBell`에서 알림 목록과 읽음 처리를 사용한다.

Gateway 기준 경로:

```text
GET   /api/post/api/notifications
PATCH /api/post/api/notifications/{notificationId}/read
GET   /api/post/api/notifications/events?token=<accessToken>
```

SSE 이벤트 이름은 `notification.created`다.

## Generated API

현재 post feature는 필요한 API를 `api/post-api.ts`의 직접 fetch 함수로 사용한다. `src/shared/api/generated/**`는 Orval/OpenAPI 자동 생성 산출물이므로 직접 수정하지 않는다. OpenAPI 문구 변경이 필요하면 backend controller annotation을 수정한 뒤 API 생성을 다시 실행한다.

## API Origin

```text
NEXT_PUBLIC_API_ORIGIN=http://localhost:8088
```

Gateway public path는 `/api/post`이고, post-service 내부 API path는 `/api/...`다.

## Main Files

- `api/post-api.ts`
- `hooks/use-main-posts.ts`
- `hooks/use-comment-notifications.ts`
- `components/main-post-carousel-widget/main-post-carousel-widget.tsx`
- `components/main-post-carousel-widget/main-post-carousel-widget-container.tsx`
- `components/post-comments/post-comments.tsx`
- `components/comment-notification-bell/comment-notification-bell.tsx`
- `types/post.ts`
