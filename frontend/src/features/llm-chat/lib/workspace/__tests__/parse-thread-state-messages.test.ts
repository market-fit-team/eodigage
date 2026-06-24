import { describe, expect, it } from "vitest"
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages"
import { parseThreadStateMessages } from "@/features/llm-chat/lib/workspace/parse-thread-state-messages"
import type { ThreadState } from "@/shared/api/generated/agent/schemas"

const createThreadState = (messages: unknown[]): ThreadState =>
  ({
    values: {
      messages,
    },
    next: [],
    checkpoint: {
      thread_id: "thread-1",
    },
    metadata: {},
    created_at: "2026-06-24T00:00:00.000Z",
  }) as ThreadState

describe("parseThreadStateMessages", () => {
  it("기본 human, ai, tool 메시지를 BaseMessage로 복원한다.", () => {
    const restored = parseThreadStateMessages(
      createThreadState([
        {
          id: "human-1",
          type: "human",
          content: "안녕",
        },
        {
          id: "ai-1",
          type: "ai",
          content: "반가워요",
          tool_calls: [
            {
              id: "call-1",
              name: "search_web",
              args: {
                query: "market fit",
              },
            },
          ],
        },
        {
          id: "tool-1",
          type: "tool",
          content: "검색 완료",
          tool_call_id: "call-1",
        },
      ])
    )

    expect(restored).toHaveLength(3)
    expect(restored[0]).toBeInstanceOf(HumanMessage)
    expect(restored[1]).toBeInstanceOf(AIMessage)
    expect(restored[2]).toBeInstanceOf(ToolMessage)
    expect(restored[1].text).toBe("반가워요")
  })

  it("미지원 message shape는 건너뛰고 배열 content는 텍스트로 합친다.", () => {
    const restored = parseThreadStateMessages(
      createThreadState([
        {
          id: "system-1",
          type: "system",
          content: [
            { type: "text", text: "첫 줄" },
            { type: "text", text: "둘째 줄" },
          ],
        },
        {
          id: "unknown-1",
          type: "custom",
          content: "무시됨",
        },
      ])
    )

    expect(restored).toHaveLength(1)
    expect(restored[0].text).toContain("첫 줄")
    expect(restored[0].text).toContain("둘째 줄")
  })
})
