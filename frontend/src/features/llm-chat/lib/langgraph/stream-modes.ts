export const CHAT_STREAM_MODES = [
  "values",
  "messages-tuple",
  "tools",
  "updates",
] as const

export type ChatStreamMode = (typeof CHAT_STREAM_MODES)[number]

// Agent Server native stream endpoint는 stream_mode 배열을 받을 수 있고,
// messages-tuple은 LLM token과 metadata를 tuple로 흘려보내는 공식 token stream mode입니다.
// tools는 @langchain/langgraph-sdk useStream().toolProgress projection을 살리기 위한 mode입니다.
// 근거:
// - https://docs.langchain.com/langsmith/streaming#stream-multiple-modes
// - https://docs.langchain.com/langsmith/streaming#llm-tokens
// - https://github.com/langchain-ai/langgraph/issues/7986
