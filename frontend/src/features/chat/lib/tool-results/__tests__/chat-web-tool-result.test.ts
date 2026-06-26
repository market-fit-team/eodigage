import { describe, expect, it } from "vitest"
import {
  parseChatWebFetchToolResult,
  parseChatWebSearchToolResult,
} from "@/features/chat/lib/tool-results/chat-web-tool-result"

describe("chatWebToolResult", () => {
  it("문자열 JSON 웹 검색 결과를 구조화된 객체로 파싱한다.", () => {
    const result = parseChatWebSearchToolResult(
      JSON.stringify({
        query: "성수동 팝업 스토어",
        page: 1,
        results_count: 12,
        results: [
          {
            rank: 1,
            title: "성수 팝업 트렌드",
            url: "https://example.com/search",
            snippet: "상위 요약",
            engine: "brave",
            engines: ["brave", "bing"],
            published_date: "2026-06-26",
          },
        ],
      })
    )

    expect(result).toEqual({
      query: "성수동 팝업 스토어",
      page: 1,
      results_count: 12,
      results: [
        {
          rank: 1,
          title: "성수 팝업 트렌드",
          url: "https://example.com/search",
          snippet: "상위 요약",
          engine: "brave",
          engines: ["brave", "bing"],
          published_date: "2026-06-26",
        },
      ],
    })
  })

  it("웹 fetch 결과는 필수 필드가 빠지면 null을 반환한다.", () => {
    const result = parseChatWebFetchToolResult({
      requested_url: "https://example.com",
      final_url: "https://example.com",
      status_code: 200,
      content_type: "text/plain",
      truncated: false,
    })

    expect(result).toBeNull()
  })
})
