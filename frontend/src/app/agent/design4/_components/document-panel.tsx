// src/app/agent/design4/_components/document-panel.tsx
// 미니멀리즘 AI 에이전트 — 우측 문서 패널 컴포넌트
"use client"

import * as React from "react"
import {
  FileCode2,
  FileJson,
  FileText,
  FileCog,
  FileType,
  MoreVertical,
  MessageSquarePlus,
  Eye,
  Trash2,
  GripVertical,
  PanelRightClose,
  FolderOpen,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Badge } from "@/shared/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
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
}

/** 우측 문서 패널 — 드래그 앤 드랍 + DropdownMenu 지원 */
export function DocumentPanel({
  documents,
  onAttachToComposer,
  onCollapsePanel,
}: DocumentPanelProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null)

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden bg-background border-l border-border/20">
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onCollapsePanel}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                id="doc-panel-collapse-btn"
              >
                <PanelRightClose className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">패널 접기</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── 문서 목록 ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-0.5">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isDragging={draggedId === doc.id}
              onAttach={() => onAttachToComposer(doc)}
              onDragStart={() => setDraggedId(doc.id)}
              onDragEnd={() => setDraggedId(null)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* ── 하단 안내 ── */}
      <div className="shrink-0 border-t border-border/15 px-4 py-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed">
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
        "group flex items-center gap-2 rounded-lg px-2 py-2 transition-all cursor-grab active:cursor-grabbing",
        isDragging
          ? "opacity-40 scale-95"
          : "hover:bg-muted/30"
      )}
      id={`doc-row-${doc.id}`}
    >
      {/* 드래그 핸들 */}
      <GripVertical className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* 파일 아이콘 */}
      <span className="shrink-0">
        {fileTypeIcons[doc.type]}
      </span>

      {/* 파일 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground leading-tight">
          {doc.name}
        </p>
        <p className="truncate text-xs text-muted-foreground mt-0.5">
          {doc.path} · {doc.size}
        </p>
      </div>

      {/* 업데이트 시간 */}
      <span className="shrink-0 text-xs text-muted-foreground hidden group-hover:hidden sm:block">
        {doc.updatedAt}
      </span>

      {/* ⋮ 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/50 hover:text-foreground transition-all cursor-pointer"
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
