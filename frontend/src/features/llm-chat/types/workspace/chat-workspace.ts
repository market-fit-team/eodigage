import type { BaseMessage } from "@langchain/core/messages"

export type ChatWorkspaceTab =
  | "documents"
  | "artifacts"
  | "memories"
  | "onboarding"

export type ChatWorkspaceThreadItem = {
  id: string
  langgraphThreadId: string
  title: string
  subtitle: string | null
  lastMessagePreview: string | null
  messageCount: number
  isPinned: boolean
  isArchived: boolean
  lastMessageAt: string | null
  updatedAt: string
}

export type ChatWorkspaceDocumentItem = {
  id: string
  type: string
  title: string
  summary: string | null
  preview: string
  updatedAt: string
}

export type ChatWorkspaceArtifactItem = {
  id: string
  threadId: string
  langgraphThreadId: string
  type: string
  title: string
  summary: string | null
  preview: string
  version: number
  updatedAt: string
  sourceMessageId: string | null
  sourceToolCallId: string | null
}

export type ChatWorkspaceMemoryItem = {
  id: string
  content: string
  source: string
  isEnabled: boolean
  updatedAt: string
}

export type ChatWorkspaceOnboardingSummary = {
  threadId: string
  resultCode: string
  selectedCategoryCode: string | null
  source: string
  updatedAt: string
}

export type ChatWorkspaceDetailTarget =
  | {
      kind: "document"
      id: string
    }
  | {
      kind: "artifact"
      id: string
    }

export type ChatWorkspaceUiState = {
  selectedDocumentIds: string[]
  selectedArtifactIds: string[]
  activeTab: ChatWorkspaceTab
  isSidebarOpen: boolean
  isContextPanelOpen: boolean
  detailTarget: ChatWorkspaceDetailTarget | null
}

export type ChatWorkspaceThreadSnapshot = {
  messages: BaseMessage[]
}
