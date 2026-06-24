// src/app/agent/design3/_components/ThreadList.tsx
// 미니멀리즘 AI 에이전트 — 스레드 사이드바 컴포넌트
"use client"

import * as React from "react"
import {
  MessageSquare,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import type { Thread } from "../_fixtures/mockData"

interface ThreadListProps {
  threads: Thread[]
  activeThreadId: string | null
  onSelectThread: (id: string) => void
  onCreateThread: () => void
  onDeleteThread: (id: string) => void
}

/** 미니멀한 스레드(대화) 목록 사이드바 */
export function ThreadList({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
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
    <aside className="flex h-full w-64 flex-col border-r border-border/30 bg-background">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <span className="text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">
          Threads
        </span>
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
      </div>

      {/* ── 검색 ── */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-md border-0 bg-muted/40 py-1.5 pr-3 pl-7 text-[11px] text-foreground transition-colors outline-none placeholder:text-muted-foreground/40 focus:bg-muted/60"
            id="thread-search-input"
          />
        </div>
      </div>

      {/* ── 스레드 목록 ── */}
      <ScrollArea className="flex-1 px-2">
        {/* 고정된 스레드 섹션 */}
        {pinned.length > 0 && (
          <div className="mb-1">
            <span className="px-2 py-1 text-[9px] font-medium tracking-wider text-muted-foreground/50 uppercase">
              Pinned
            </span>
            {pinned.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                isHovered={thread.id === hoveredId}
                onSelect={() => onSelectThread(thread.id)}
                onDelete={() => onDeleteThread(thread.id)}
                onMouseEnter={() => setHoveredId(thread.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        )}

        {/* 일반 스레드 섹션 */}
        {pinned.length > 0 && unpinned.length > 0 && (
          <span className="px-2 py-1 text-[9px] font-medium tracking-wider text-muted-foreground/50 uppercase">
            Recent
          </span>
        )}
        {unpinned.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isActive={thread.id === activeThreadId}
            isHovered={thread.id === hoveredId}
            onSelect={() => onSelectThread(thread.id)}
            onDelete={() => onDeleteThread(thread.id)}
            onMouseEnter={() => setHoveredId(thread.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-[10px] text-muted-foreground/40">
            검색 결과가 없습니다
          </p>
        )}
      </ScrollArea>

      {/* ── 하단 상태 표시 ── */}
      <div className="border-t border-border/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] text-muted-foreground/60">
            Agent Online
          </span>
        </div>
      </div>
    </aside>
  )
}

// ─── 스레드 항목 내부 컴포넌트 ─────────────────────────────

interface ThreadItemProps {
  thread: Thread
  isActive: boolean
  isHovered: boolean
  onSelect: () => void
  onDelete: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function ThreadItem({
  thread,
  isActive,
  isHovered,
  onSelect,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: ThreadItemProps) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150 select-none",
        isActive
          ? "bg-foreground/[0.04] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.02] hover:text-foreground/80"
      )}
      id={`thread-item-${thread.id}`}
    >
      {/* 활성 인디케이터 */}
      {isActive && (
        <span className="absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-foreground/60" />
      )}

      {/* 아이콘 */}
      <span className="mt-0.5 shrink-0">
        {thread.isPinned ? (
          <Pin className="size-3 text-muted-foreground/40" />
        ) : (
          <MessageSquare className="size-3 text-muted-foreground/40" />
        )}
      </span>

      {/* 텍스트 영역 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] leading-tight font-medium">
          {thread.title}
        </p>
        {thread.subtitle && (
          <p className="mt-0.5 truncate text-[9px] leading-tight text-muted-foreground/50">
            {thread.subtitle}
          </p>
        )}
        <p className="mt-1 text-[8px] text-muted-foreground/35">
          {thread.updatedAt} · {thread.messageCount}개 메시지
        </p>
      </div>

      {/* 삭제 버튼 (호버 시 표시) */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
          id={`thread-delete-${thread.id}`}
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </button>
  )
}
