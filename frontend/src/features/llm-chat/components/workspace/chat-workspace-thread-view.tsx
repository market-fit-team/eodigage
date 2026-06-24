"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChatMessagesPanel } from "@/features/llm-chat/components/chat-app/chat-messages-panel"
import { ChatWorkspaceComposerPanel } from "@/features/llm-chat/components/workspace/chat-workspace-composer-panel"
import { ChatWorkspaceHeader } from "@/features/llm-chat/components/workspace/chat-workspace-header"
import { LangGraphChatStreamProvider } from "@/features/llm-chat/hooks/langgraph-chat-stream-provider"
import { useChatModelSelection } from "@/features/llm-chat/hooks/use-chat-model-selection"
import { useLangGraphChatStream } from "@/features/llm-chat/hooks/use-langgraph-chat-stream"
import { useToolPolicy } from "@/features/llm-chat/hooks/use-tool-policy"
import { useChatWorkspaceThread } from "@/features/llm-chat/hooks/workspace/use-chat-workspace-thread"
import { parseThreadStateMessages } from "@/features/llm-chat/lib/workspace/parse-thread-state-messages"
import type { LlmChatGraphState } from "@/features/llm-chat/types/langgraph-chat-state"
import {
  useListLlmModelsApiV1LlmModelsGetSuspense,
  useListLlmToolsApiV1LlmToolsGetSuspense,
} from "@/shared/api/generated/agent/endpoints/llm/llm"
import { useGetLatestThreadStateThreadsThreadIdStateGet } from "@/shared/api/generated/agent/endpoints/threads/threads"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Skeleton } from "@/shared/components/ui/skeleton"

type ChatWorkspaceThreadViewProps = {
  threadId: string
  starterMessage?: string | null
}

function ChatWorkspaceThreadStarter({
  starterMessage,
}: {
  starterMessage?: string | null
}) {
  const router = useRouter()
  const { sendMessage } = useLangGraphChatStream()
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    if (!starterMessage || hasSubmittedRef.current) {
      return
    }

    hasSubmittedRef.current = true
    // 새 앱 스레드 진입 직후 첫 메시지는 URL query에서 한 번만 소비한다.
    // useStream threadId 재바인딩 패턴:
    // https://reference.langchain.com/javascript/langchain-react/use-stream
    void sendMessage(starterMessage)
      .then(() => {
        router.replace(window.location.pathname)
      })
      .catch(() => {
        // 첫 전송이 실패하면 같은 starter query로 다시 시도할 수 있게 잠금을 되돌린다.
        hasSubmittedRef.current = false
      })
  }, [router, sendMessage, starterMessage])

  return null
}

export function ChatWorkspaceThreadView({
  threadId,
  starterMessage,
}: ChatWorkspaceThreadViewProps) {
  const { data: tools } = useListLlmToolsApiV1LlmToolsGetSuspense({
    query: {
      select: (data) =>
        data.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          defaultAllowed: tool.default_allowed,
          allowedDecisions: tool.allowed_decisions,
        })),
    },
  })
  const { data: models } = useListLlmModelsApiV1LlmModelsGetSuspense({
    query: {
      select: (data) =>
        data.list.map((model) => ({
          id: model.id,
          object: model.object,
          created: model.created,
          supportedReasoningEfforts: model.supported_reasoning_efforts,
        })),
    },
  })
  const { thread, isLoading: isThreadLoading } =
    useChatWorkspaceThread(threadId)
  const latestStateQuery = useGetLatestThreadStateThreadsThreadIdStateGet(
    thread?.langgraphThreadId ?? "",
    undefined,
    {
      query: {
        enabled: Boolean(thread?.langgraphThreadId),
      },
    }
  )

  const toolPolicy = useToolPolicy(tools)
  const modelSelection = useChatModelSelection(models)
  const initialValues = useMemo<LlmChatGraphState | undefined>(() => {
    if (!latestStateQuery.data) {
      return undefined
    }

    // 최신 state를 먼저 보여주고 이후 공식 stream 상태로 이어받는다.
    // initialValues / thread state 참고:
    // https://reference.langchain.com/javascript/langchain-react/UseStreamOptions/initialValues
    // https://docs.langchain.com/langsmith/use-threads
    return {
      messages: parseThreadStateMessages(latestStateQuery.data),
    }
  }, [latestStateQuery.data])

  if (isThreadLoading) {
    return <Skeleton className="m-4 h-[calc(100%-2rem)] rounded-xl" />
  }

  if (!thread) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription>
            선택한 앱 스레드를 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <LangGraphChatStreamProvider
      key={thread.langgraphThreadId}
      tools={tools}
      models={models}
      modelSelection={modelSelection}
      toolPolicy={toolPolicy}
      initialValues={initialValues}
      workspaceThread={{
        appThreadId: thread.id,
        langgraphThreadId: thread.langgraphThreadId,
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <ChatWorkspaceThreadStarter starterMessage={starterMessage} />
        <ChatWorkspaceHeader
          appThreadId={thread.id}
          title={thread.title}
          subtitle={thread.subtitle}
        />
        <ChatMessagesPanel />
        <ChatWorkspaceComposerPanel currentThreadId={thread.id} />
      </div>
    </LangGraphChatStreamProvider>
  )
}
