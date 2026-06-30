import { describe, expect, it } from "vitest"
import { buildThreadTitle } from "@/features/chat/lib/workspace/build-thread-title"

describe("buildThreadTitle", () => {
  it("첫 메시지를 스레드 제목으로 사용한다.", () => {
    expect(buildThreadTitle("성수동 팝업 트렌드 알려줘")).toBe(
      "성수동 팝업 트렌드"
    )
  })

  it("줄바꿈과 연속 공백을 하나의 공백으로 정리한다.", () => {
    expect(buildThreadTitle("  성수동\n\n팝업\t\t트렌드  ")).toBe(
      "성수동 팝업 트렌드"
    )
  })

  it("빈 메시지는 기본 제목을 사용한다.", () => {
    expect(buildThreadTitle(" \n\t ")).toBe("새 대화")
  })
})
