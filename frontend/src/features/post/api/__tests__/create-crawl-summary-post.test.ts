import { beforeEach, describe, expect, it, vi } from "vitest"
import { fetchWithAuth } from "@/features/auth/lib/fetch-with-auth"
import { createCrawlSummaryPost } from "@/features/post/api/create-crawl-summary-post"
import type { CreateCrawlSummaryPostInput } from "@/features/post/types/post"

vi.mock("@/features/auth/lib/fetch-with-auth", () => ({
  fetchWithAuth: vi.fn(),
}))

describe("createCrawlSummaryPost", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(fetchWithAuth).mockReset()
  })

  const input: CreateCrawlSummaryPostInput = {
    url: "https://example.com/article",
    keyword: null,
    rawContent: null,
    visibility: "PUBLIC",
  }

  it("crawl-summary API에 nullable 필드를 포함한 요청을 보낸다", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue({
      id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
      title: "AI 칼럼",
      summary: "요약",
      thumbnailUrl: null,
      sourceType: "LLM_REPORT",
      sourceId: "source-1",
      createdAt: "2026-06-21T10:00:00Z",
    })

    await createCrawlSummaryPost(input)

    expect(fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/post/api/posts/crawl-summary"),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-User-Id": "local-test-user",
        },
        body: JSON.stringify(input),
      }
    )
  })

  it("production에서는 local X-User-Id 헤더를 보내지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.mocked(fetchWithAuth).mockResolvedValue({
      id: "9d68f1d4-514f-4f37-8a73-8ed43a15eb11",
      title: "AI 칼럼",
      summary: "요약",
      thumbnailUrl: null,
      sourceType: "LLM_REPORT",
      sourceId: "source-1",
      createdAt: "2026-06-21T10:00:00Z",
    })

    await createCrawlSummaryPost(input)

    expect(fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/api/post/api/posts/crawl-summary"),
      expect.objectContaining({
        headers: { "content-type": "application/json" },
      })
    )
  })
})
