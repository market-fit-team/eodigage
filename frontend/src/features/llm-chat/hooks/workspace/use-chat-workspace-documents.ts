"use client"

import { useMemo } from "react"
import { mapDocumentItem } from "@/features/llm-chat/lib/workspace/map-document-item"
import { useListDocumentsApiV1AgentDocumentsGet } from "@/shared/api/generated/agent/endpoints/agent-documents/agent-documents"

export function useChatWorkspaceDocuments() {
  const query = useListDocumentsApiV1AgentDocumentsGet()

  const documents = useMemo(
    () => (query.data?.documents ?? []).map(mapDocumentItem),
    [query.data?.documents]
  )

  return {
    ...query,
    documents,
  }
}
