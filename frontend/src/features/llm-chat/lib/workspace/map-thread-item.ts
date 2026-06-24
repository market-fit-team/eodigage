import type { ChatWorkspaceThreadItem } from "@/features/llm-chat/types/workspace/chat-workspace"
import type { AgentThreadResponse } from "@/shared/api/generated/agent/schemas"

export const mapThreadItem = (
  thread: AgentThreadResponse
): ChatWorkspaceThreadItem => ({
  id: thread.id,
  langgraphThreadId: thread.langgraph_thread_id,
  title: thread.title,
  subtitle: thread.subtitle,
  lastMessagePreview: thread.last_message_preview,
  messageCount: thread.message_count,
  isPinned: thread.is_pinned,
  isArchived: thread.is_archived,
  lastMessageAt: thread.last_message_at,
  updatedAt: thread.updated_at,
})
