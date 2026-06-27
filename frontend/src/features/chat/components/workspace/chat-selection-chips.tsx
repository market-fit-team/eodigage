"use client"

import { X } from "lucide-react"
import {
  getArtifactTitle,
  getDocumentTitle,
} from "@/features/chat/lib/display/chat-display"
import { useChatWorkspace } from "@/features/chat/providers/chat-workspace-provider"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

type ChatSelectionChipsProps = {
  artifacts: ArtifactResponse[]
  documents: DocumentResponse[]
}

export function ChatSelectionChips({
  artifacts,
  documents,
}: ChatSelectionChipsProps) {
  const isSelectionLocked = useChatWorkspace((state) => state.isSelectionLocked)
  const selectedArtifactIds = useChatWorkspace(
    (state) => state.selectedArtifactIds
  )
  const selectedDocumentIds = useChatWorkspace(
    (state) => state.selectedDocumentIds
  )
  const toggleArtifact = useChatWorkspace((state) => state.toggleArtifact)
  const toggleDocument = useChatWorkspace((state) => state.toggleDocument)

  const selectedDocuments = documents.filter((document) =>
    selectedDocumentIds.includes(document.id)
  )
  const selectedArtifacts = artifacts.filter((artifact) =>
    selectedArtifactIds.includes(artifact.id)
  )

  if (selectedDocuments.length === 0 && selectedArtifacts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedDocuments.map((document) => (
        <Badge
          key={document.id}
          variant="secondary"
          className="gap-1 rounded-md px-2 py-0.5 text-xs"
        >
          문서 · {getDocumentTitle(document)}
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            disabled={isSelectionLocked}
            onClick={() => toggleDocument(document.id)}
          >
            <X className="size-2.5" />
            <span className="sr-only">문서 선택 해제</span>
          </Button>
        </Badge>
      ))}

      {selectedArtifacts.map((artifact) => (
        <Badge
          key={artifact.id}
          variant="secondary"
          className="gap-1 rounded-md px-2 py-0.5 text-xs"
        >
          아티팩트 · {getArtifactTitle(artifact)}
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            disabled={isSelectionLocked}
            onClick={() => toggleArtifact(artifact.id)}
          >
            <X className="size-2.5" />
            <span className="sr-only">아티팩트 선택 해제</span>
          </Button>
        </Badge>
      ))}
    </div>
  )
}
