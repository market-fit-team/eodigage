import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createCrawlSummaryPost } from "@/features/post/api/create-crawl-summary-post"
import { getPost } from "@/features/post/api/post-api"
import { MainPostCarouselWidgetContainer } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget-container"
import { useMainPosts } from "@/features/post/hooks/use-main-posts"
import { PUBLIC_POST_REPORT_BROWSER_EVENT } from "@/features/post/lib/public-post-report-events"

const { toastInfo } = vi.hoisted(() => ({
  toastInfo: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    info: toastInfo,
  },
}))

vi.mock("@/features/post/hooks/use-main-posts", () => ({
  useMainPosts: vi.fn(),
}))

vi.mock("@/features/post/hooks/use-public-post-report-notification", () => ({
  usePublicPostReportNotification: vi.fn(),
}))

vi.mock("@/features/post/api/create-crawl-summary-post", () => ({
  createCrawlSummaryPost: vi.fn(),
}))

vi.mock("@/features/post/api/post-api", () => ({
  getPost: vi.fn(),
}))

describe("MainPostCarouselWidgetContainer", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(useMainPosts).mockReset()
    vi.mocked(getPost).mockReset()
    vi.mocked(createCrawlSummaryPost).mockReset()
    toastInfo.mockReset()
    vi.mocked(useMainPosts).mockReturnValue({
      posts: [],
      isLoading: false,
      error: null,
    })
  })

  it("리포트 보기를 누르면 상세 창에서 전문을 표시한다", async () => {
    vi.mocked(useMainPosts).mockReturnValue({
      posts: [
        {
          id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
          title: "AI 상권 리포트",
          summary: "요약입니다.",
          thumbnailUrl: null,
          sourceType: "LLM_REPORT",
          createdAt: "2026-06-21T10:00:00Z",
        },
      ],
      isLoading: false,
      error: null,
    })
    vi.mocked(getPost).mockResolvedValue({
      id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
      userId: "user-1",
      authorId: "user-1",
      authorName: "user-1",
      title: "AI 상권 리포트",
      summary: "요약입니다.",
      content: "전문 1문단\n\n전문 2문단",
      category: "TREND",
      readTimeMinutes: 3,
      sourceType: "LLM_REPORT",
      sourceUrl: "https://example.com",
      llmProvider: "OPENAI:gpt-4o-mini",
      publishedAt: "2026-06-21T10:00:00Z",
      createdAt: "2026-06-21T10:00:00Z",
      updatedAt: "2026-06-21T10:00:00Z",
      sourceId: null,
      sourceTitle: null,
      collectedAt: null,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    })

    render(<MainPostCarouselWidgetContainer />)

    fireEvent.click(
      screen.getByRole("button", { name: "AI 상권 리포트 게시글 보기" })
    )

    await waitFor(() =>
      expect(getPost).toHaveBeenCalledWith(
        "9d68f1d4-514f-4f37-8a73-8ed43a15eb11"
      )
    )
    expect(
      await screen.findByText(/전문 1문단\s+전문 2문단/)
    ).toBeInTheDocument()
  })

  it("상세 창에서 칼럼 저장 버튼을 누르면 준비 중 안내를 표시한다", async () => {
    vi.mocked(useMainPosts).mockReturnValue({
      posts: [
        {
          id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
          title: "AI 상권 리포트",
          summary: "요약입니다.",
          thumbnailUrl: null,
          sourceType: "LLM_REPORT",
          createdAt: "2026-06-21T10:00:00Z",
        },
      ],
      isLoading: false,
      error: null,
    })
    vi.mocked(getPost).mockResolvedValue({
      id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
      userId: "user-1",
      authorId: "user-1",
      authorName: "user-1",
      title: "AI 상권 리포트",
      summary: "요약입니다.",
      content: "전문입니다.",
      category: "TREND",
      readTimeMinutes: 3,
      sourceType: "LLM_REPORT",
      sourceUrl: "https://example.com",
      llmProvider: "OPENAI:gpt-4o-mini",
      publishedAt: "2026-06-21T10:00:00Z",
      createdAt: "2026-06-21T10:00:00Z",
      updatedAt: "2026-06-21T10:00:00Z",
      sourceId: null,
      sourceTitle: null,
      collectedAt: null,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    })

    render(<MainPostCarouselWidgetContainer />)

    fireEvent.click(
      screen.getByRole("button", { name: "AI 상권 리포트 게시글 보기" })
    )
    fireEvent.click(await screen.findByRole("button", { name: "칼럼 저장" }))

    expect(toastInfo).toHaveBeenCalledWith("저장 기능은 준비 중입니다.")
  })

  it("env flag가 true이면 AI 칼럼 생성 버튼을 표시한다", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_AI_COLUMN_GENERATOR", "true")

    render(<MainPostCarouselWidgetContainer />)

    expect(
      screen.getByRole("button", { name: "최신 뉴스로 AI 칼럼 생성" })
    ).toBeInTheDocument()
  })

  it("env flag가 없으면 AI 칼럼 생성 버튼을 숨긴다", () => {
    render(<MainPostCarouselWidgetContainer />)

    expect(
      screen.queryByRole("button", { name: "최신 뉴스로 AI 칼럼 생성" })
    ).not.toBeInTheDocument()
  })

  it("생성 버튼 클릭 시 crawl-summary를 호출하고 목록 갱신 이벤트를 보낸다", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_AI_COLUMN_GENERATOR", "true")
    const eventSpy = vi.fn()
    window.addEventListener(PUBLIC_POST_REPORT_BROWSER_EVENT, eventSpy)
    vi.mocked(createCrawlSummaryPost).mockResolvedValue({
      id: "post-1",
      postId: "post-1",
      postIds: ["post-1", "post-2", "post-3", "post-4"],
      createdCount: 4,
      failedCount: 0,
      title: "AI 칼럼",
      summary: "요약",
      thumbnailUrl: null,
      sourceType: "LLM_REPORT",
      sourceId: null,
      createdAt: "2026-06-21T10:00:00Z",
      debug: {
        llmProvider: "MOCK",
        llmModel: "mock-v1",
        inputUrlType: "RAW_CONTENT",
        crawledArticleCount: 1,
        skippedArticleCount: 0,
        crawledTextLength: 100,
        matchedKeywords: ["프랜차이즈"],
        matchedParagraphCount: 1,
        relevanceScore: 1,
        llmStatus: "SUMMARIZED",
        notificationEligible: true,
        notificationCategory: "FRANCHISE",
      },
    })

    render(<MainPostCarouselWidgetContainer />)
    expect(
      screen.queryByLabelText("AI 칼럼 생성용 뉴스 URL")
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: "최신 뉴스로 AI 칼럼 생성" })
    )

    expect(
      screen.getByRole("button", { name: "AI 칼럼 생성 중..." })
    ).toBeDisabled()
    await waitFor(() =>
      expect(createCrawlSummaryPost).toHaveBeenCalledWith({
        url: null,
        keyword: "프랜차이즈 창업",
        rawContent: null,
        visibility: "PUBLIC",
      })
    )
    await waitFor(() => expect(eventSpy).toHaveBeenCalled())
    window.removeEventListener(PUBLIC_POST_REPORT_BROWSER_EVENT, eventSpy)
  })

  it("생성 실패 시 오류 메시지를 표시한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_AI_COLUMN_GENERATOR", "true")
    vi.mocked(createCrawlSummaryPost).mockRejectedValue(new Error("생성 실패"))

    render(<MainPostCarouselWidgetContainer />)
    fireEvent.click(
      screen.getByRole("button", { name: "최신 뉴스로 AI 칼럼 생성" })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent("생성 실패")
  })
})
