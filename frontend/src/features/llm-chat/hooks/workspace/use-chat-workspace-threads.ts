"use client"

import { useMemo } from "react"
import { mapThreadItem } from "@/features/llm-chat/lib/workspace/map-thread-item"
import { useListThreadsApiV1AgentThreadsGet } from "@/shared/api/generated/agent/endpoints/agent-threads/agent-threads"

export function useChatWorkspaceThreads() {
  const query = useListThreadsApiV1AgentThreadsGet()

  const threads = useMemo(
    () => (query.data?.threads ?? []).map(mapThreadItem),
    [query.data?.threads]
  )

  return {
    ...query,
    threads,
  }
}
