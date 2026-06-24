"use client"

import { useMemo } from "react"
import { mapMemoryItem } from "@/features/llm-chat/lib/workspace/map-memory-item"
import { useListMemoriesApiV1AgentMemoriesGet } from "@/shared/api/generated/agent/endpoints/agent-memories/agent-memories"

export function useChatWorkspaceMemories() {
  const query = useListMemoriesApiV1AgentMemoriesGet()

  const memories = useMemo(
    () => (query.data?.memories ?? []).map(mapMemoryItem),
    [query.data?.memories]
  )

  return {
    ...query,
    memories,
  }
}
