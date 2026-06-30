"use client"

import { RightSidebar } from "@/features/chat/components/workspace/right-sidebar"
import type { HitlDecision } from "@/features/chat/types/hitl-interrupt-payload"
import type { ChatRightPanel } from "@/features/chat/types/workspace"
import type { DocumentResponse } from "@/shared/api/generated/agent/schemas"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/shared/components/ui/sheet"

type MapChatOverlayPanelProps = {
  panel: ChatRightPanel | null
  documents: DocumentResponse[]
  isDocumentsLoading?: boolean
  onClose: () => void
  onOpenDocument: (document: DocumentResponse) => void
  onHitlDecide?: (decisions: HitlDecision[]) => void
}

export function MapChatOverlayPanel({
  panel,
  documents,
  isDocumentsLoading,
  onClose,
  onOpenDocument,
  onHitlDecide,
}: MapChatOverlayPanelProps) {
  return (
    <Sheet open={panel !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="top-0 right-0 bottom-0 h-dvh w-full border-l p-0 sm:w-[28rem] sm:max-w-[28rem] md:w-[32rem] md:max-w-[32rem]"
      >
        <SheetTitle className="sr-only">채팅 상세 패널</SheetTitle>
        <SheetDescription className="sr-only">
          아티팩트, 문서, 도구 호출 결과를 확인합니다.
        </SheetDescription>
        {panel ? (
          <RightSidebar
            panel={panel}
            documents={documents}
            isDocumentsLoading={isDocumentsLoading}
            onClose={onClose}
            onOpenDocument={onOpenDocument}
            onHitlDecide={onHitlDecide}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
