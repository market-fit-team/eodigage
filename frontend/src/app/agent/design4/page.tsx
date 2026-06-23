// src/app/agent/design4/page.tsx
// AI 에이전트 종합 워크스페이스 — ResizablePanel 3단 레이아웃
"use client"

import * as React from "react"
import { toast } from "sonner"
import { Menu, X } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/shared/components/ui/resizable"
import { cn } from "@/shared/lib/utils"

import { ThreadList } from "./_components/thread-list"
import { ChatView } from "./_components/chat-view"
import { DocumentPanel } from "./_components/document-panel"
import {
  initialThreads,
  initialMessages,
  initialDocuments,
  generateBotResponse,
  type Thread,
  type ChatMessage,
  type MessageFile,
  type DocumentItem,
} from "./_fixtures/mock-data"

/** Design4 — Adaptive Minimalism AI Agent 종합 워크스페이스 */
export default function Page() {
  // ── 기존 상태 (design3 계승) ─────────────────────────────
  const [threads, setThreads] = React.useState<Thread[]>(initialThreads)
  const [messages, setMessages] = React.useState<Record<string, ChatMessage[]>>(initialMessages)
  const [activeThreadId, setActiveThreadId] = React.useState<string>("thread-1")
  const [isTyping, setIsTyping] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  // ── 신규 상태 (design4 추가) ─────────────────────────────
  const [isDocPanelOpen, setIsDocPanelOpen] = React.useState(true)
  const [attachedDocs, setAttachedDocs] = React.useState<DocumentItem[]>([])
  const [documents] = React.useState<DocumentItem[]>(initialDocuments)

  // 현재 활성 스레드 정보
  const activeThread = threads.find((t) => t.id === activeThreadId)
  const activeTitle = activeThread?.title ?? "새 대화"
  const currentMessages = activeThreadId ? messages[activeThreadId] ?? [] : []

  // ── 스레드 선택 ──────────────────────────────────────────
  const handleSelectThread = (id: string) => {
    setActiveThreadId(id)
    // 스레드 전환 시 첨부 문서 초기화
    setAttachedDocs([])
  }

  // ── 새 스레드 생성 ────────────────────────────────────────
  const handleCreateThread = () => {
    const newId = `thread-${Date.now()}`
    const newThread: Thread = {
      id: newId,
      title: `새 대화 #${threads.length + 1}`,
      updatedAt: "방금",
      messageCount: 0,
    }
    setThreads((prev) => [newThread, ...prev])
    setMessages((prev) => ({ ...prev, [newId]: [] }))
    setActiveThreadId(newId)
    setAttachedDocs([])
    toast.success("새 대화가 시작되었습니다.")
  }

  // ── 스레드 삭제 ───────────────────────────────────────────
  const handleDeleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id))
    setMessages((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })

    if (activeThreadId === id) {
      const remaining = threads.filter((t) => t.id !== id)
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0].id)
      } else {
        setActiveThreadId("")
      }
    }
    toast("대화가 삭제되었습니다.", { icon: "🗑️" })
  }

  // ── 메시지 전송 ───────────────────────────────────────────
  const handleSendMessage = (content: string, file?: MessageFile) => {
    if (!activeThreadId) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    // 사용자 메시지 (첨부 문서 포함)
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content,
      timestamp: timeStr,
      file,
      attachedDocs: attachedDocs.length > 0 ? [...attachedDocs] : undefined,
    }

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] ?? []), userMsg],
    }))

    // 전송 후 첨부 문서 초기화
    setAttachedDocs([])

    // 스레드 정보 업데이트
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, updatedAt: "방금", messageCount: t.messageCount + 1 }
          : t
      )
    )

    // AI 응답 시뮬레이션
    setIsTyping(true)
    setTimeout(() => {
      const response = generateBotResponse()
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        thinkingSteps: response.steps,
      }

      setMessages((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] ?? []), botMsg],
      }))

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messageCount: t.messageCount + 2 }
            : t
        )
      )
      setIsTyping(false)
    }, 1800)
  }

  // ── 피드백 토글 ───────────────────────────────────────────
  const handleToggleFeedback = (messageId: string, type: "like" | "dislike") => {
    if (!activeThreadId) return
    setMessages((prev) => {
      const roomMsgs = prev[activeThreadId] ?? []
      const updated = roomMsgs.map((m) => {
        if (m.id !== messageId) return m
        if (type === "like") return { ...m, isLiked: !m.isLiked, isDisliked: false }
        return { ...m, isDisliked: !m.isDisliked, isLiked: false }
      })
      return { ...prev, [activeThreadId]: updated }
    })
  }

  // ── 권한 게이트 ───────────────────────────────────────────
  const handlePermissionAction = (gateId: string, action: "approve" | "deny") => {
    if (!activeThreadId) return
    setMessages((prev) => {
      const roomMsgs = prev[activeThreadId] ?? []
      const updated = roomMsgs.map((m) => {
        if (!m.permissionGate || m.permissionGate.id !== gateId) return m
        return {
          ...m,
          permissionGate: {
            ...m.permissionGate,
            status: action === "approve" ? ("approved" as const) : ("denied" as const),
          },
        }
      })
      return { ...prev, [activeThreadId]: updated }
    })

    if (action === "approve") {
      toast.success("작업이 승인되었습니다.")
    } else {
      toast("작업이 거부되었습니다.", { icon: "🚫" })
    }
  }

  // ── 문서 첨부/제거 ────────────────────────────────────────

  /** 문서를 컴포저에 추가 (중복 방지) */
  const handleAttachDoc = (doc: DocumentItem) => {
    setAttachedDocs((prev) => {
      if (prev.some((d) => d.id === doc.id)) {
        toast("이미 첨부된 파일입니다.", { icon: "📎" })
        return prev
      }
      toast.success(`${doc.name}이(가) 첨부되었습니다.`)
      return [...prev, doc]
    })
  }

  /** 컴포저에서 문서 제거 */
  const handleDetachDoc = (docId: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== docId))
  }

  /** 문서 패널 접기/펴기 토글 */
  const handleToggleDocPanel = () => {
    setIsDocPanelOpen((prev) => !prev)
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background text-foreground">
      {/* ── 모바일 오버레이 ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── 스레드 사이드바 (고정 폭, ResizablePanel 밖) ── */}
      <div
        className={cn(
          "fixed z-50 h-full transition-transform duration-200 md:relative md:z-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:hidden"
        )}
      >
        <ThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
            handleSelectThread(id)
            if (window.innerWidth < 768) setIsSidebarOpen(false)
          }}
          onCreateThread={handleCreateThread}
          onDeleteThread={handleDeleteThread}
        />
      </div>

      {/* ── 메인 작업 영역 (Resizable 2단: 채팅 + 문서) ── */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* 모바일 메뉴 버튼 */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-3 top-3 z-30 md:hidden cursor-pointer"
          id="mobile-menu-btn"
        >
          {isSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* 좌측 패널: 채팅 영역 */}
          <ResizablePanel defaultSize={isDocPanelOpen ? 65 : 100} minSize={40}>
            <ChatView
              messages={currentMessages}
              isTyping={isTyping}
              activeThreadTitle={activeTitle}
              attachedDocs={attachedDocs}
              isDocPanelOpen={isDocPanelOpen}
              onSendMessage={handleSendMessage}
              onToggleFeedback={handleToggleFeedback}
              onPermissionAction={handlePermissionAction}
              onDetachDoc={handleDetachDoc}
              onDropDoc={handleAttachDoc}
              onToggleDocPanel={handleToggleDocPanel}
            />
          </ResizablePanel>

          {/* 우측 패널: 문서 패널 (접기/펴기) */}
          {isDocPanelOpen && (
            <>
              <ResizableHandle
                withHandle
                className="bg-border/10 hover:bg-primary/20 transition-colors"
              />
              <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                <DocumentPanel
                  documents={documents}
                  onAttachToComposer={handleAttachDoc}
                  onCollapsePanel={handleToggleDocPanel}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
