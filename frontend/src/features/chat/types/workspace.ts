import type { AssembledToolCall } from "@langchain/langgraph-sdk/stream"
import type { HitlInterrupt } from "@/features/chat/types/hitl-interrupt-payload"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

export type ChatLeftTab = "threads" | "library" | "memory"

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
      kind: "thinking"
      title: string
      reasoning?: string
      toolCalls: AssembledToolCall[]
    }
  | {
      kind: "hitl"
      interrupts: HitlInterrupt[]
    }
