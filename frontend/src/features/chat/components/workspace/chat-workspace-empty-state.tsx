"use client"

import { ChatWelcomeScreen } from "@/features/chat/components/workspace/chat-welcome-screen"
import { ChatWorkspaceComposer } from "@/features/chat/components/workspace/chat-workspace-composer"
import type {
  ChatModelSelectionControls,
  ToolPolicyControls,
} from "@/features/chat/hooks/langgraph-chat-stream-context"
import type { ChatModelOption } from "@/features/chat/types/chat-model-selection"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

type ChatWorkspaceEmptyStateProps = {
  documents: DocumentResponse[]
  draft: string
  isPending?: boolean
  modelSelection: ChatModelSelectionControls
  models: ChatModelOption[]
  toolPolicy: ToolPolicyControls
  onChangeDraft: (value: string) => void
  onSubmit: (message: string) => Promise<void> | void
}

const EMPTY_ARTIFACTS: ArtifactResponse[] = []

export function ChatWorkspaceEmptyState({
  documents,
  draft,
  isPending = false,
  modelSelection,
  models,
  toolPolicy,
  onChangeDraft,
  onSubmit,
}: ChatWorkspaceEmptyStateProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <ChatWelcomeScreen onSelectSuggestion={onChangeDraft} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border/15 bg-background px-6 py-4">
        <ChatWorkspaceComposer
          artifacts={EMPTY_ARTIFACTS}
          documents={documents}
          draft={draft}
          disabled={isPending}
          models={models}
          modelSelection={modelSelection}
          toolPolicy={toolPolicy}
          onChangeDraft={onChangeDraft}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
