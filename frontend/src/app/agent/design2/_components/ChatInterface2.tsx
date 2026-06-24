// src/app/agent/design2/_components/ChatInterface2.tsx
"use client"

import * as React from "react"
import {
  Check,
  ChevronRight,
  Copy,
  FileCode2,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import {
  ChatMessage,
  MessageFile,
  promptSuggestions,
} from "../_fixtures/chatMockData2"
import { ThoughtTracer } from "./ThoughtTracer"

interface ChatInterface2Props {
  messages: ChatMessage[]
  isTyping: boolean
  onSendMessage: (content: string, file?: MessageFile) => void
  onToggleFeedback: (messageId: string, type: "like" | "dislike") => void
  onSelectArtifact: (artifactId: string) => void
  activeRoomTitle: string
}

export function ChatInterface2({
  messages,
  isTyping,
  onSendMessage,
  onToggleFeedback,
  onSelectArtifact,
  activeRoomTitle,
}: ChatInterface2Props) {
  const [inputText, setInputText] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<MessageFile | null>(
    null
  )
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // 컨텍스트 칩 상태 관리
  const [contextChips, setContextChips] = React.useState<string[]>([
    "Dashboard.tsx",
  ])

  // 슬래시 커맨드 제안 상태
  const [showCommands, setShowCommands] = React.useState(false)

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 대화 추가 시 하단 스크롤
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, isTyping])

  // 전송 처리
  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return

    onSendMessage(inputText, selectedFile || undefined)
    setInputText("")
    setSelectedFile(null)
    setShowCommands(false)
  }

  // 키 입력 감지 (슬래시 커맨드 트리거 및 엔터)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputText(val)

    // '/' 문자 포함 여부로 자동완성 트리거
    if (val.endsWith("/")) {
      setShowCommands(true)
    } else if (showCommands && !val.includes("/")) {
      setShowCommands(false)
    }
  }

  // 가상 파일 선택
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setSelectedFile({
        name: file.name,
        size: `${sizeMB}MB`,
        type: file.type || "application/octet-stream",
      })
      toast.success(`파일이 컨텍스트에 첨부되었습니다: ${file.name}`)
    }
  }

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msgId)
      toast.success("클립보드에 복사되었습니다.")
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleSelectCommand = (command: string) => {
    // 커맨드를 텍스트창에 치환하여 대입
    setInputText(command + " ")
    setShowCommands(false)
  }

  const toggleContextChip = (chip: string) => {
    setContextChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* 상단 룸 헤더 */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-xs font-semibold text-foreground/90">
            {activeRoomTitle}
          </h1>
          <span className="text-[10px] text-muted-foreground/70">
            {isTyping
              ? "AI가 생각 단계를 거치는 중입니다..."
              : "온라인 · 에이전트 개발 워크스페이스"}
          </span>
        </div>
      </header>

      {/* 대화 리스트 */}
      <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-6 pb-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user"
            return (
              <div
                key={msg.id}
                className={cn(
                  "group flex gap-4 text-xs",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* 아바타 */}
                <Avatar className="size-7 shrink-0 border border-border/30">
                  <AvatarFallback
                    className={cn(
                      "text-[9px] font-semibold",
                      isUser
                        ? "bg-muted text-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {isUser ? "U" : "AI"}
                  </AvatarFallback>
                </Avatar>

                {/* 메시지 컨텐츠 */}
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col gap-2.5",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  {/* 발신자명 */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/75">
                    <span className="font-medium text-foreground/70">
                      {isUser ? "나" : "Antigravity AI"}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* 생각 과정 (Thought Tracer) 표시 */}
                  {!isUser && msg.thoughtSteps && (
                    <div className="w-full">
                      <ThoughtTracer steps={msg.thoughtSteps} />
                    </div>
                  )}

                  {/* 대화 말풍선 */}
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-2.5 leading-relaxed tracking-wide whitespace-pre-wrap transition-colors",
                      isUser
                        ? "border-transparent bg-foreground font-light text-background"
                        : "border-border/10 bg-muted/30 font-light text-foreground"
                    )}
                  >
                    {/* 가상 업로드 파일 표기 */}
                    {msg.file && (
                      <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-border/20 bg-background/10 p-2 text-[10px] dark:bg-background/20">
                        <Paperclip className="size-3.5 shrink-0 opacity-70" />
                        <span className="max-w-[150px] truncate font-medium">
                          {msg.file.name}
                        </span>
                        <span className="opacity-60">({msg.file.size})</span>
                      </div>
                    )}
                    <span>{msg.content}</span>
                  </div>

                  {/* 아티팩트 링크 카드 (매우 중요) */}
                  {!isUser && msg.artifactId && (
                    <div
                      onClick={() => onSelectArtifact(msg.artifactId!)}
                      className="group/card flex w-full max-w-sm cursor-pointer items-center justify-between rounded-xl border border-border bg-card/60 p-3 shadow-sm transition-all select-none hover:border-primary/40 hover:bg-muted/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                          <FileCode2 className="size-4 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/90">
                            <span>ModernAnalyticsDashboard.tsx</span>
                            <Badge className="h-4 border-emerald-500/30 bg-emerald-500/10 text-[8px] text-emerald-500 hover:bg-emerald-500/15">
                              Artifact v2
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground">
                            보안 취약점 조치 및 코드 최적화 완료
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover/card:translate-x-0.5" />
                    </div>
                  )}

                  {/* 액션 툴바 */}
                  <div
                    className={cn(
                      "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      title="복사"
                      className="cursor-pointer text-muted-foreground/60 hover:text-foreground"
                    >
                      {copiedId === msg.id ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    {!isUser && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onToggleFeedback(msg.id, "like")}
                          className={cn(
                            "cursor-pointer text-muted-foreground/60 hover:text-foreground",
                            msg.isLiked && "text-primary"
                          )}
                        >
                          <ThumbsUp className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onToggleFeedback(msg.id, "dislike")}
                          className={cn(
                            "cursor-pointer text-muted-foreground/60 hover:text-foreground",
                            msg.isDisliked && "text-destructive"
                          )}
                        >
                          <ThumbsDown className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* 타이핑 로더 */}
          {isTyping && (
            <div className="flex gap-4 text-xs">
              <Avatar className="size-7 shrink-0 border border-border/30">
                <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/75">
                  <span className="font-medium text-foreground/70">
                    Antigravity AI
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-border/10 bg-muted/20 px-4 py-3 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span className="text-[11px] font-light">
                    추론 및 변경 코드 설계 중...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="mx-6 shrink-0 bg-border/30" />

      {/* 추천 질문 목록 가이드 */}
      {messages.length < 3 && (
        <div className="mx-auto flex max-w-2xl shrink-0 flex-wrap justify-center gap-1.5 px-6 pt-3">
          {promptSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(sug)}
              className="cursor-pointer rounded-full border border-border/50 bg-muted/10 px-2.5 py-1 text-[9px] text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* 하단 폼 */}
      <footer className="relative mx-auto w-full max-w-2xl shrink-0 p-6">
        {/* 슬래시 커맨드 제안 팝업 레이어 */}
        {showCommands && (
          <div className="absolute right-6 bottom-full left-6 z-20 mb-2 space-y-1 rounded-xl border border-border/50 bg-card/95 p-2.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/20 px-2 pb-1 text-[9px] font-semibold text-muted-foreground">
              <span>AI Workbench 명령어 가이드</span>
              <span>입력 필터 적용 가능</span>
            </div>
            {[
              {
                cmd: "/refactor",
                desc: "코드를 클린하게 리팩토링하고 최적화 요청",
                icon: <RefreshCw className="size-3 text-violet-500" />,
              },
              {
                cmd: "/fix-security",
                desc: "보안 취약점 조치 및 SecureCoder 진단 요청",
                icon: <ShieldCheck className="size-3 text-emerald-500" />,
              },
              {
                cmd: "/document",
                desc: "컴포넌트에 한국어 JSDocs/주석 보강 지시",
                icon: <FileCode2 className="size-3 text-blue-500" />,
              },
            ].map((item) => (
              <div
                key={item.cmd}
                onClick={() => handleSelectCommand(item.cmd)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[10px] text-foreground/80 transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-mono font-semibold">{item.cmd}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {item.desc}
                  </span>
                </div>
                <span className="font-mono text-[8px] text-muted-foreground/50">
                  Click
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex flex-col rounded-xl border border-border/50 bg-card bg-muted/5 p-2 transition-all focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border/40">
          {/* 가상 Context Chips 및 첨부파일 */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 pl-2">
            {/* 파일 첨부 배지 */}
            {selectedFile && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-border/60 bg-background/50 px-1.5 py-0.5 text-[9px]"
              >
                <Paperclip className="size-2.5 text-muted-foreground" />
                <span className="max-w-[120px] truncate">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="ml-1 text-muted-foreground/70 hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )}

            {/* Context 칩들 */}
            <Badge
              variant="outline"
              onClick={() => toggleContextChip("Web Search")}
              className={cn(
                "flex cursor-pointer items-center gap-1 border-border/60 px-1.5 py-0.5 text-[9px] select-none",
                contextChips.includes("Web Search")
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "bg-background/20"
              )}
            >
              <Search className="size-2.5" />
              <span>웹 검색</span>
            </Badge>

            <Badge
              variant="outline"
              onClick={() => toggleContextChip("Dashboard.tsx")}
              className={cn(
                "flex cursor-pointer items-center gap-1 border-border/60 px-1.5 py-0.5 text-[9px] select-none",
                contextChips.includes("Dashboard.tsx")
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "bg-background/20"
              )}
            >
              <FileCode2 className="size-2.5" />
              <span>Dashboard.tsx</span>
            </Badge>
          </div>

          {/* 텍스트 인풋 */}
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="AI에게 개발을 요청하세요... (/ 명령어 입력 가능)"
            className="min-h-[50px] w-full resize-none bg-transparent px-3 py-1 text-xs font-light text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none"
            rows={1}
          />

          <div className="flex items-center justify-between border-t border-border/10 px-1 pt-2">
            <div className="flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => fileInputRef.current?.click()}
                title="컨텍스트 파일 추가"
                className="cursor-pointer text-muted-foreground/60 hover:text-foreground"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="default"
              size="xs"
              onClick={handleSend}
              disabled={!inputText.trim() && !selectedFile}
              className={cn(
                "h-6 cursor-pointer px-3 text-[10px] font-normal transition-all",
                inputText.trim() || selectedFile
                  ? "animate-pulse bg-foreground text-background hover:bg-foreground/90 active:scale-95"
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              <span className="mr-1">질문</span>
              <Send className="size-2.5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
