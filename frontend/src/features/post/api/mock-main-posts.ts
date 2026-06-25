import type { MainPost } from "@/features/post/api/get-main-posts"

export const mockMainPosts: MainPost[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "AI 기반 창업 시장 예시 리포트",
    summary:
      "개발 환경에서 메인 Post API를 불러오지 못했을 때 화면 확인을 돕기 위한 예시 데이터입니다.",
    thumbnailUrl: null,
    sourceType: "LLM_REPORT",
    createdAt: "2026-06-21T10:00:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "프랜차이즈 트렌드 예시 포스트",
    summary:
      "실제 API 응답이 실패한 경우에만 노출되는 개발용 메인 캐러셀 예시입니다.",
    thumbnailUrl: null,
    sourceType: "CRAWLING",
    createdAt: "2026-06-20T09:00:00Z",
  },
]
