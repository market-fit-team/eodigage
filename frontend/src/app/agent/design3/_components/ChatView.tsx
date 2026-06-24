// src/app/agent/design3/_components/ChatView.tsx
// 미니멀리즘 AI 에이전트 — 메인 채팅 뷰 컴포넌트
"use client"

import * as React from "react"
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  Layout,
  Paperclip,
  RotateCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Separator } from "@/shared/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import type {
  ChatMessage,
  InlineArtifact,
  MessageFile,
  PermissionGate,
  ThinkingStep,
} from "../_fixtures/mockData"
import { promptSuggestions } from "../_fixtures/mockData"

// ─── 프롬프트 제안 아이콘 매핑 ────────────────────────────

const suggestionIcons: Record<string, React.ReactNode> = {
  code: <Code className="size-3.5" />,
  shield: <Shield className="size-3.5" />,
  layout: <Layout className="size-3.5" />,
  zap: <Zap className="size-3.5" />,
}

// ─── 메인 ChatView Props ──────────────────────────────────

interface ChatViewProps {
  messages: ChatMessage[]
  isTyping: boolean
  activeThreadTitle: string
  onSendMessage: (content: string, file?: MessageFile) => void
  onToggleFeedback: (messageId: string, type: "like" | "dislike") => void
  onPermissionAction: (gateId: string, action: "approve" | "deny") => void
}

/** 메인 채팅 대화 뷰 */
export function ChatView({
  messages,
  isTyping,
  activeThreadTitle,
  onSendMessage,
  onToggleFeedback,
  onPermissionAction,
}: ChatViewProps) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const isWelcomeScreen = messages.length === 0

  // 새 메시지 시 스크롤 하단으로
  React.useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, isTyping])

  // 메시지 전송 핸들러
  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInput("")
    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  // Shift+Enter = 개행, Enter = 전송
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 자동 높이 조절
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* ── 헤더 ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/20 px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-foreground/40" />
          <span className="text-[11px] font-medium text-foreground/70">
            {activeThreadTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="h-4 px-2 py-0 text-[8px] font-normal"
          >
            GPT-4o
          </Badge>
        </div>
      </header>

      {/* ── 메시지 영역 ── */}
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-6 py-6">
          {isWelcomeScreen ? (
            <WelcomeScreen
              onSelectSuggestion={(text) => {
                setInput(text)
                textareaRef.current?.focus()
              }}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onToggleFeedback={onToggleFeedback}
                  onPermissionAction={onPermissionAction}
                />
              ))}

              {/* AI 타이핑 인디케이터 */}
              {isTyping && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── 입력 영역 ── */}
      <div className="shrink-0 border-t border-border/15 bg-background px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-xl border border-border/30 bg-muted/20 transition-colors focus-within:border-border/50 focus-within:bg-muted/30">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-[12px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
              id="chat-input-textarea"
            />

            {/* 입력 하단 컨트롤 바 */}
            <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="cursor-pointer text-muted-foreground/40 hover:text-muted-foreground"
                        id="chat-attach-btn"
                      >
                        <Paperclip className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>파일 첨부</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-muted-foreground/30">
                  {input.length > 0 ? `${input.length}자` : ""}
                </span>
                <Button
                  size="icon-xs"
                  variant={input.trim() ? "default" : "ghost"}
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className={cn(
                    "cursor-pointer transition-all",
                    input.trim()
                      ? "bg-foreground text-background hover:bg-foreground/80"
                      : "text-muted-foreground/30"
                  )}
                  id="chat-send-btn"
                >
                  <ArrowUp className="size-3" />
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-2 text-center text-[8px] text-muted-foreground/30">
            AI 에이전트는 실수할 수 있습니다. 중요한 내용은 반드시 직접
            확인하세요.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── 웰컴 스크린 ──────────────────────────────────────────

function WelcomeScreen({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (text: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* 로고 */}
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-foreground/5 blur-xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/30 bg-background shadow-sm">
            <Sparkles className="size-6 text-foreground/50" />
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
        무엇을 도와드릴까요?
      </h2>
      <p className="mt-1 text-[10px] text-muted-foreground/40">
        코드 작성, 리팩토링, 보안 감사 등을 지원합니다
      </p>

      {/* 제안 카드 */}
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2">
        {promptSuggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectSuggestion(item.description)}
            className="group flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border border-border/20 bg-background p-3.5 text-left transition-all hover:border-border/40 hover:bg-muted/20"
            id={`suggestion-${item.icon}`}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/60 transition-colors group-hover:bg-muted/60 group-hover:text-foreground/60">
              {suggestionIcons[item.icon]}
            </span>
            <span className="text-[11px] font-medium text-foreground/70 group-hover:text-foreground/90">
              {item.label}
            </span>
            <span className="text-[9px] leading-snug text-muted-foreground/40">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 메시지 버블 ──────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage
  onToggleFeedback: (messageId: string, type: "like" | "dislike") => void
  onPermissionAction: (gateId: string, action: "approve" | "deny") => void
}

function MessageBubble({
  message,
  onToggleFeedback,
  onPermissionAction,
}: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      id={`message-${message.id}`}
    >
      {/* 아바타 */}
      {!isUser && (
        <Avatar size="sm" className="mt-0.5 shrink-0">
          <AvatarFallback className="bg-foreground/[0.06] text-[9px] font-semibold text-foreground/50">
            AI
          </AvatarFallback>
        </Avatar>
      )}

      {/* 콘텐츠 */}
      <div
        className={cn(
          "max-w-[85%] min-w-0",
          isUser ? "items-end" : "items-start",
          "flex flex-col gap-1.5"
        )}
      >
        {/* 사고 과정 (Thinking Steps) */}
        {message.thinkingSteps && message.thinkingSteps.length > 0 && (
          <ThinkingStepsBlock steps={message.thinkingSteps} />
        )}

        {/* 메시지 본문 */}
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-[11px] leading-[1.7]",
            isUser
              ? "rounded-tr-sm bg-foreground text-background"
              : "rounded-tl-sm bg-muted/30 text-foreground/80"
          )}
        >
          <MessageContent content={message.content} />
        </div>

        {/* 인라인 아티팩트 (코드 블록) */}
        {message.artifact && <ArtifactBlock artifact={message.artifact} />}

        {/* 권한 게이트 (Permission Gate) */}
        {message.permissionGate && (
          <PermissionGateBlock
            gate={message.permissionGate}
            onAction={onPermissionAction}
          />
        )}

        {/* 하단 메타 정보 & 액션 */}
        <div
          className={cn(
            "flex items-center gap-2 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[8px] text-muted-foreground/30">
            {message.timestamp}
          </span>

          {/* AI 메시지에만 피드백 버튼 표시 */}
          {!isUser && (
            <div className="flex items-center gap-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToggleFeedback(message.id, "like")}
                      className={cn(
                        "cursor-pointer rounded-md p-1 transition-colors",
                        message.isLiked
                          ? "bg-foreground/[0.05] text-foreground/60"
                          : "text-muted-foreground/25 hover:text-muted-foreground/50"
                      )}
                      id={`feedback-like-${message.id}`}
                    >
                      <ThumbsUp className="size-2.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>도움이 됨</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToggleFeedback(message.id, "dislike")}
                      className={cn(
                        "cursor-pointer rounded-md p-1 transition-colors",
                        message.isDisliked
                          ? "bg-destructive/[0.05] text-destructive/60"
                          : "text-muted-foreground/25 hover:text-muted-foreground/50"
                      )}
                      id={`feedback-dislike-${message.id}`}
                    >
                      <ThumbsDown className="size-2.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>개선 필요</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(message.content)
                      }
                      className="cursor-pointer rounded-md p-1 text-muted-foreground/25 transition-colors hover:text-muted-foreground/50"
                      id={`feedback-copy-${message.id}`}
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

// ─── Thinking Steps 블록 ──────────────────────────────────

function ThinkingStepsBlock({ steps }: { steps: ThinkingStep[] }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const totalMs = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="group flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] text-muted-foreground/50 transition-colors select-none hover:text-muted-foreground/70"
          id="thinking-steps-toggle"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-foreground/[0.04]">
            {isOpen ? (
              <ChevronDown className="size-2.5" />
            ) : (
              <ChevronRight className="size-2.5" />
            )}
          </span>
          <span>{steps.length}단계 사고 과정</span>
          <span className="text-[8px] text-muted-foreground/30">
            {(totalMs / 1000).toFixed(1)}s
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-2 space-y-0 border-l border-border/20 py-1 pl-4">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="flex items-center gap-2 py-1 text-[9px]"
            >
              {/* 상태 아이콘 */}
              <span
                className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded-full",
                  step.status === "done" &&
                    "bg-emerald-500/10 text-emerald-500",
                  step.status === "running" && "bg-amber-500/10 text-amber-500",
                  step.status === "error" &&
                    "bg-destructive/10 text-destructive",
                  step.status === "pending" &&
                    "bg-muted text-muted-foreground/40"
                )}
              >
                {step.status === "done" && <Check className="size-2" />}
                {step.status === "running" && (
                  <RotateCw className="size-2 animate-spin" />
                )}
                {step.status === "error" && <X className="size-2" />}
                {step.status === "pending" && (
                  <span className="size-1 rounded-full bg-current" />
                )}
              </span>

              {/* 라벨 */}
              <span
                className={cn(
                  "text-muted-foreground/60",
                  step.status === "done" && "text-foreground/50"
                )}
              >
                {step.label}
              </span>

              {/* 소요 시간 */}
              {step.durationMs && (
                <span className="ml-auto font-mono text-[8px] text-muted-foreground/25">
                  {step.durationMs}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Permission Gate 블록 ─────────────────────────────────

function PermissionGateBlock({
  gate,
  onAction,
}: {
  gate: PermissionGate
  onAction: (gateId: string, action: "approve" | "deny") => void
}) {
  const riskColors = {
    low: "text-emerald-500 bg-emerald-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    high: "text-destructive bg-destructive/10",
  }

  return (
    <div
      className="w-full space-y-3 rounded-xl border border-border/30 bg-background p-4"
      id={`permission-gate-${gate.id}`}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            riskColors[gate.risk]
          )}
        >
          <ShieldAlert className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-foreground/80">
              {gate.action}
            </span>
            <Badge
              variant={gate.risk === "high" ? "destructive" : "outline"}
              className="h-3.5 px-1.5 py-0 text-[7px] uppercase"
            >
              {gate.risk} risk
            </Badge>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground/50">
            {gate.description}
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      {gate.status === "pending" ? (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(gate.id, "approve")}
            className="flex-1 cursor-pointer gap-1 text-[10px]"
            id={`gate-approve-${gate.id}`}
          >
            <Check className="size-3" />
            승인
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction(gate.id, "deny")}
            className="flex-1 cursor-pointer gap-1 text-[10px] text-muted-foreground"
            id={`gate-deny-${gate.id}`}
          >
            <X className="size-3" />
            거부
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 pt-1 text-[9px]">
          {gate.status === "approved" ? (
            <>
              <ShieldCheck className="size-3 text-emerald-500" />
              <span className="text-emerald-500/70">승인됨</span>
            </>
          ) : (
            <>
              <X className="size-3 text-destructive/60" />
              <span className="text-destructive/60">거부됨</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Inline Artifact (코드 블록) ──────────────────────────

function ArtifactBlock({ artifact }: { artifact: InlineArtifact }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/25 bg-background">
      {/* 코드 블록 헤더 */}
      <div className="flex items-center justify-between border-b border-border/15 bg-muted/15 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Code className="size-3 text-muted-foreground/40" />
          <span className="text-[10px] font-medium text-foreground/60">
            {artifact.title}
          </span>
          <Badge variant="outline" className="h-3.5 px-1.5 py-0 text-[7px]">
            v{artifact.version}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className="cursor-pointer rounded-md p-1 text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
                id={`artifact-copy-${artifact.id}`}
              >
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "복사됨" : "코드 복사"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 코드 영역 */}
      <ScrollArea className="max-h-64">
        <pre className="p-3 font-mono text-[10px] leading-relaxed text-foreground/70">
          <code>{artifact.code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

// ─── 메시지 내용 파서 (마크다운 볼드 처리) ─────────────────

function MessageContent({ content }: { content: string }) {
  // **텍스트** 패턴을 볼드로 변환하고, 줄바꿈 처리
  const lines = content.split("\n")

  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseBoldText(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  )
}

/** **bold** 패턴을 <strong> 태그로 변환 */
const parseBoldText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // 볼드 이전 텍스트
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    // 볼드 텍스트
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }

  // 나머지 텍스트
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

// ─── 타이핑 인디케이터 ────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3" id="typing-indicator">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-foreground/[0.06] text-[9px] font-semibold text-foreground/50">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-muted/30 px-4 py-3">
        <span className="size-1.5 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-foreground/20" />
        <span className="size-1.5 animate-[pulse_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-foreground/20" />
        <span className="size-1.5 animate-[pulse_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-foreground/20" />
      </div>
    </div>
  )
}
