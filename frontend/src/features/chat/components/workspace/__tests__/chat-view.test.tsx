import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ChatView } from "@/features/chat/components/workspace/chat-view"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

const sendMessage = vi.fn().mockResolvedValue(undefined)

vi.mock("@/features/chat/hooks/use-langgraph-chat-stream", () => ({
  useLangGraphChatStream: () => ({
    hitlInterrupts: [],
    isBusy: false,
    isHydrating: false,
    localNotice: null,
    messages: [],
    modelSelection: {
      model: "gpt-5-mini",
    },
    resume: vi.fn(),
    sendMessage,
    toolCalls: [],
  }),
}))

vi.mock("@/features/chat/providers/chat-workspace-provider", () => ({
  useChatWorkspace: () => ({
    selectedArtifactIds: ["artifact-1"],
    selectedDocumentIds: ["doc-1"],
    setIsSelectionLocked: vi.fn(),
    setRightPanel: vi.fn(),
    toggleArtifact: vi.fn(),
    toggleDocument: vi.fn(),
  }),
}))

vi.mock(
  "@/shared/api/generated/agent/endpoints/agent-feedback/agent-feedback",
  () => ({
    useUpsertMessageFeedbackApiV1AgentMessagesMessageIdFeedbackPost: () => ({
      mutate: vi.fn(),
    }),
  })
)

const documents: DocumentResponse[] = [
  {
    id: "doc-1",
    type: "markdown",
    title: "문서",
    summary: null,
    raw_text: "본문",
    source_artifact_id: null,
    created_at: "2026-06-25T00:00:00Z",
    updated_at: "2026-06-25T00:00:00Z",
  },
]

const artifacts: ArtifactResponse[] = [
  {
    id: "artifact-1",
    thread_id: "thread-1",
    langgraph_thread_id: "lg-thread-1",
    source_message_id: null,
    source_tool_call_id: null,
    type: "markdown",
    title: "아티팩트",
    summary: null,
    raw_text: "본문",
    version: 1,
    created_at: "2026-06-25T00:00:00Z",
    updated_at: "2026-06-25T00:00:00Z",
  },
]

describe("ChatView", () => {
  it("선택된 문서와 아티팩트 id를 메시지 전송 옵션에 포함한다.", () => {
    const { container } = render(
      <ChatView
        activeThreadTitle="새 대화"
        appThreadId="thread-1"
        artifacts={artifacts}
        documents={documents}
        isRightPanelOpen={false}
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onToggleRightPanel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText("메시지를 입력하세요..."), {
      target: { value: "테스트 메시지" },
    })
    fireEvent.click(container.querySelector("#chat-send-btn")!)

    expect(sendMessage).toHaveBeenCalledWith("테스트 메시지", {
      selectedArtifactIds: ["artifact-1"],
      selectedDocumentIds: ["doc-1"],
    })
  })
})
