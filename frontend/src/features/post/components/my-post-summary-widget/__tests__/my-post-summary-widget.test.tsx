import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { getMyPostSummary } from "@/features/post/api/post-api"
import { MyPostSummaryWidget } from "@/features/post/components/my-post-summary-widget/my-post-summary-widget"

vi.mock("@/features/post/api/post-api", () => ({
  getMyPostSummary: vi.fn(),
}))

describe("MyPostSummaryWidget", () => {
  it("내 게시글 통계와 최근 AI 칼럼를 표시한다", async () => {
    vi.mocked(getMyPostSummary).mockResolvedValue({
      totalCount: 4,
      publishedThisMonth: 2,
      llmReportCount: 3,
      recentPosts: [
        {
          id: "post-1",
          authorName: "테스터",
          title: "AI 시장 리포트",
          summary: "요약",
          category: "TREND",
          readTimeMinutes: 2,
          sourceType: "LLM_REPORT",
          sourceUrl: "https://example.com/article",
          llmProvider: "OPENAI:gpt-4o-mini",
          publishedAt: "2026-06-21T00:00:00Z",
        },
      ],
    })

    render(<MyPostSummaryWidget />)

    expect(await screen.findByText("AI 시장 리포트")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getAllByText(/LLM 리포트/)).toHaveLength(2)
  })

  it("조회 실패 상태를 표시한다", async () => {
    vi.mocked(getMyPostSummary).mockRejectedValue(new Error("failed"))

    render(<MyPostSummaryWidget />)

    expect(
      await screen.findByText("게시글 요약을 불러오지 못했습니다.")
    ).toBeInTheDocument()
  })
})
