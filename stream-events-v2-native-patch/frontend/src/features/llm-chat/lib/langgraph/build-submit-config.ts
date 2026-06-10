import type { ChatModelSelection } from "@/features/llm-chat/types/chat-model-selection"
import type { ToolPolicyState } from "@/features/llm-chat/types/tool-policy-state"
import { CHAT_STREAM_MODES } from "@/features/llm-chat/lib/langgraph/stream-modes"

export const DEFAULT_LANGGRAPH_STREAM_MODE = CHAT_STREAM_MODES

export type LangGraphChatContext = {
  model: string
  reasoning_effort: string
  allowed_tools: string[]
  interrupt_on: ToolPolicyState["interruptOn"]
}

export const buildSubmitContext = (
  modelSelection: ChatModelSelection,
  toolPolicy: ToolPolicyState
): LangGraphChatContext => ({
  model: modelSelection.model,
  reasoning_effort: modelSelection.reasoningEffort,
  allowed_tools: toolPolicy.allowedTools,
  interrupt_on: toolPolicy.interruptOn,
})
