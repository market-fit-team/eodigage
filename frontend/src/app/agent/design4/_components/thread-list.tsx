// src/app/agent/design4/_components/thread-list.tsx
// 미니멀리즘 AI 에이전트 — 스레드 사이드바 컴포넌트
"use client"

import * as React from "react"
import {
  MessageSquare,
  MoreVertical,
  PanelLeft,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import type { Thread } from "../_fixtures/mock-data"

interface ThreadListProps {
  threads: Thread[]
  activeThreadId: string | null
  onSelectThread: (id: string) => void
  onCreateThread: () => void
  onDeleteThread: (id: string) => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
}

/** 미니멀한 스레드(대화) 목록 사이드바 */
export function ThreadList({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onToggleCollapse,
  isCollapsed = false,
}: ThreadListProps) {
  const [search, setSearch] = React.useState("")
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  // 검색 필터
  const filtered = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.subtitle?.toLowerCase().includes(search.toLowerCase())
  )

  // 고정된 스레드와 일반 스레드 분리
  const pinned = filtered.filter((t) => t.isPinned)
  const unpinned = filtered.filter((t) => !t.isPinned)

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-border/30 bg-background transition-all duration-300">
      {/* ── 헤더 ── */}
      <div
        className={cn(
          "flex items-center pt-5 pb-2 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && (
          <span className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Threads
          </span>
        )}
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "flex-col gap-3" : "gap-1"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onCreateThread}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                  id="thread-create-btn"
                >
                  <Plus className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">새 대화 시작</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onToggleCollapse && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onToggleCollapse}
                    className="hidden cursor-pointer text-muted-foreground hover:text-foreground md:flex"
                  >
                    {isCollapsed ? (
                      <PanelLeft className="size-3.5" />
                    ) : (
                      <PanelLeftClose className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "사이드바 열기" : "사이드바 닫기"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* ── 검색 ── */}
      <div
        className={cn(
          "flex pb-2 transition-all",
          isCollapsed ? "justify-center px-2" : "px-3"
        )}
      >
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">검색</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full rounded-md border-0 bg-muted/40 py-1.5 pr-3 pl-7 text-xs text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted/60"
              id="thread-search-input"
            />
          </div>
        )}
      </div>

      {/* ── 스레드 목록 ── */}
      {/* Radix ScrollArea의 내부 table 래퍼가 긴 제목 폭을 따라 커지면 리사이저블 사이드바가 다시 터진다. 아래 래퍼 보정 클래스는 제거하지 말 것. */}
      <ScrollArea className="min-h-0 flex-1 px-2 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full [&_[data-slot=scroll-area-viewport]>div]:!min-w-0">
        {/* 고정된 스레드 섹션 */}
        {pinned.length > 0 && (
          <div className="mb-1">
            {!isCollapsed && (
              <span className="block px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Pinned
              </span>
            )}
            {pinned.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                isHovered={thread.id === hoveredId}
                isCollapsed={isCollapsed}
                onSelect={() => onSelectThread(thread.id)}
                onDelete={() => onDeleteThread(thread.id)}
                onMouseEnter={() => setHoveredId(thread.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        )}

        {/* 일반 스레드 섹션 */}
        {pinned.length > 0 && unpinned.length > 0 && !isCollapsed && (
          <span className="block px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Recent
          </span>
        )}
        {unpinned.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isActive={thread.id === activeThreadId}
            isHovered={thread.id === hoveredId}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectThread(thread.id)}
            onDelete={() => onDeleteThread(thread.id)}
            onMouseEnter={() => setHoveredId(thread.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            검색 결과가 없습니다
          </p>
        )}
      </ScrollArea>

      {/* ── 하단 상태 표시 ── */}
      <div
        className={cn(
          "border-t border-border/20 py-3",
          isCollapsed ? "flex justify-center" : "px-4"
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                {!isCollapsed && (
                  <span className="text-xs text-muted-foreground">
                    Agent Online
                  </span>
                )}
              </div>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Agent Online</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}

// ─── 스레드 항목 내부 컴포넌트 ─────────────────────────────
// button-in-button hydration 에러를 방지하기 위해
// 외부를 div[role=button]로 변경하고, 삭제 버튼만 button 유지

interface ThreadItemProps {
  thread: Thread
  isActive: boolean
  isHovered: boolean
  isCollapsed: boolean
  onSelect: () => void
  onDelete: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function ThreadItem({
  thread,
  isActive,
  isHovered,
  isCollapsed,
  onSelect,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: ThreadItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        // 메뉴 슬롯은 고정폭, 텍스트 영역만 min-w-0/truncate로 줄어들어야 한다.
        "group relative flex w-full max-w-full cursor-pointer items-start gap-2.5 overflow-hidden rounded-lg transition-all duration-150 select-none",
        isCollapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
        isActive
          ? "bg-foreground/[0.04] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.02] hover:text-foreground"
      )}
      id={`thread-item-${thread.id}`}
    >
      {/* 활성 인디케이터 */}
      {isActive && (
        <span className="absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-foreground/60" />
      )}

      {/* 아이콘 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex shrink-0 items-center justify-center",
                !isCollapsed && "mt-0.5"
              )}
            >
              {thread.isPinned ? (
                <Pin className="size-3 text-muted-foreground" />
              ) : (
                <MessageSquare className="size-3 text-muted-foreground" />
              )}
            </span>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">{thread.title}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* 텍스트 영역 */}
      {!isCollapsed && (
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs leading-tight font-medium">
            {thread.title}
          </p>
          {thread.subtitle && (
            <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
              {thread.subtitle}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {thread.updatedAt} · {thread.messageCount}개 메시지
          </p>
        </div>
      )}

      {/* 스레드 액션 메뉴 */}
      {!isCollapsed && (
        <div className="flex w-6 shrink-0 justify-end self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                  isHovered ? "opacity-100" : "opacity-60"
                )}
                id={`thread-menu-${thread.id}`}
              >
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="cursor-pointer"
                id={`thread-delete-${thread.id}`}
              >
                <Trash2 className="size-3.5" />
                <span>대화 삭제</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
