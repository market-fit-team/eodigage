// src/app/agent/design1/page.tsx
"use client"

import * as React from "react"
import { toast } from "sonner"
import { ChatArea } from "./_components/ChatArea"
import { ChatSidebar } from "./_components/ChatSidebar"
import {
  ChatMessage,
  ChatRoom,
  MessageFile,
  getRandomBotResponse,
  initialMessages,
  initialRooms,
} from "./_fixtures/chatMockData"

// Next.js App Router의 전역 타입 헬퍼 PageProps 사용
// (타입이 전역에 제공되므로, 타입 에러를 피하기 위해 string 제네릭 또는 dynamic type 캐스팅)
export default function Design1Page() {
  const [rooms, setRooms] = React.useState<ChatRoom[]>(initialRooms)
  const [messages, setMessages] =
    React.useState<Record<string, ChatMessage[]>>(initialMessages)
  const [activeRoomId, setActiveRoomId] = React.useState<string | null>(
    "room-1"
  )
  const [isTyping, setIsTyping] = React.useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(false)

  // 테마 상태 로컬 스토리지 또는 DOM 클래스 동기화
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  const handleToggleDarkMode = () => {
    const nextDark = !isDarkMode
    setIsDarkMode(nextDark)
    if (nextDark) {
      document.documentElement.classList.add("dark")
      toast.success("다크 모드로 전환되었습니다.")
    } else {
      document.documentElement.classList.remove("dark")
      toast.success("라이트 모드로 전환되었습니다.")
    }
  }

  // 대화방 선택
  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
  }

  // 신규 대화방 생성
  const handleCreateRoom = () => {
    const newRoomId = `room-${Date.now()}`
    const newRoomTitle = `새로운 대화 #${rooms.length + 1}`
    const now = new Date()
    const timeStr = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    const newRoom: ChatRoom = {
      id: newRoomId,
      title: newRoomTitle,
      updatedAt: timeStr,
      lastMessage: "대화를 시작해 보세요.",
    }

    setRooms((prev) => [newRoom, ...prev])
    setMessages((prev) => ({ ...prev, [newRoomId]: [] }))
    setActiveRoomId(newRoomId)
    toast.success("새로운 대화방이 생성되었습니다.")
  }

  // 대화방 삭제
  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    setRooms((prev) => prev.filter((r) => r.id !== roomId))
    setMessages((prev) => {
      const copy = { ...prev }
      delete copy[roomId]
      return copy
    })

    // 현재 활성화된 방을 삭제한 경우 처리
    if (activeRoomId === roomId) {
      const remainingRooms = rooms.filter((r) => r.id !== roomId)
      if (remainingRooms.length > 0) {
        setActiveRoomId(remainingRooms[0].id)
      } else {
        setActiveRoomId(null)
      }
    }
    toast.error("대화방이 삭제되었습니다.")
  }

  // 메시지 전송 및 챗봇 가상 응답 트리거
  const handleSendMessage = (content: string, file?: MessageFile) => {
    if (!activeRoomId) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    const userMsgId = `msg-user-${Date.now()}`
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content,
      timestamp: timeStr,
      file,
    }

    // 1. 사용자 메시지 목록에 추가
    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newUserMsg],
    }))

    // 2. 사이드바 룸의 마지막 메시지 및 시간 업데이트
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoomId
          ? {
              ...r,
              lastMessage: file
                ? `[파일 첨부] ${content || file.name}`
                : content,
              updatedAt: timeStr,
            }
          : r
      )
    )

    // 3. AI 챗봇의 가상 응답 시뮬레이션
    setIsTyping(true)
    setTimeout(() => {
      const botMsgId = `msg-bot-${Date.now()}`
      const botContent = getRandomBotResponse()
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        content: botContent,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      }

      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), newBotMsg],
      }))

      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoomId
            ? {
                ...r,
                lastMessage: botContent,
                updatedAt: newBotMsg.timestamp,
              }
            : r
        )
      )
      setIsTyping(false)
    }, 1200)
  }

  // 메시지 피드백 토글 (좋아요/싫어요)
  const handleToggleFeedback = (
    messageId: string,
    type: "like" | "dislike"
  ) => {
    if (!activeRoomId) return

    setMessages((prev) => {
      const roomMsgs = prev[activeRoomId] || []
      const updated = roomMsgs.map((m) => {
        if (m.id !== messageId) return m

        if (type === "like") {
          return {
            ...m,
            isLiked: !m.isLiked,
            isDisliked: false, // 좋아요 활성화 시 싫어요 해제
          }
        } else {
          return {
            ...m,
            isDisliked: !m.isDisliked,
            isLiked: false, // 싫어요 활성화 시 좋아요 해제
          }
        }
      })
      return {
        ...prev,
        [activeRoomId]: updated,
      }
    })
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const activeRoomTitle = activeRoom ? activeRoom.title : "대화방 없음"
  const currentMessages = activeRoomId ? messages[activeRoomId] || [] : []

  return (
    <main className="mx-auto my-4 flex h-[calc(100vh-3.5rem)] w-full max-w-[1400px] overflow-hidden rounded-xl border border-border/20 bg-background shadow-sm">
      {/* 룸 리스트 사이드바 */}
      <ChatSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        onDeleteRoom={handleDeleteRoom}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* 대화 피드 및 메시지 입력 필드 */}
      {activeRoomId ? (
        <ChatArea
          messages={currentMessages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onToggleFeedback={handleToggleFeedback}
          activeRoomTitle={activeRoomTitle}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 text-center">
          <p className="text-xs text-muted-foreground">
            활성화된 대화방이 없습니다. 왼쪽 사이드바에서 새 대화를 시작해
            보세요.
          </p>
        </div>
      )}
    </main>
  )
}
