import { describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { RightSidebar } from "@/features/chat/components/workspace/right-sidebar"
import { ChatWorkspaceProvider } from "@/features/chat/providers/chat-workspace-provider"
import type { ChatRightPanel } from "@/features/chat/types/workspace"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"

vi.mock(
  "@/shared/api/generated/agent/endpoints/agent-artifacts/agent-artifacts",
  () => ({
    useSaveArtifactAsDocumentApiV1AgentArtifactsArtifactIdSaveAsDocumentPost:
      () => ({
        mutate: vi.fn(),
        isPending: false,
      }),
  })
)

const chartDocument: DocumentResponse = {
  id: "doc-1",
  type: "commercial_report",
  title: "상권 리포트",
  summary: "차트가 포함된 문서",
  raw_text: `
# 요약

\`\`\`chart
{
  "type": "pie",
  "title": "유입 채널 비중",
  "nameKey": "name",
  "dataKey": "value",
  "data": [
    {"name": "검색", "value": 62},
    {"name": "SNS", "value": 38}
  ]
}
\`\`\`
`,
  source_artifact_id: null,
  created_at: "2026-06-25T00:00:00Z",
  updated_at: "2026-06-25T00:00:00Z",
}

const codeArtifact: ArtifactResponse = {
  id: "artifact-1",
  thread_id: "thread-1",
  langgraph_thread_id: "lg-thread-1",
  source_message_id: null,
  source_tool_call_id: null,
  type: "code",
  title: "예제 코드",
  summary: null,
  raw_text: "const value = 1",
  version: 1,
  created_at: "2026-06-25T00:00:00Z",
  updated_at: "2026-06-25T00:00:00Z",
}

const webSearchPanel: ChatRightPanel = {
  kind: "web-search",
  result: {
    query: "성수동 팝업 스토어",
    page: 1,
    results_count: 2,
    results: [
      {
        rank: 1,
        title: "성수 팝업 트렌드",
        url: "https://example.com/search",
        snippet: "검색 요약",
        engine: "brave",
        engines: ["brave"],
        published_date: "2026-06-26",
      },
    ],
  },
}

const webFetchPanel: ChatRightPanel = {
  kind: "web-fetch",
  result: {
    requested_url: "https://example.com/search",
    final_url: "https://example.com/final",
    status_code: 200,
    content_type: "text/html",
    title: "성수 팝업 상세",
    content: "본문 미리보기",
    truncated: false,
  },
}

describe("RightSidebar", () => {
  it("라이브러리 문서 상세에서 마크다운과 차트를 렌더링한다.", () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspaceProvider>
          <RightSidebar
            panel={{
              kind: "library-document",
              document: chartDocument,
            }}
            documents={[chartDocument]}
            onClose={vi.fn()}
            onOpenDocument={vi.fn()}
          />
        </ChatWorkspaceProvider>
      </QueryClientProvider>
    )

    expect(screen.getByText("유입 채널 비중")).toBeInTheDocument()
  })

  it("code 타입 아티팩트는 기존 raw text 블록으로 렌더링한다.", () => {
    const panel: ChatRightPanel = {
      kind: "artifact",
      artifact: codeArtifact,
    }
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspaceProvider>
          <RightSidebar
            panel={panel}
            documents={[]}
            onClose={vi.fn()}
            onOpenDocument={vi.fn()}
          />
        </ChatWorkspaceProvider>
      </QueryClientProvider>
    )

    expect(screen.getByText("const value = 1")).toBeInTheDocument()
    expect(screen.queryByText("차트 블록을 렌더링하지 못했습니다.")).toBeNull()
    expect(screen.getByLabelText("라이브러리에 저장")).toBeInTheDocument()
    expect(screen.getByLabelText("채팅에 추가")).toBeInTheDocument()
  })

  it("웹 검색 패널은 검색 결과 목록과 외부 링크를 렌더링한다.", () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspaceProvider>
          <RightSidebar
            panel={webSearchPanel}
            documents={[]}
            onClose={vi.fn()}
            onOpenDocument={vi.fn()}
          />
        </ChatWorkspaceProvider>
      </QueryClientProvider>
    )

    expect(screen.getAllByText("성수동 팝업 스토어")).toHaveLength(2)
    expect(screen.getByText("성수 팝업 트렌드")).toBeInTheDocument()
    expect(
      screen.getByLabelText("성수 팝업 트렌드 새 탭에서 열기")
    ).toBeInTheDocument()
  })

  it("웹 fetch 패널은 메타데이터와 정규화된 본문을 렌더링한다.", () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <ChatWorkspaceProvider>
          <RightSidebar
            panel={webFetchPanel}
            documents={[]}
            onClose={vi.fn()}
            onOpenDocument={vi.fn()}
          />
        </ChatWorkspaceProvider>
      </QueryClientProvider>
    )

    expect(screen.getAllByText("성수 팝업 상세")).toHaveLength(2)
    expect(screen.getByText("본문 미리보기")).toBeInTheDocument()
    expect(screen.getByText("요청 URL")).toBeInTheDocument()
    expect(screen.getByText("최종 URL")).toBeInTheDocument()
  })
})
