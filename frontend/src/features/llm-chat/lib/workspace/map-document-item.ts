import type { ChatWorkspaceDocumentItem } from "@/features/llm-chat/types/workspace/chat-workspace"
import type { DocumentResponse } from "@/shared/api/generated/agent/schemas"

const normalizeTitle = (title: string | null, type: string) => {
  return title?.trim() || `${type} 문서`
}

const buildPreview = (rawText: string) => {
  return rawText.trim().slice(0, 140)
}

export const mapDocumentItem = (
  document: DocumentResponse
): ChatWorkspaceDocumentItem => ({
  id: document.id,
  type: document.type,
  title: normalizeTitle(document.title, document.type),
  summary: document.summary,
  preview: buildPreview(document.raw_text),
  updatedAt: document.updated_at,
})
