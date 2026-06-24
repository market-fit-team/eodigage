// src/app/agent/design1/_components/ChatSidebar.tsx
"use client"

import * as React from "react"
import { MessageSquare, Moon, Plus, Sun, Trash2 } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import { ChatRoom } from "../_fixtures/chatMockData"

interface ChatSidebarProps {
  rooms: ChatRoom[]
  activeRoomId: string | null
  onSelectRoom: (roomId: string) => void
  onCreateRoom: () => void
  onDeleteRoom: (roomId: string, e: React.MouseEvent) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

// 왼쪽 사이드바 컴포넌트
export function ChatSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
  isDarkMode,
  onToggleDarkMode,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/40 bg-muted/10">
      {/* 상단 헤더: 앱 타이틀 및 새 대화 버튼 */}
      <div className="flex flex-col gap-4 p-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground/80">
            Antigravity AI
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleDarkMode}
            title={isDarkMode ? "라이트 모드로 변경" : "다크 모드로 변경"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDarkMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-border/50 bg-background/50 text-xs font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={onCreateRoom}
        >
          <Plus className="size-3.5" />
          새로운 대화 시작
        </Button>
      </div>

      <Separator className="bg-border/30" />

      {/* 중간: 대화방 리스트 */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <span className="px-3 text-[10px] font-medium tracking-wider text-muted-foreground/60 uppercase">
          최근 대화
        </span>
        <div className="mt-2 space-y-1">
          {rooms.map((room) => {
            const isActive = room.id === activeRoomId
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={cn(
                  "group relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs transition-all hover:bg-muted/40",
                  isActive
                    ? "bg-muted/60 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-6">
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{room.title}</span>
                </div>
                {/* 대화 삭제 버튼 (호버 시에만 표시) */}
                <button
                  onClick={(e) => onDeleteRoom(room.id, e)}
                  className="absolute right-2 p-1 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  title="대화 삭제"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
          {rooms.length === 0 && (
            <p className="px-3 py-4 text-center text-[11px] text-muted-foreground/50">
              최근 대화 내역이 없습니다.
            </p>
          )}
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* 하단: 가상 사용자 프로필 */}
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary/5 text-[10px] font-semibold text-primary">
            User
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-foreground/80">
            홍길동 (사용자)
          </span>
          <span className="truncate text-[10px] text-muted-foreground/70">
            Developer
          </span>
        </div>
      </div>
    </aside>
  )
}
