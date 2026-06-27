"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { HttpStatusError } from "@/features/auth/lib/fetch-with-auth"
import { ChatWorkspaceEmptyState } from "@/features/chat/components/workspace/chat-workspace-empty-state"
import { ChatWorkspaceShell } from "@/features/chat/components/workspace/chat-workspace-shell"
import { useLocalWorkspaceRuntimeSettings } from "@/features/chat/hooks/workspace/use-local-workspace-runtime-settings"
import { submitWorkspaceThreadMessage } from "@/features/chat/lib/langgraph/chat-runtime-client"
import { useChatWorkspace } from "@/features/chat/providers/chat-workspace-provider"
import type { ChatReasoningEffort } from "@/features/chat/types/chat-model-selection"
import { useListDocumentsApiV1AgentDocumentsGet } from "@/shared/api/generated/agent/endpoints/agent-documents/agent-documents"
import {
  getListThreadsApiV1AgentThreadsGetQueryKey,
  useCreateThreadApiV1AgentThreadsPost,
} from "@/shared/api/generated/agent/endpoints/agent-threads/agent-threads"
import {
  useListLlmModelsApiV1LlmModelsGet,
  useListLlmToolsApiV1LlmToolsGet,
} from "@/shared/api/generated/agent/endpoints/llm/llm"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Skeleton } from "@/shared/components/ui/skeleton"

export function ChatWorkspaceHome() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const selectedArtifactIds = useChatWorkspace(
    (state) => state.selectedArtifactIds
  )
  const selectedDocumentIds = useChatWorkspace(
    (state) => state.selectedDocumentIds
  )
  const [draft, setDraft] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createThread = useCreateThreadApiV1AgentThreadsPost()
  const documentsQuery = useListDocumentsApiV1AgentDocumentsGet()
  const toolsQuery = useListLlmToolsApiV1LlmToolsGet({
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
  const modelsQuery = useListLlmModelsApiV1LlmModelsGet({
    query: {
      select: (data) =>
        data.list.map((model) => ({
          id: model.id,
          object: model.object,
          created: model.created,
          supportedReasoningEfforts:
            model.supported_reasoning_efforts as ChatReasoningEffort[],
        })),
    },
  })

  const tools = toolsQuery.data ?? []
  const models = modelsQuery.data ?? []
  const runtimeSettings = useLocalWorkspaceRuntimeSettings({
    tools,
    models,
  })
  const runtimeControls = runtimeSettings.controls

  if (
    documentsQuery.isLoading ||
    toolsQuery.isLoading ||
    modelsQuery.isLoading
  ) {
    return (
      <ChatWorkspaceShell>
        <Skeleton className="m-4 h-[calc(100%-2rem)] rounded-xl" />
      </ChatWorkspaceShell>
    )
  }

  if (!runtimeControls) {
    return (
      <ChatWorkspaceShell>
        <div className="p-4">
          <Alert>
            <AlertDescription>
              새 채팅 실행 설정을 불러오지 못했습니다.
            </AlertDescription>
          </Alert>
        </div>
      </ChatWorkspaceShell>
    )
  }

  const handleSubmit = async (message: string) => {
    try {
      setIsSubmitting(true)
      const thread = await createThread.mutateAsync({
        data: {
          title: "새 대화",
        },
      })

      await submitWorkspaceThreadMessage({
        appThreadId: thread.id,
        content: message,
        langgraphThreadId: thread.langgraph_thread_id,
        modelSelection: runtimeControls.modelSelection,
        selectedArtifactIds,
        selectedDocumentIds,
        toolPolicy: runtimeControls.toolPolicy,
      })
      await queryClient.invalidateQueries({
        queryKey: getListThreadsApiV1AgentThreadsGetQueryKey(),
      })
      router.push(`/chat/${thread.id}`)
    } catch (error) {
      toast.error(resolveStartThreadError(error))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ChatWorkspaceShell>
      <ChatWorkspaceEmptyState
        documents={documentsQuery.data?.documents ?? []}
        draft={draft}
        isPending={isSubmitting || createThread.isPending}
        modelSelection={runtimeControls.modelSelection}
        models={models}
        toolPolicy={runtimeControls.toolPolicy}
        onChangeDraft={setDraft}
        onSubmit={handleSubmit}
      />
    </ChatWorkspaceShell>
  )
}

const resolveStartThreadError = (error: unknown) => {
  if (error instanceof HttpStatusError) {
    const detail =
      typeof error.body === "object" &&
      error.body !== null &&
      "detail" in error.body &&
      typeof error.body.detail === "string"
        ? error.body.detail
        : null

    return detail ?? "첫 메시지를 전송하지 못했습니다."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "첫 메시지를 전송하지 못했습니다."
}
