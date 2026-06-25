"use client"

import * as React from "react"
import {
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  Maximize,
  Minimize,
  PanelRight,
  Sparkles,
  TerminalSquare,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages"
import type { AssembledToolCall } from "@langchain/langgraph-sdk/stream"
import { HitlInterruptCard } from "@/features/chat/components/hitl/hitl-interrupt-card"
import { ChatSelectionChips } from "@/features/chat/components/workspace/chat-selection-chips"
import { useAutoScroll } from "@/features/chat/hooks/use-auto-scroll"
import { useLangGraphChatStream } from "@/features/chat/hooks/use-langgraph-chat-stream"
import {
  getArtifactIcon,
  getArtifactPreview,
  getArtifactTitle,
} from "@/features/chat/lib/display/chat-display"
import { useChatWorkspace } from "@/features/chat/providers/chat-workspace-provider"
import { useUpsertMessageFeedbackApiV1AgentMessagesMessageIdFeedbackPost } from "@/shared/api/generated/agent/endpoints/agent-feedback/agent-feedback"
import type {
  ArtifactResponse,
  DocumentResponse,
} from "@/shared/api/generated/agent/schemas"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

type ChatViewProps = {
  activeThreadTitle: string
  appThreadId: string
  artifacts: ArtifactResponse[]
  documents: DocumentResponse[]
  isRightPanelOpen: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleRightPanel: () => void
}

const promptSuggestions = [
  {
    icon: <FileCode2 className="size-3.5" />,
    label: "문서 분석",
    description: "라이브러리 문서를 바탕으로 핵심 내용을 정리",
  },
  {
    icon: <Brain className="size-3.5" />,
    label: "전략 검토",
    description: "현재 대화 맥락에서 다음 실행안을 제안",
  },
  {
    icon: <TerminalSquare className="size-3.5" />,
    label: "도구 실행",
    description: "필요한 도구를 검토하고 승인 흐름으로 진행",
  },
  {
    icon: <Sparkles className="size-3.5" />,
    label: "리포트 작성",
    description: "아티팩트로 남길 수 있는 보고서 초안을 생성",
  },
]

export function ChatView({
  activeThreadTitle,
  appThreadId,
  artifacts,
  documents,
  isRightPanelOpen,
  isExpanded,
  onToggleExpand,
  onToggleRightPanel,
}: ChatViewProps) {
  const [input, setInput] = React.useState("")
  const [feedbackByMessageId, setFeedbackByMessageId] = React.useState<
    Record<string, "like" | "dislike" | undefined>
  >({})
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const {
    hitlInterrupts,
    isBusy,
    isHydrating,
    localNotice,
    messages,
    modelSelection,
    resume,
    sendMessage,
    toolCalls,
  } = useLangGraphChatStream()
  const {
    selectedArtifactIds,
    selectedDocumentIds,
    setIsSelectionLocked,
    setRightPanel,
  } = useChatWorkspace()
  const feedbackMutation =
    useUpsertMessageFeedbackApiV1AgentMessagesMessageIdFeedbackPost()
  const { viewportRef, onScroll, scrollToBottom } = useAutoScroll()
  const disabled = isBusy || isHydrating || hitlInterrupts.length > 0
  const isWelcomeScreen =
    messages.filter((message) => !ToolMessage.isInstance(message)).length === 0

  React.useEffect(() => {
    setIsSelectionLocked(disabled)
    return () => setIsSelectionLocked(false)
  }, [disabled, setIsSelectionLocked])

  React.useEffect(() => {
    scrollToBottom(true)
  }, [messages.length, hitlInterrupts.length, localNotice, scrollToBottom])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) {
      return
    }

    void sendMessage(trimmed, {
      selectedArtifactIds,
      selectedDocumentIds,
    })
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    const element = event.target
    element.style.height = "auto"
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }

  const handleFeedback = (
    messageId: string | undefined,
    rating: "like" | "dislike"
  ) => {
    if (!messageId) {
      return
    }

    setFeedbackByMessageId((current) => ({
      ...current,
      [messageId]: current[messageId] === rating ? undefined : rating,
    }))
    feedbackMutation.mutate({
      messageId,
      data: {
        thread_id: appThreadId,
        rating,
      },
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/20 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="size-3.5 shrink-0 text-foreground" />
          <span className="truncate text-sm font-medium text-foreground">
            {activeThreadTitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="hidden h-4 px-2 py-0 text-[10px] font-normal sm:inline-flex"
          >
            {modelSelection.model}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onToggleExpand}
                  className="mx-0.5 hidden cursor-pointer text-muted-foreground hover:text-foreground md:flex"
                >
                  {isExpanded ? (
                    <Minimize className="size-3.5" />
                  ) : (
                    <Maximize className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isExpanded ? "축소" : "확장"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!isRightPanelOpen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onToggleRightPanel}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    id="right-panel-open-btn"
                  >
                    <PanelRight className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>패널 열기</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      <ScrollArea
        ref={viewportRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full [&_[data-slot=scroll-area-viewport]>div]:!min-w-0"
      >
        <div className="mx-auto max-w-2xl min-w-0 px-4 py-6 sm:px-6">
          {isHydrating ? (
            <TypingIndicator label="대화를 불러오는 중" />
          ) : isWelcomeScreen ? (
            <WelcomeScreen
              onSelectSuggestion={(text) => {
                setInput(text)
                textareaRef.current?.focus()
              }}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id ?? `${message._getType()}-${index}`}
                  message={message}
                  messages={messages}
                  toolCalls={toolCalls}
                  feedback={
                    message.id ? feedbackByMessageId[message.id] : undefined
                  }
                  onFeedback={handleFeedback}
                  onOpenThinking={(reasoning, relatedToolCalls) =>
                    setRightPanel({
                      kind: "thinking",
                      title: "사고 과정 및 도구 호출",
                      reasoning,
                      toolCalls: relatedToolCalls,
                    })
                  }
                />
              ))}

              {artifacts.length > 0 && (
                <ArtifactStrip
                  artifacts={artifacts}
                  onOpenArtifact={(artifact) =>
                    setRightPanel({ kind: "artifact", artifact })
                  }
                />
              )}

              {localNotice && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                  {localNotice}
                </div>
              )}

              {hitlInterrupts.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRightPanel({
                        kind: "hitl",
                        interrupts: hitlInterrupts,
                      })
                    }
                    className="h-7 cursor-pointer gap-1.5 text-xs"
                  >
                    <PanelRight className="size-3" />
                    우측 패널에서 승인 보기
                  </Button>
                  <HitlInterruptCard
                    interrupts={hitlInterrupts}
                    disabled={isBusy || isHydrating}
                    onDecide={(decisions) => void resume(decisions)}
                  />
                </div>
              )}

              {isBusy && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border/15 bg-background px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div
            className={cn(
              "relative rounded-xl border bg-muted/20 transition-all",
              "border-border/30 focus-within:border-border/50 focus-within:bg-muted/30"
            )}
          >
            <div className="px-3 pt-2.5">
              <ChatSelectionChips artifacts={artifacts} documents={documents} />
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="메시지를 입력하세요..."
              rows={1}
              disabled={disabled}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
              id="chat-input-textarea"
            />
            <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
              <div />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {input.length > 0 ? `${input.length}자` : ""}
                  {selectedDocumentIds.length + selectedArtifactIds.length >
                    0 &&
                    ` · ${
                      selectedDocumentIds.length + selectedArtifactIds.length
                    }개 참조`}
                </span>
                <Button
                  size="icon-xs"
                  variant={input.trim() && !disabled ? "default" : "ghost"}
                  onClick={handleSubmit}
                  disabled={!input.trim() || disabled}
                  className={cn(
                    "cursor-pointer transition-all",
                    input.trim() && !disabled
                      ? "bg-foreground text-background hover:bg-foreground/80"
                      : "text-muted-foreground"
                  )}
                  id="chat-send-btn"
                >
                  <ArrowUp className="size-3" />
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI 에이전트는 실수할 수 있습니다. 중요한 내용은 반드시 직접
            확인하세요.
          </p>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-foreground/5 blur-xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/30 bg-background shadow-sm">
            <Sparkles className="size-6 text-foreground" />
          </div>
        </div>
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        무엇을 도와드릴까요?
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        라이브러리와 대화 맥락을 바탕으로 작업을 도와드립니다
      </p>
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2">
        {promptSuggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectSuggestion(item.description)}
            className="group flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border border-border/20 bg-background p-3.5 text-left transition-all hover:border-border/40 hover:bg-muted/20"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground transition-colors group-hover:bg-muted/60 group-hover:text-foreground">
              {item.icon}
            </span>
            <span className="text-xs font-medium text-foreground">
              {item.label}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

type MessageBubbleProps = {
  message: BaseMessage
  messages: BaseMessage[]
  toolCalls: AssembledToolCall[]
  feedback?: "like" | "dislike"
  onFeedback: (
    messageId: string | undefined,
    rating: "like" | "dislike"
  ) => void
  onOpenThinking: (
    reasoning: string | undefined,
    toolCalls: AssembledToolCall[]
  ) => void
}

function MessageBubble({
  message,
  messages,
  toolCalls,
  feedback,
  onFeedback,
  onOpenThinking,
}: MessageBubbleProps) {
  if (ToolMessage.isInstance(message)) {
    return null
  }

  const isUser = HumanMessage.isInstance(message)
  const textContent = message.text
  const reasoning = getReasoningText(message)
  const relatedToolCalls = getRelatedToolCalls(message, messages, toolCalls)
  const hasThinking = Boolean(reasoning) || relatedToolCalls.length > 0

  return (
    <div
      className={cn("flex min-w-0", isUser ? "justify-end" : "justify-start")}
      id={message.id ? `message-${message.id}` : undefined}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          isUser
            ? "w-fit max-w-[85%] items-end"
            : "w-full max-w-full items-start"
        )}
      >
        {!isUser && hasThinking && (
          <ThinkingBlock
            reasoning={reasoning}
            toolCalls={relatedToolCalls}
            onOpen={() => onOpenThinking(reasoning, relatedToolCalls)}
          />
        )}

        {textContent && (
          <div
            className={cn(
              "max-w-full rounded-xl px-3.5 py-2.5 text-sm leading-[1.7] break-words",
              isUser
                ? "rounded-tr-sm bg-foreground text-background"
                : "rounded-tl-sm bg-muted/30 text-foreground"
            )}
          >
            <p className="whitespace-pre-wrap">{textContent}</p>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          {!isUser && (
            <div className="flex items-center gap-0.5">
              <FeedbackButton
                active={feedback === "like"}
                label="도움이 됨"
                onClick={() => onFeedback(message.id, "like")}
              >
                <ThumbsUp className="size-2.5" />
              </FeedbackButton>
              <FeedbackButton
                active={feedback === "dislike"}
                destructive
                label="개선 필요"
                onClick={() => onFeedback(message.id, "dislike")}
              >
                <ThumbsDown className="size-2.5" />
              </FeedbackButton>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(textContent)
                        toast.success("메시지가 복사되었습니다.")
                      }}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Copy className="size-2.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>복사</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThinkingBlock({
  reasoning,
  toolCalls,
  onOpen,
}: {
  reasoning?: string
  toolCalls: AssembledToolCall[]
  onOpen: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="w-full max-w-full rounded-lg border border-border/30 bg-muted/20">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              {isOpen ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              사고 과정 및 도구 호출
              <span className="text-[10px]">
                {toolCalls.length > 0
                  ? `${toolCalls.length} 단계`
                  : "reasoning"}
              </span>
            </button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="h-6 cursor-pointer gap-1 px-2 text-xs"
          >
            <PanelRight className="size-3" />
            열기
          </Button>
        </div>
        <CollapsibleContent>
          <div className="border-t border-border/20 px-3 py-2">
            {reasoning && (
              <pre className="mb-2 line-clamp-4 text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
                {reasoning}
              </pre>
            )}
            <div className="space-y-1">
              {toolCalls.map((toolCall, index) => (
                <div
                  key={toolCall.callId ?? toolCall.id ?? index}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="truncate font-mono">
                    {toolCall.name ?? "tool"}
                  </span>
                  <span className="shrink-0">{toolCall.status}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function FeedbackButton({
  active,
  children,
  destructive,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  destructive?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "cursor-pointer rounded-md p-1 transition-colors",
              active && !destructive && "bg-foreground/[0.05] text-foreground",
              active && destructive && "bg-destructive/[0.05] text-destructive",
              !active && "text-muted-foreground hover:text-foreground"
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ArtifactStrip({
  artifacts,
  onOpenArtifact,
}: {
  artifacts: ArtifactResponse[]
  onOpenArtifact: (artifact: ArtifactResponse) => void
}) {
  return (
    <div className="space-y-2">
      {artifacts.slice(0, 3).map((artifact) => (
        <button
          key={artifact.id}
          onClick={() => onOpenArtifact(artifact)}
          className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/30 bg-muted/15 p-3 text-left transition-colors hover:bg-muted/25"
        >
          <span className="mt-0.5">{getArtifactIcon(artifact.type)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">
              {getArtifactTitle(artifact)}
            </span>
            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
              {getArtifactPreview(artifact)}
            </span>
          </span>
          <Badge variant="outline" className="h-5 shrink-0 text-[10px]">
            v{artifact.version}
          </Badge>
        </button>
      ))}
    </div>
  )
}

function TypingIndicator({ label = "AI가 응답 중입니다" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      {label}
    </div>
  )
}

const getReasoningText = (message: BaseMessage) => {
  if (!AIMessage.isInstance(message)) {
    return undefined
  }

  const reasoning = message.contentBlocks
    .flatMap((block) => (block.type === "reasoning" ? [block.reasoning] : []))
    .join("")

  return reasoning || undefined
}

const getRelatedToolCalls = (
  message: BaseMessage,
  messages: BaseMessage[],
  toolCalls: AssembledToolCall[]
) => {
  if (!AIMessage.isInstance(message)) {
    return []
  }

  const callIds = new Set(
    (message.tool_calls ?? [])
      .map((call) => call.id)
      .filter((id): id is string => typeof id === "string")
  )

  const resultIds = new Set(
    messages
      .filter((candidate): candidate is ToolMessage =>
        ToolMessage.isInstance(candidate)
      )
      .map((toolMessage) => toolMessage.tool_call_id)
      .filter((id): id is string => callIds.has(id))
  )

  return toolCalls.filter((toolCall) => {
    const id = toolCall.callId ?? toolCall.id
    return typeof id === "string" && (callIds.has(id) || resultIds.has(id))
  })
}
