import type { ChatWorkspaceArtifactItem } from "@/features/llm-chat/types/workspace/chat-workspace"
import type { ArtifactResponse } from "@/shared/api/generated/agent/schemas"

const normalizeTitle = (title: string | null, type: string) => {
  return title?.trim() || `${type} 아티팩트`
}

const buildPreview = (rawText: string) => {
  return rawText.trim().slice(0, 140)
}

export const mapArtifactItem = (
  artifact: ArtifactResponse
): ChatWorkspaceArtifactItem => ({
  id: artifact.id,
  threadId: artifact.thread_id,
  langgraphThreadId: artifact.langgraph_thread_id,
  type: artifact.type,
  title: normalizeTitle(artifact.title, artifact.type),
  summary: artifact.summary,
  preview: buildPreview(artifact.raw_text),
  version: artifact.version,
  updatedAt: artifact.updated_at,
  sourceMessageId: artifact.source_message_id,
  sourceToolCallId: artifact.source_tool_call_id,
})
