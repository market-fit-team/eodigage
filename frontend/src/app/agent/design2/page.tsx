// src/app/agent/design2/page.tsx
"use client"

import * as React from "react"
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import { ArtifactPanel } from "./_components/ArtifactPanel"
import { ChatInterface2 } from "./_components/ChatInterface2"
import {
  ChatMessage,
  MessageFile,
  getBotResponse,
  mockArtifacts,
  mockMessages,
  mockRooms,
} from "./_fixtures/chatMockData2"

// AI Workbench 메인 페이지 컴포넌트
export default function Page() {
  const [rooms, setRooms] = React.useState(mockRooms)
  const [activeRoomId, setActiveRoomId] = React.useState("room-dash")
  const [messages, setMessages] = React.useState(mockMessages)
  const [artifacts, setArtifacts] = React.useState(mockArtifacts)

  // 현재 대화방에서 포커스 중인 아티팩트 ID
  const [activeArtifactId, setActiveArtifactId] = React.useState<string | null>(
    "art-dash"
  )

  // AI 연산 로딩 상태
  const [isTyping, setIsTyping] = React.useState(false)

  // 사이드바 접기 토글 상태
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0]
  const currentMessages = messages[activeRoomId] || []

  // 사용자의 대화방 전환 핸들러
  const handleRoomSelect = (roomId: string) => {
    setActiveRoomId(roomId)
    // 방에 해당하는 아티팩트 자동 바인딩
    if (roomId === "room-dash") {
      setActiveArtifactId("art-dash")
    } else if (roomId === "room-landing") {
      setActiveArtifactId("art-landing")
    } else {
      setActiveArtifactId(null)
    }
  }

  // 메시지 전송 및 AI 응답 지연 시뮬레이션
  const handleSendMessage = (content: string, file?: MessageFile) => {
    const userMsgId = `msg-user-${Date.now()}`
    const timestamp = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content,
      timestamp,
      file,
    }

    // 1. 사용자 메시지 목록에 즉시 반영
    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), userMessage],
    }))

    // 2. AI 생각 단계 활성화 시뮬레이션
    setIsTyping(true)

    // 3. 지연 후 봇 응답 생성
    setTimeout(() => {
      const botResponse = getBotResponse(content)
      const botMsgId = `msg-bot-${Date.now()}`

      const botMessage: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        content: botResponse.content,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        thoughtSteps: botResponse.steps,
      }

      // 만약 특정 요청인 경우 아티팩트를 엮음
      if (activeArtifactId) {
        botMessage.artifactId = activeArtifactId
      }

      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), botMessage],
      }))

      setIsTyping(false)
      toast.success("AI 에이전트 분석 완료 및 아티팩트가 제안되었습니다.")
    }, 2000)
  }

  // 메시지 피드백 좋아요/싫어요 토글
  const handleToggleFeedback = (
    messageId: string,
    type: "like" | "dislike"
  ) => {
    setMessages((prev) => {
      const roomMsgs = prev[activeRoomId] || []
      const updated = roomMsgs.map((msg) => {
        if (msg.id !== messageId) return msg
        if (type === "like") {
          return { ...msg, isLiked: !msg.isLiked, isDisliked: false }
        } else {
          return { ...msg, isDisliked: !msg.isDisliked, isLiked: false }
        }
      })
      return { ...prev, [activeRoomId]: updated }
    })
  }

  // 아티팩트 수락/반려 이벤트
  const handleAcceptArtifact = () => {
    if (!activeArtifactId) return
    setArtifacts((prev) => ({
      ...prev,
      [activeArtifactId]: {
        ...prev[activeArtifactId],
        accepted: true,
      },
    }))
    toast.success("코드 변경 사항을 성공적으로 수락하여 저장했습니다.")
  }

  const handleRejectArtifact = () => {
    if (!activeArtifactId) return
    setArtifacts((prev) => ({
      ...prev,
      [activeArtifactId]: {
        ...prev[activeArtifactId],
        accepted: false,
      },
    }))
    toast.warning("코드 변경 사항을 반려했습니다.")
  }

  // AI 숏컷 액션 툴바 액션
  const handleActionClick = (action: string) => {
    if (!activeArtifactId) return

    setIsTyping(true)
    toast.info(`AI가 '${action}' 수행 중...`)

    setTimeout(() => {
      setIsTyping(false)

      // 아티팩트 코드 및 버전 가상 업데이트
      setArtifacts((prev) => {
        const art = prev[activeArtifactId]
        if (!art) return prev

        let newCode = art.modifiedCode
        if (action === "주석 추가") {
          newCode = `// [AI 주석 보강 완료]\n` + newCode
        } else if (action === "리팩토링") {
          newCode = `// [AI 성능 최적화 컴파일 및 정리 완료]\n` + newCode
        }

        return {
          ...prev,
          [activeArtifactId]: {
            ...art,
            version: art.version + 1,
            modifiedCode: newCode,
            accepted: null, // 새로운 제안이므로 다시 미정 상태로 리셋
          },
        }
      })

      // 대화창에 수행 완료 메시지 추가
      const botMsgId = `msg-action-${Date.now()}`
      const newActionMessage: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        content: `'${action}' 처리를 성공적으로 마쳤습니다. 개선된 아티팩트의 새 버전(v${artifacts[activeArtifactId].version + 1}) 코드를 검토하고 반영해 보세요.`,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        artifactId: activeArtifactId,
      }

      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), newActionMessage],
      }))

      toast.success("아티팩트 최적화 완료!")
    }, 1500)
  }

  const currentArtifact = activeArtifactId ? artifacts[activeArtifactId] : null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-xs font-light text-foreground">
      {/* 1. 좌측 메인 룸 사이드바 */}
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col overflow-hidden border-r border-border/40 bg-muted/10 transition-all duration-300",
          isSidebarOpen ? "w-60" : "w-0 border-r-0"
        )}
      >
        {/* 사이드바 헤더 */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
          <div className="flex items-center gap-2 font-semibold text-foreground/90">
            <BrainCircuit className="size-5 animate-pulse text-primary" />
            <span>AI Workbench</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsSidebarOpen(false)}
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        {/* 새 세션 시작 버튼 */}
        <div className="shrink-0 p-3">
          <Button
            variant="outline"
            size="sm"
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-[11px] font-normal"
            onClick={() => toast.info("새로운 가상 세션이 시작되었습니다.")}
          >
            <Plus className="size-3.5" />
            <span>새 작업 시작</span>
          </Button>
        </div>

        {/* 세션 리스트 */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2 py-1">
          <div className="px-2 py-1 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
            작업 히스토리
          </div>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors select-none",
                room.id === activeRoomId
                  ? "border-l-2 border-primary bg-primary/5 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              <MessageSquare className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-[11px]">{room.title}</p>
                <span className="text-[8px] text-muted-foreground/60">
                  {room.updatedAt}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 사이드바 하단 설정 */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/20 bg-muted/5 p-3 text-muted-foreground">
          <span className="flex items-center gap-1 text-[9px]">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Secure Mode Active
          </span>
          <Button variant="ghost" size="icon-xs" className="cursor-pointer">
            <Settings className="size-3.5" />
          </Button>
        </div>
      </aside>

      {/* 사이드바 닫혀있을 때 열어주는 플로팅 버튼 */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-50 cursor-pointer rounded-lg border border-border/50 bg-background p-1.5 shadow-md transition-colors hover:bg-muted"
        >
          <Menu className="size-4" />
        </button>
      )}

      {/* 2. 메인 워크벤치 영역 (Resizable 분할 화면) */}
      <main className="relative h-full min-w-0 flex-1">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* 좌측 패널: 채팅 대화창 */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              <ChatInterface2
                messages={currentMessages}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                onToggleFeedback={handleToggleFeedback}
                onSelectArtifact={setActiveArtifactId}
                activeRoomTitle={activeRoom.title}
              />
            </div>
          </ResizablePanel>

          {/* 분할 드래그 핸들 */}
          <ResizableHandle
            withHandle
            className="w-1.5 bg-border/20 transition-colors hover:bg-primary/40"
          />

          {/* 우측 패널: 아티팩트 코드 & 프리뷰 */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full">
              <ArtifactPanel
                data={currentArtifact}
                onAccept={handleAcceptArtifact}
                onReject={handleRejectArtifact}
                onActionClick={handleActionClick}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  )
}
