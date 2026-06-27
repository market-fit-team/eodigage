import { createContext } from "react"
import type { BaseMessage } from "@langchain/core/messages"
import type { AssembledToolCall } from "@langchain/langgraph-sdk/stream"
import type { ToolPermissionPreset } from "@/features/chat/lib/tool-policy/tool-permission-presets"
import type {
  ChatModelOption,
  ChatModelSelection,
} from "@/features/chat/types/chat-model-selection"
import type {
  HitlDecision,
  HitlInterrupt,
} from "@/features/chat/types/hitl-interrupt-payload"
import type { LlmChatStreamStatus } from "@/features/chat/types/langgraph-chat-state"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"
import type { ToolPolicyState } from "@/features/chat/types/tool-policy-state"

export type ChatModelSelectionControls = ChatModelSelection & {
  selectedModel: ChatModelOption
  selectModel: (modelId: string) => void
  selectReasoningEffort: (
    reasoningEffort: ChatModelSelection["reasoningEffort"]
  ) => void
}

export type ToolPolicyControls = ToolPolicyState & {
  selectedPreset: ToolPermissionPreset | null
  selectPreset: (preset: ToolPermissionPreset) => void
  toggleTool: (toolName: string) => void
  resetToDefault: () => void
}

export type ChatTurnOptions = {
  selectedDocumentIds?: string[]
  selectedArtifactIds?: string[]
}

export type LangGraphChatStreamContextValue = {
  tools: LlmToolDefinition[]
  models: ChatModelOption[]
  modelSelection: ChatModelSelectionControls
  toolPolicy: ToolPolicyControls
  threadId: string | null
  messages: BaseMessage[]
  toolCalls: AssembledToolCall[]
  hitlInterrupts: HitlInterrupt[]
  localNotice: string | null
  isBusy: boolean
  isHydrating: boolean
  hasPendingInterrupt: boolean
  streamStatus: LlmChatStreamStatus
  sendMessage: (content: string, options?: ChatTurnOptions) => Promise<void>
  resume: (decisions: HitlDecision[]) => Promise<void>
  resetChat: () => Promise<void>
}

export const LangGraphChatStreamContext =
  createContext<LangGraphChatStreamContextValue | null>(null)
