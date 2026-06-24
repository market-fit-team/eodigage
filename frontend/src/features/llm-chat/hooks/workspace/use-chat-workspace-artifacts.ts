"use client"

import { useMemo } from "react"
import { mapArtifactItem } from "@/features/llm-chat/lib/workspace/map-artifact-item"
import { useListArtifactsApiV1AgentArtifactsGet } from "@/shared/api/generated/agent/endpoints/agent-artifacts/agent-artifacts"

export function useChatWorkspaceArtifacts(threadId: string | null) {
  const query = useListArtifactsApiV1AgentArtifactsGet(
    threadId ? { thread_id: threadId } : undefined
  )

  const artifacts = useMemo(
    () => (query.data?.artifacts ?? []).map(mapArtifactItem),
    [query.data?.artifacts]
  )

  return {
    ...query,
    artifacts,
  }
}
