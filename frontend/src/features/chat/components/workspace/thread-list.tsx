"use client"

import * as React from "react"
import {
  Loader2,
  MessageSquare,
  MoreVertical,
  PanelLeft,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import type { AgentThreadResponse } from "@/shared/api/generated/agent/schemas"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import { formatRelativeTime } from "@/shared/utils"

type ThreadListProps = {
  threads: AgentThreadResponse[]
  activeThreadId: string | null
  isLoading?: boolean
  onSelectThread: (id: string) => void
  onCreateThread: () => void
  onDeleteThread: (id: string) => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
}

export function ThreadList({
  threads,
  activeThreadId,
  isLoading,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onToggleCollapse,
  isCollapsed = false,
}: ThreadListProps) {
  const [search, setSearch] = React.useState("")
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  const filtered = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(search.toLowerCase()) ||
      thread.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
      thread.last_message_preview?.toLowerCase().includes(search.toLowerCase())
  )

  const pinned = filtered.filter((thread) => thread.is_pinned)
  const unpinned = filtered.filter((thread) => !thread.is_pinned)

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-border/30 bg-background transition-all duration-300">
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

      <div
        className={cn(
          "flex pb-2 transition-all",
          isCollapsed ? "justify-center px-2" : "px-3"
        )}
      >
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3.5" />
          </Button>
        ) : (
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="검색..."
              className="w-full rounded-md border-0 bg-muted/40 py-1.5 pr-3 pl-7 text-xs text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted/60"
              id="thread-search-input"
            />
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full [&_[data-slot=scroll-area-viewport]>div]:!min-w-0">
        {isLoading ? (
          <div className="space-y-2 px-1 py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <ThreadSection
                label="Pinned"
                threads={pinned}
                activeThreadId={activeThreadId}
                hoveredId={hoveredId}
                isCollapsed={isCollapsed}
                onDeleteThread={onDeleteThread}
                onSelectThread={onSelectThread}
                setHoveredId={setHoveredId}
              />
            )}

            {pinned.length > 0 && unpinned.length > 0 && !isCollapsed && (
              <span className="block px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Recent
              </span>
            )}

            <ThreadSection
              threads={unpinned}
              activeThreadId={activeThreadId}
              hoveredId={hoveredId}
              isCollapsed={isCollapsed}
              onDeleteThread={onDeleteThread}
              onSelectThread={onSelectThread}
              setHoveredId={setHoveredId}
            />

            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                검색 결과가 없습니다
              </p>
            )}
          </>
        )}
      </ScrollArea>

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

type ThreadSectionProps = {
  label?: string
  threads: AgentThreadResponse[]
  activeThreadId: string | null
  hoveredId: string | null
  isCollapsed: boolean
  onSelectThread: (id: string) => void
  onDeleteThread: (id: string) => void
  setHoveredId: (id: string | null) => void
}

function ThreadSection({
  label,
  threads,
  activeThreadId,
  hoveredId,
  isCollapsed,
  onSelectThread,
  onDeleteThread,
  setHoveredId,
}: ThreadSectionProps) {
  if (threads.length === 0) {
    return null
  }

  return (
    <div className="mb-1">
      {label && !isCollapsed && (
        <span className="block px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
      )}
      {threads.map((thread) => (
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
  )
}

type ThreadItemProps = {
  thread: AgentThreadResponse
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
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex w-full max-w-full cursor-pointer items-start gap-2.5 overflow-hidden rounded-lg transition-all duration-150 select-none",
        isCollapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
        isActive
          ? "bg-foreground/[0.04] text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.02] hover:text-foreground"
      )}
      id={`thread-item-${thread.id}`}
    >
      {isActive && (
        <span className="absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-foreground/60" />
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex shrink-0 items-center justify-center",
                !isCollapsed && "mt-0.5"
              )}
            >
              {thread.is_pinned ? (
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

      {!isCollapsed && (
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs leading-tight font-medium">
            {thread.title}
          </p>
          {(thread.subtitle || thread.last_message_preview) && (
            <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
              {thread.subtitle ?? thread.last_message_preview}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(thread.updated_at)} · {thread.message_count}개
            메시지
          </p>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex w-6 shrink-0 justify-end self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(event) => event.stopPropagation()}
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
                onClick={(event) => {
                  event.stopPropagation()
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

export function ThreadListError() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
      <Loader2 className="mr-2 size-3.5" />
      채팅 목록을 불러오지 못했습니다.
    </div>
  )
}
