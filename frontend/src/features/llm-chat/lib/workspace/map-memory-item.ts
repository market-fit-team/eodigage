import type { ChatWorkspaceMemoryItem } from "@/features/llm-chat/types/workspace/chat-workspace"
import type { MemoryResponse } from "@/shared/api/generated/agent/schemas"

export const mapMemoryItem = (
  memory: MemoryResponse
): ChatWorkspaceMemoryItem => ({
  id: memory.id,
  content: memory.content,
  source: memory.source,
  isEnabled: memory.is_enabled,
  updatedAt: memory.updated_at,
})
