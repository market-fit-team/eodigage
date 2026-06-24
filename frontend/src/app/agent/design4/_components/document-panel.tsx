// src/app/agent/design4/_components/document-panel.tsx
// 미니멀리즘 AI 에이전트 — 우측 문서 패널 컴포넌트
"use client"

import * as React from "react"
import {
  Eye,
  FileCode2,
  FileCog,
  FileJson,
  FileText,
  FileType,
  FolderOpen,
  GripVertical,
  LayoutGrid,
  List,
  MessageSquarePlus,
  MoreVertical,
  PanelLeftClose,
  PanelRightClose,
  Trash2,
} from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { DocumentItem } from "../_fixtures/mock-data"

// ─── 파일 타입별 아이콘 매핑 ────────────────────────────────

const fileTypeIcons: Record<DocumentItem["type"], React.ReactNode> = {
  tsx: <FileCode2 className="size-3.5 text-blue-500" />,
  ts: <FileCode2 className="size-3.5 text-blue-400" />,
  css: <FileType className="size-3.5 text-purple-500" />,
  json: <FileJson className="size-3.5 text-amber-500" />,
  md: <FileText className="size-3.5 text-foreground" />,
  env: <FileCog className="size-3.5 text-emerald-500" />,
  yaml: <FileCog className="size-3.5 text-rose-400" />,
}

// ─── Props ─────────────────────────────────────────────────

interface DocumentPanelProps {
  documents: DocumentItem[]
  onAttachToComposer: (doc: DocumentItem) => void
  onCollapsePanel: () => void
  side?: "left" | "right"
}

/** 우측 문서 패널 — 드래그 앤 드랍 + DropdownMenu 지원 */
export function DocumentPanel({
  documents,
  onAttachToComposer,
  onCollapsePanel,
  side = "right",
}: DocumentPanelProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border/20 bg-background">
      {/* ── 헤더 ── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/20 px-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            프로젝트 파일
          </span>
          <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
            {documents.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/20 p-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-5 w-5 cursor-pointer rounded-sm",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <List className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-5 w-5 cursor-pointer rounded-sm",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="size-3" />
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onCollapsePanel}
                  className="ml-1 cursor-pointer text-muted-foreground hover:text-foreground"
                  id="doc-panel-collapse-btn"
                >
                  {side === "left" ? (
                    <PanelLeftClose className="size-3.5" />
                  ) : (
                    <PanelRightClose className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={side === "left" ? "right" : "left"}>
                패널 접기
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── 문서 목록 ── */}
      {/* 왼쪽 리사이저블 패널에서도 쓰인다. ScrollArea 내부 래퍼가 긴 경로 폭을 따라 커지지 않도록 아래 보정 클래스는 유지한다. */}
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full [&_[data-slot=scroll-area-viewport]>div]:!min-w-0">
        <div
          className={cn(
            "p-2",
            viewMode === "list"
              ? "space-y-0.5"
              : "grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 p-3"
          )}
        >
          {documents.map((doc) =>
            viewMode === "list" ? (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isDragging={draggedId === doc.id}
                onAttach={() => onAttachToComposer(doc)}
                onDragStart={() => setDraggedId(doc.id)}
                onDragEnd={() => setDraggedId(null)}
              />
            ) : (
              <DocumentGridCard
                key={doc.id}
                doc={doc}
                isDragging={draggedId === doc.id}
                onAttach={() => onAttachToComposer(doc)}
                onDragStart={() => setDraggedId(doc.id)}
                onDragEnd={() => setDraggedId(null)}
              />
            )
          )}
        </div>
      </ScrollArea>

      {/* ── 하단 안내 ── */}
      <div className="shrink-0 border-t border-border/15 px-4 py-2.5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          파일을 채팅 입력창에 드래그하거나 ⋮ 메뉴에서 추가할 수 있습니다
        </p>
      </div>
    </div>
  )
}

// ─── 문서 행 컴포넌트 ──────────────────────────────────────

interface DocumentRowProps {
  doc: DocumentItem
  isDragging: boolean
  onAttach: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function DocumentRow({
  doc,
  isDragging,
  onAttach,
  onDragStart,
  onDragEnd,
}: DocumentRowProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        // 드래그 데이터에 문서 ID를 JSON으로 설정
        e.dataTransfer.setData("application/json", JSON.stringify(doc))
        e.dataTransfer.effectAllowed = "copy"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 transition-all active:cursor-grabbing",
        isDragging ? "scale-95 opacity-40" : "hover:bg-muted/30"
      )}
      id={`doc-row-${doc.id}`}
    >
      {/* 드래그 핸들 */}
      <GripVertical className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

      {/* 파일 아이콘 */}
      <span className="shrink-0">{fileTypeIcons[doc.type]}</span>

      {/* 파일 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-tight font-medium text-foreground">
          {doc.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {doc.path} · {doc.size}
        </p>
      </div>

      {/* 업데이트 시간 */}
      <span className="hidden shrink-0 text-xs text-muted-foreground group-hover:hidden sm:block">
        {doc.updatedAt}
      </span>

      {/* ⋮ 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted/50 hover:text-foreground"
            id={`doc-menu-${doc.id}`}
          >
            <MoreVertical className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onAttach} className="cursor-pointer">
            <MessageSquarePlus className="size-3.5" />
            <span>채팅에 추가</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Eye className="size-3.5" />
            <span>미리보기</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <Trash2 className="size-3.5" />
            <span>삭제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── 문서 그리드 카드 컴포넌트 ──────────────────────────────

function DocumentGridCard({
  doc,
  isDragging,
  onAttach,
  onDragStart,
  onDragEnd,
}: DocumentRowProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify(doc))
        e.dataTransfer.effectAllowed = "copy"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex cursor-grab flex-col items-center justify-center gap-2 rounded-lg border border-border/20 p-4 transition-all active:cursor-grabbing",
        isDragging ? "scale-95 opacity-40" : "hover:bg-muted/30"
      )}
      id={`doc-grid-${doc.id}`}
    >
      {/* 윗부분 파일 아이콘 */}
      <div className="mb-1 scale-[1.5]">{fileTypeIcons[doc.type]}</div>

      <div className="w-full min-w-0 text-center">
        <p className="truncate text-xs font-medium text-foreground">
          {doc.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {doc.size}
        </p>
      </div>

      {/* ⋮ 메뉴 (우측 상단 절대배치) */}
      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted/50 hover:text-foreground"
              id={`doc-menu-grid-${doc.id}`}
            >
              <MoreVertical className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onAttach} className="cursor-pointer">
              <MessageSquarePlus className="size-3.5" />
              <span>채팅에 추가</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="size-3.5" />
              <span>미리보기</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer">
              <Trash2 className="size-3.5" />
              <span>삭제</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
