// src/app/agent/design1/_components/ChatArea.tsx
"use client"

import * as React from "react"
import {
  Check,
  Copy,
  Loader2,
  Paperclip,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import { ChatMessage, MessageFile } from "../_fixtures/chatMockData"
import { ChatWelcome } from "./ChatWelcome"

interface ChatAreaProps {
  messages: ChatMessage[]
  isTyping: boolean
  onSendMessage: (content: string, file?: MessageFile) => void
  onToggleFeedback: (messageId: string, type: "like" | "dislike") => void
  activeRoomTitle: string
}

// 메인 채팅 피드 및 입력 영역 컴포넌트
export function ChatArea({
  messages,
  isTyping,
  onSendMessage,
  onToggleFeedback,
  activeRoomTitle,
}: ChatAreaProps) {
  const [inputText, setInputText] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<MessageFile | null>(
    null
  )
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 메시지 목록 추가 시 자동 하단 스크롤
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

  // 전송 처리 함수
  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return

    onSendMessage(inputText, selectedFile || undefined)
    setInputText("")
    setSelectedFile(null)
  }

  // 엔터 키 처리 (Shift + Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 가상 파일 선택 시뮬레이션
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 10MB 크기 제한 시뮬레이션
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setSelectedFile({
        name: file.name,
        size: `${sizeMB}MB`,
        type: file.type || "application/octet-stream",
      })
      toast.success(`파일이 첨부되었습니다: ${file.name}`)
    }
  }

  // 메시지 클립보드 복사 함수
  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msgId)
      toast.success("클립보드에 복사되었습니다.")
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* 상단 룸 헤더 */}
      <header className="flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="text-xs font-semibold text-foreground/90">
            {activeRoomTitle}
          </h1>
          <span className="text-[10px] text-muted-foreground/70">
            {isTyping
              ? "AI 에이전트가 입력 중입니다..."
              : "온라인 · 가상 테스트 모드"}
          </span>
        </div>
      </header>

      {/* 대화 피드 스크롤 영역 */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
        {messages.length === 0 ? (
          <ChatWelcome onSelectPrompt={(prompt) => onSendMessage(prompt)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 pb-4">
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
                  <Avatar
                    size="sm"
                    className="shrink-0 border border-border/30"
                  >
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

                  {/* 메시지 및 정보 */}
                  <div
                    className={cn(
                      "flex max-w-[70%] flex-col gap-1",
                      isUser ? "items-end" : "items-start"
                    )}
                  >
                    {/* 발신자 정보 및 시간 */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/75">
                      <span className="font-medium text-foreground/70">
                        {isUser ? "나" : "Antigravity AI"}
                      </span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* 말풍선 */}
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-2.5 leading-relaxed tracking-wide whitespace-pre-wrap",
                        isUser
                          ? "border-transparent bg-foreground font-light text-background"
                          : "border-border/20 bg-muted/30 font-light text-foreground"
                      )}
                    >
                      {/* 가상 첨부파일 표시 */}
                      {msg.file && (
                        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-border/30 bg-background/10 p-2 text-[10px] dark:bg-background/20">
                          <Paperclip className="size-3.5 shrink-0 opacity-70" />
                          <span className="max-w-[150px] truncate font-medium">
                            {msg.file.name}
                          </span>
                          <span className="opacity-60">({msg.file.size})</span>
                        </div>
                      )}
                      <span>{msg.content}</span>
                    </div>

                    {/* 메시지 툴바 (호버 시 표시) */}
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        title="메시지 복사"
                        className="text-muted-foreground/60 hover:text-foreground"
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
                            title="도움이 됨"
                            className={cn(
                              "text-muted-foreground/60 hover:text-foreground",
                              msg.isLiked && "text-primary hover:text-primary"
                            )}
                          >
                            <ThumbsUp
                              className={cn(
                                "size-3",
                                msg.isLiked && "fill-current"
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onToggleFeedback(msg.id, "dislike")}
                            title="도움이 안 됨"
                            className={cn(
                              "text-muted-foreground/60 hover:text-foreground",
                              msg.isDisliked &&
                                "text-destructive hover:text-destructive"
                            )}
                          >
                            <ThumbsDown
                              className={cn(
                                "size-3",
                                msg.isDisliked && "fill-current"
                              )}
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* AI 타이핑 인디케이터 */}
            {isTyping && (
              <div className="flex gap-4 text-xs">
                <Avatar size="sm" className="shrink-0 border border-border/30">
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
                  <div className="flex items-center gap-2 rounded-2xl border border-border/10 bg-muted/20 px-4 py-3 text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground/80" />
                    <span className="text-[11px] font-light">
                      답변을 작성하고 있습니다...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator className="mx-6 bg-border/30" />

      {/* 하단 입력 폼 영역 */}
      <footer className="mx-auto w-full max-w-3xl p-6">
        <div className="relative flex flex-col rounded-xl border border-border/50 bg-muted/5 p-2 transition-all focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border/40">
          {/* 가상 파일 업로드 배지 노출 */}
          {selectedFile && (
            <div className="flex items-center gap-2 pb-2 pl-2">
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-border/60 bg-background/50 px-2 py-0.5 text-[10px]"
              >
                <Paperclip className="size-2.5 text-muted-foreground" />
                <span className="max-w-[180px] truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[8px] opacity-60">
                  ({selectedFile.size})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="ml-1 text-muted-foreground/70 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* 텍스트 입력창 */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)"
            className="min-h-[50px] w-full resize-none bg-transparent px-3 py-1.5 text-xs font-light text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0 focus:outline-none"
            rows={1}
          />

          <div className="flex items-center justify-between border-t border-border/20 px-1 pt-2">
            {/* 파일 첨부 버튼 */}
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
                title="파일 첨부"
                className="text-muted-foreground/60 hover:text-foreground"
              >
                <Paperclip className="size-3.5" />
              </Button>
            </div>

            {/* 전송 버튼 */}
            <Button
              variant="default"
              size="xs"
              onClick={handleSend}
              disabled={!inputText.trim() && !selectedFile}
              className={cn(
                "h-6 px-3 text-[10px] font-normal transition-all",
                inputText.trim() || selectedFile
                  ? "bg-foreground text-background hover:bg-foreground/90 active:scale-95"
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              <span className="mr-1">전송</span>
              <Send className="size-2.5" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
          Antigravity AI는 가상 시나리오에 기반해 작동하며 로컬 서버 통신을
          시뮬레이션합니다.
        </p>
      </footer>
    </div>
  )
}
