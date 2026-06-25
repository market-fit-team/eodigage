import type { ChatModelSelection } from "@/features/chat/types/chat-model-selection"
import type { ToolPolicyState } from "@/features/chat/types/tool-policy-state"

export type LangGraphChatContext = {
  model: string
  reasoning_effort: string
  allowed_tools: string[]
  interrupt_on: ToolPolicyState["interruptOn"]
  app_thread_id?: string
  selected_document_ids?: string[]
  selected_artifact_ids?: string[]
}

export const buildSubmitContext = (
  modelSelection: ChatModelSelection,
  toolPolicy: ToolPolicyState,
  appThreadId?: string,
  selectedDocumentIds?: string[],
  selectedArtifactIds?: string[]
): LangGraphChatContext => ({
  // Protocol V2 submit/respond는 config.configurable을 통해 실행 context를 전달한다.
  model: modelSelection.model,
  reasoning_effort: modelSelection.reasoningEffort,
  allowed_tools: toolPolicy.allowedTools,
  interrupt_on: toolPolicy.interruptOn,
  ...(appThreadId ? { app_thread_id: appThreadId } : {}),
  ...(selectedDocumentIds !== undefined
    ? { selected_document_ids: selectedDocumentIds }
    : {}),
  ...(selectedArtifactIds !== undefined
    ? { selected_artifact_ids: selectedArtifactIds }
    : {}),
})
