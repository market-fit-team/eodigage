import type { AssembledToolCall } from "@langchain/langgraph-sdk/stream"
import type {
  ChatWebFetchToolResult,
  ChatWebSearchToolResult,
} from "@/features/chat/lib/tool-results/chat-web-tool-result"
import type { HitlInterrupt } from "@/features/chat/types/hitl-interrupt-payload"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

export type ChatLeftTab = "threads" | "library" | "onboarding" | "memory"

export type ChatOnboardingResultPreview = {
  resultCode: string
  profileName: string
  isDefault: boolean
  savedLabel: string | null
  savedSource: string | null
  selectedCategoryCode?: string | null
}

export type ChatDetailDialogState =
  | {
      kind: "library-document"
      document: DocumentResponse
    }
  | {
      kind: "onboarding-result"
      result: ChatOnboardingResultPreview
    }

export type ChatRightPanel =
  | {
      kind: "library"
    }
  | {
      kind: "library-document"
      document: DocumentResponse
    }
  | {
      kind: "artifact"
      artifact: ArtifactResponse
    }
  | {
      kind: "web-search"
      result: ChatWebSearchToolResult
    }
  | {
      kind: "web-fetch"
      result: ChatWebFetchToolResult
    }
  | {
      kind: "thinking"
      title: string
      reasoning?: string
      toolCalls: AssembledToolCall[]
    }
  | {
      kind: "hitl"
      interrupts: HitlInterrupt[]
    }
