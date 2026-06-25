import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Client } from "@langchain/langgraph-sdk"
import { useStream } from "@langchain/react"
import {
  AuthSessionError,
  HttpStatusError,
  fetchWithAuthResponse,
} from "@/features/auth/lib/fetch-with-auth"
import {
  type ChatTurnOptions,
  LangGraphChatStreamContext,
  type LangGraphChatStreamContextValue,
} from "@/features/chat/hooks/langgraph-chat-stream-context"
import { buildSubmitContext } from "@/features/chat/lib/langgraph/build-submit-config"
import { buildSubmitInput } from "@/features/chat/lib/langgraph/build-submit-input"
import type {
  HitlInterrupt,
  HitlRequest,
  HitlResume,
} from "@/features/chat/types/hitl-interrupt-payload"
import type { LlmChatGraphState } from "@/features/chat/types/langgraph-chat-state"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"
import { withCsrfHeaders } from "@/shared/api/csrf"

const AGENT_PUBLIC_PATH = "/api/agent"
const CHAT_ASSISTANT_ID = "chat"

type LangGraphChatStreamProviderProps = {
  children: ReactNode
  tools: LlmToolDefinition[]
  models: LangGraphChatStreamContextValue["models"]
  modelSelection: LangGraphChatStreamContextValue["modelSelection"]
  toolPolicy: LangGraphChatStreamContextValue["toolPolicy"]
  workspaceThread?: {
    appThreadId: string
    langgraphThreadId: string
  } | null
}

type VerifiedInterruptSnapshot = {
  key: string
  ids: Set<string>
}

const buildAgentApiUrl = () => {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"

  return new URL(AGENT_PUBLIC_PATH, origin).toString()
}

const langGraphFetch: typeof fetch = async (input, init) => {
  return fetchWithAuthResponse(input, {
    ...init,
    headers: withCsrfHeaders(init?.headers),
  })
}

const createLangGraphClient = (apiUrl: string) =>
  new Client({
    apiUrl,
    callerOptions: {
      fetch: langGraphFetch,
    },
  })

const extractActiveInterruptIds = (state: unknown) => {
  const tasks = (state as { tasks?: unknown })?.tasks
  if (!Array.isArray(tasks)) {
    return new Set<string>()
  }

  const activeIds = new Set<string>()
  for (const task of tasks) {
    const interrupts = (task as { interrupts?: unknown })?.interrupts
    if (!Array.isArray(interrupts)) {
      continue
    }

    for (const interrupt of interrupts) {
      const id = (interrupt as { id?: unknown })?.id
      if (typeof id === "string") {
        activeIds.add(id)
      }
    }
  }

  return activeIds
}

const getInterruptIds = (interrupts: { id?: string }[]) =>
  interrupts
    .map((interrupt) => interrupt.id)
    .filter((id): id is string => typeof id === "string")

const toInterruptIdKey = (ids: string[]) => JSON.stringify(ids)

const normalizeStreamErrorMessage = (error: unknown) => {
  if (error instanceof HttpStatusError) {
    if (typeof error.body === "string" && error.body.trim()) {
      return error.body
    }
    if (error.body != null) {
      return JSON.stringify(error.body)
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

const toLocalNotice = (error: unknown) => {
  const message = normalizeStreamErrorMessage(error)

  if (error instanceof AuthSessionError) {
    return "오류: 로그인 세션을 확인하지 못했습니다. 다시 로그인한 뒤 채팅을 이어가 주세요."
  }
  if (error instanceof HttpStatusError && error.status === 401) {
    return "오류: 로그인 세션을 확인하지 못했습니다. 다시 로그인한 뒤 채팅을 이어가 주세요."
  }
  if (error instanceof HttpStatusError) {
    return `오류: 요청이 실패했습니다. (HTTP ${error.status})`
  }
  return `오류: ${message}`
}

function useVerifiedHitlInterrupts({
  activeThreadId,
  client,
  rawInterrupts,
  streamError,
  streamThreadId,
}: {
  activeThreadId: string | null
  client: Client
  rawInterrupts: HitlInterrupt[]
  streamError: unknown
  streamThreadId: string | null
}) {
  const [snapshot, setSnapshot] = useState<VerifiedInterruptSnapshot>(() => ({
    key: "",
    ids: new Set(),
  }))
  const isProjectionReliable = !streamError
  const interruptIds = useMemo(
    () => getInterruptIds(rawInterrupts),
    [rawInterrupts]
  )
  const interruptIdKey = toInterruptIdKey(interruptIds)

  useEffect(() => {
    const targetThreadId = streamThreadId ?? activeThreadId

    if (interruptIds.length === 0 || targetThreadId == null) {
      return
    }

    let isCurrent = true
    void client.threads
      .getState(targetThreadId)
      .then((state) => {
        if (!isCurrent) {
          return
        }
        setSnapshot({
          key: interruptIdKey,
          ids: extractActiveInterruptIds(state),
        })
      })
      .catch(() => {
        if (!isCurrent) {
          return
        }
        setSnapshot({
          key: interruptIdKey,
          ids: new Set(),
        })
      })

    return () => {
      isCurrent = false
    }
  }, [activeThreadId, client, interruptIdKey, interruptIds, streamThreadId])

  return useMemo(() => {
    if (
      !isProjectionReliable ||
      snapshot.key !== interruptIdKey ||
      snapshot.ids.size === 0
    ) {
      return []
    }

    return rawInterrupts.filter(
      (interrupt) =>
        typeof interrupt.id === "string" && snapshot.ids.has(interrupt.id)
    )
  }, [interruptIdKey, isProjectionReliable, rawInterrupts, snapshot])
}

export function LangGraphChatStreamProvider({
  children,
  tools,
  models,
  modelSelection,
  toolPolicy,
  workspaceThread,
}: LangGraphChatStreamProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(
    workspaceThread?.langgraphThreadId ?? null
  )
  const activeThreadId = workspaceThread?.langgraphThreadId ?? threadId
  const [localErrorNotice, setLocalErrorNotice] = useState<string | null>(null)
  const [isResumePending, setIsResumePending] = useState(false)
  const isResumePendingRef = useRef(false)

  const apiUrl = useMemo(() => buildAgentApiUrl(), [])
  const langGraphClient = useMemo(() => createLangGraphClient(apiUrl), [apiUrl])

  const stream = useStream<
    LlmChatGraphState,
    HitlRequest,
    Partial<ReturnType<typeof buildSubmitContext>>
  >({
    assistantId: CHAT_ASSISTANT_ID,
    client: langGraphClient,
    fetch: langGraphFetch,
    messagesKey: "messages",
    optimistic: true,
    transport: "sse",
    threadId: activeThreadId,
    onThreadId: workspaceThread ? undefined : setThreadId,
  })

  const rawHitlInterrupts = stream.interrupts
  const streamErrorNotice = stream.error ? toLocalNotice(stream.error) : null
  const localNotice = localErrorNotice ?? streamErrorNotice
  const hitlInterrupts = useVerifiedHitlInterrupts({
    activeThreadId,
    client: langGraphClient,
    rawInterrupts: rawHitlInterrupts,
    streamError: stream.error,
    streamThreadId: stream.threadId,
  })

  const sendMessage = useCallback(
    async (content: string, options: ChatTurnOptions = {}) => {
      const trimmed = content.trim()
      if (!trimmed || stream.isLoading) {
        return
      }
      setLocalErrorNotice(null)

      const context = buildSubmitContext(
        modelSelection,
        toolPolicy,
        workspaceThread?.appThreadId,
        options.selectedDocumentIds ?? [],
        options.selectedArtifactIds ?? []
      )
      const input = buildSubmitInput(trimmed)

      try {
        await stream.submit(input, {
          config: {
            configurable: context,
          },
          multitaskStrategy: "reject",
        })
      } catch (error) {
        setLocalErrorNotice(toLocalNotice(error))
        throw error
      }
    },
    [modelSelection, stream, toolPolicy, workspaceThread?.appThreadId]
  )

  const resume = useCallback(
    async (
      decisions: Parameters<LangGraphChatStreamContextValue["resume"]>[0]
    ) => {
      if (stream.isLoading || isResumePendingRef.current) {
        return
      }

      const context = buildSubmitContext(
        modelSelection,
        toolPolicy,
        workspaceThread?.appThreadId
      )

      setLocalErrorNotice(null)
      isResumePendingRef.current = true
      setIsResumePending(true)

      try {
        await stream.respond(
          {
            decisions,
          } satisfies HitlResume,
          {
            config: {
              configurable: context,
            },
          }
        )
      } catch (error) {
        setLocalErrorNotice(toLocalNotice(error))
      } finally {
        isResumePendingRef.current = false
        setIsResumePending(false)
      }
    },
    [modelSelection, stream, toolPolicy, workspaceThread?.appThreadId]
  )

  const resetChat = useCallback(async () => {
    if (stream.isLoading) {
      await stream.stop({ cancel: true })
    }
    setThreadId(null)
    toolPolicy.resetToDefault()
  }, [stream, toolPolicy])

  const value = useMemo<LangGraphChatStreamContextValue>(() => {
    return {
      tools,
      models,
      modelSelection,
      toolPolicy,
      threadId: stream.threadId ?? activeThreadId,
      messages: stream.messages,
      toolCalls: stream.toolCalls,
      hitlInterrupts,
      localNotice,
      isBusy: stream.isLoading || isResumePending,
      isHydrating: stream.isThreadLoading,
      hasPendingInterrupt: hitlInterrupts.length > 0,
      streamStatus: stream.isLoading || isResumePending ? "streaming" : "idle",
      sendMessage,
      resume,
      resetChat,
    }
  }, [
    tools,
    models,
    modelSelection,
    toolPolicy,
    stream.threadId,
    activeThreadId,
    stream.messages,
    stream.toolCalls,
    hitlInterrupts,
    stream.isLoading,
    stream.isThreadLoading,
    isResumePending,
    localNotice,
    sendMessage,
    resume,
    resetChat,
  ])

  return (
    <LangGraphChatStreamContext.Provider value={value}>
      {children}
    </LangGraphChatStreamContext.Provider>
  )
}
