# MainPostCarouselWidget

메인 노출 조건을 만족하는 Post를 큰 히어로 캐러셀로 보여주는 독립 위젯이다. `.temp` 메인의 단일 슬라이드 구성과 중립적인 흑백 톤을 참고하되, 실제 API에서 받은 제목·요약·썸네일·출처·발행일을 표시한다.

## Container 사용법

`frontend/src/app/page.tsx`를 이 feature에서 수정하지 않는다. 메인 페이지를 소유한 코드에서 container를 import해 원하는 위치에 붙인다.

```tsx
import { MainPostCarouselWidgetContainer } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget-container"

export function MainReportSection() {
  return <MainPostCarouselWidgetContainer limit={10} />
}
```

Container는 `GET /api/post/api/posts/main?limit=10`을 호출하고 loading, empty, error 상태를 presentational component에 전달한다. backend 서비스 직접 경로는 `/api/posts/main`이다.

`limit` 기본값은 10이고 frontend와 backend 모두 최대 20으로 보정한다.

## onPostClick

위젯은 라우팅을 직접 처리하지 않는다. 카드 선택 후 이동이나 상세 패널 열기는 상위 화면에서 callback으로 주입한다.

```tsx
"use client"

import { useRouter } from "next/navigation"
import { MainPostCarouselWidgetContainer } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget-container"

export function MainReportSection() {
  const router = useRouter()

  return (
    <MainPostCarouselWidgetContainer
      limit={10}
      onPostClick={(postId) => router.push(`/posts/${postId}`)}
    />
  )
}
```

위 코드는 사용 예시일 뿐이며 이 feature는 `frontend/src/app`의 page나 route를 수정하지 않는다.

## Presentational component

데이터를 이미 보유한 화면은 container 없이 `MainPostCarouselWidget`을 직접 사용할 수 있다.

```tsx
<MainPostCarouselWidget
  posts={posts}
  isLoading={false}
  error={null}
  onPostClick={(postId) => console.log(postId)}
/>
```

표시 규칙:

- `LLM_REPORT`: `AI 칼럼`
- `CRAWLING`: `크롤링`
- `MANUAL`: `일반`
- 썸네일이 없거나 로드에 실패하면 어두운 그라데이션 fallback 표시
- 모든 화면에서 한 번에 하나의 주요 리포트를 표시
- 태블릿 이상에서는 좌우 이동 버튼을 제공
- `칼럼 보기` 버튼 선택 시 `onPostClick(postId)` 호출

실제 메인 노출 여부는 frontend가 아니라 backend의 `PUBLIC`, `PUBLISHED`, `deleted_at IS NULL` 조회 조건으로 결정한다.

Post ID와 `onPostClick`의 `postId`는 backend의 PostgreSQL UUID 계약에 맞춰 문자열로 처리한다.
