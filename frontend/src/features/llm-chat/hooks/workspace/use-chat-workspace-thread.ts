"use client"

import { useMemo } from "react"
import { useChatWorkspaceThreads } from "@/features/llm-chat/hooks/workspace/use-chat-workspace-threads"

export function useChatWorkspaceThread(threadId: string | null) {
  const query = useChatWorkspaceThreads()

  const thread = useMemo(
    () => query.threads.find((item) => item.id === threadId) ?? null,
    [query.threads, threadId]
  )

  return {
    ...query,
    thread,
  }
}
