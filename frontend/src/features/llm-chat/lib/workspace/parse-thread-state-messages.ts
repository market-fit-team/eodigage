import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  type ToolCall,
  ToolMessage,
} from "@langchain/core/messages"
import type { ThreadState } from "@/shared/api/generated/agent/schemas"

type MessageRecord = {
  [key: string]: unknown
}

const asRecord = (value: unknown): MessageRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as MessageRecord
}

const asString = (value: unknown): string | null => {
  return typeof value === "string" ? value : null
}

const parseContent = (value: unknown): string => {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const record = asRecord(item)
        if (!record) {
          return typeof item === "string" ? item : ""
        }

        const text = asString(record.text) ?? asString(record.content)
        if (text) {
          return text
        }

        // TODO: markdown/chart 블록이 구조화되어 들어오면 block type별 렌더러로 확장한다.
        return ""
      })
      .filter(Boolean)
      .join("\n")
  }

  return ""
}

const parseToolCalls = (value: unknown): ToolCall[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const record = asRecord(item)
    if (!record) {
      return []
    }

    const id = asString(record.id) ?? crypto.randomUUID()
    const name = asString(record.name)
    if (!name) {
      return []
    }

    const args =
      record.args && typeof record.args === "object" ? record.args : {}

    return [
      {
        id,
        name,
        args,
        type: "tool_call",
      } satisfies ToolCall,
    ]
  })
}

const parseMessage = (value: unknown, index: number): BaseMessage | null => {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const type = asString(record.type) ?? asString(record.role)
  const id = asString(record.id) ?? `restored-${index}`
  const content = parseContent(record.content)

  switch (type) {
    case "human":
    case "user":
      return new HumanMessage({
        id,
        content,
      })
    case "ai":
    case "assistant":
      return new AIMessage({
        id,
        content,
        tool_calls: parseToolCalls(record.tool_calls),
      })
    case "system":
      return new SystemMessage({
        id,
        content,
      })
    case "tool":
      return new ToolMessage({
        id,
        content,
        tool_call_id:
          asString(record.tool_call_id) ??
          asString(record.toolCallId) ??
          `restored-tool-${index}`,
      })
    default:
      // TODO: 새 message shape이 추가되면 여기서 안전하게 확장한다.
      return null
  }
}

const extractMessages = (state: ThreadState): unknown[] => {
  const values = state.values

  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return []
  }

  const messages = (values as MessageRecord).messages
  return Array.isArray(messages) ? messages : []
}

export const parseThreadStateMessages = (state: ThreadState): BaseMessage[] => {
  return extractMessages(state)
    .map((message, index) => parseMessage(message, index))
    .filter((message): message is BaseMessage => message !== null)
}
