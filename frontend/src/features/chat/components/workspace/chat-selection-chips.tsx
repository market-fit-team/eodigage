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
  MarketFavoriteResponse,
} from "@/shared/api/generated/agent/schemas"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

type ChatSelectionChipsProps = {
  artifacts: ArtifactResponse[]
  documents: DocumentResponse[]
  marketFavorites?: MarketFavoriteResponse[]
  compact?: boolean
}

export function ChatSelectionChips({
  artifacts,
  documents,
  marketFavorites = [],
  compact = false,
}: ChatSelectionChipsProps) {
  const selectedArtifactIds = useChatWorkspace(
    (state) => state.selectedArtifactIds
  )
  const selectedDocumentIds = useChatWorkspace(
    (state) => state.selectedDocumentIds
  )
  const selectedMarketDongCodes = useChatWorkspace(
    (state) => state.selectedMarketDongCodes
  )
  const selectedOnboarding = useChatWorkspace(
    (state) => state.selectedOnboarding
  )
  const toggleArtifact = useChatWorkspace((state) => state.toggleArtifact)
  const toggleDocument = useChatWorkspace((state) => state.toggleDocument)
  const toggleMarketArea = useChatWorkspace((state) => state.toggleMarketArea)
  const setSelectedOnboarding = useChatWorkspace(
    (state) => state.setSelectedOnboarding
  )

  const selectedDocuments = documents.filter((document) =>
    selectedDocumentIds.includes(document.id)
  )
  const selectedArtifacts = artifacts.filter((artifact) =>
    selectedArtifactIds.includes(artifact.id)
  )
  const selectedMarketFavorites = marketFavorites.filter((favorite) =>
    selectedMarketDongCodes.includes(favorite.dong_code)
  )

  if (
    !selectedOnboarding &&
    selectedDocuments.length === 0 &&
    selectedArtifacts.length === 0 &&
    selectedMarketFavorites.length === 0
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedOnboarding && (
        <Badge
          variant="secondary"
          className={cn(
            "min-w-0 gap-1 rounded-md px-2 py-0.5 text-xs",
            compact && "max-w-full"
          )}
        >
          <span className="min-w-0 truncate">
            성향 · {selectedOnboarding.profileName}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            onClick={() => setSelectedOnboarding(null)}
          >
            <X className="size-2.5" />
            <span className="sr-only">성향 분석 선택 해제</span>
          </Button>
        </Badge>
      )}

      {selectedDocuments.map((document) => (
        <Badge
          key={document.id}
          variant="secondary"
          className={cn(
            "min-w-0 gap-1 rounded-md px-2 py-0.5 text-xs",
            compact && "max-w-full"
          )}
        >
          <span className="min-w-0 truncate">
            문서 · {getDocumentTitle(document)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
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
          className={cn(
            "min-w-0 gap-1 rounded-md px-2 py-0.5 text-xs",
            compact && "max-w-full"
          )}
        >
          <span className="min-w-0 truncate">
            아티팩트 · {getArtifactTitle(artifact)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            onClick={() => toggleArtifact(artifact.id)}
          >
            <X className="size-2.5" />
            <span className="sr-only">아티팩트 선택 해제</span>
          </Button>
        </Badge>
      ))}

      {selectedMarketFavorites.map((favorite) => (
        <Badge
          key={favorite.dong_code}
          variant="secondary"
          className={cn(
            "min-w-0 gap-1 rounded-md px-2 py-0.5 text-xs",
            compact && "max-w-full"
          )}
        >
          <span className="min-w-0 truncate">상권 · {favorite.dong_name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            onClick={() => toggleMarketArea(favorite.dong_code)}
          >
            <X className="size-2.5" />
            <span className="sr-only">상권 선택 해제</span>
          </Button>
        </Badge>
      ))}
    </div>
  )
}
