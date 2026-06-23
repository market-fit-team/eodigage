"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BrainCircuit,
  Check,
  Edit2,
  PanelLeftClose,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import type { AiMemory } from "../_fixtures/mock-data"

interface MemoryPanelProps {
  memories: AiMemory[]
  onAdd: (content: string) => void
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  onCloseSidebar: () => void
}

export function MemoryPanel({
  memories,
  onAdd,
  onUpdate,
  onDelete,
  onCloseSidebar,
}: MemoryPanelProps) {
  const [newValue, setNewValue] = React.useState("")
  const [editingMemory, setEditingMemory] = React.useState<AiMemory | null>(null)
  const [editValue, setEditValue] = React.useState("")

  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (!trimmed) {
      toast("기억할 내용을 먼저 입력해주세요.")
      return
    }

    onAdd(trimmed)
    setNewValue("")
  }

  const handleEditSave = () => {
    if (editingMemory && editValue.trim()) {
      onUpdate(editingMemory.id, editValue.trim())
    }
    setEditingMemory(null)
  }

  const handleEditCancel = () => {
    setEditingMemory(null)
    setEditValue("")
  }

  return (
    <aside className="flex h-full min-w-0 w-full shrink-0 flex-col overflow-hidden border-r border-border/30 bg-background">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-2">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold tracking-wide text-foreground uppercase">
          <BrainCircuit className="size-3.5" />
          AI Memory
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onCloseSidebar}
                className="cursor-pointer text-muted-foreground hover:text-foreground hidden md:flex"
              >
                <PanelLeftClose className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">사이드바 닫기</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="px-3 pb-3 text-xs text-muted-foreground">
        AI가 개인화된 응답을 위해 저장한 컨텍스트입니다.
      </div>

      {/* ── 새 메모리 입력 ── */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="AI에게 새 기억 입력..."
            className="h-8 w-full rounded-md bg-muted/40 py-1.5 pr-8 pl-3 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleAdd}
            className="absolute top-1 right-1 h-6 w-6 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── 메모리 목록 ── */}
      {/* Radix ScrollArea의 내부 table 래퍼가 긴 메모리 문장 폭을 따라 커지면 왼쪽 패널이 다시 터진다. 아래 래퍼 보정 클래스는 제거하지 말 것. */}
      <ScrollArea className="flex-1 min-h-0 px-2 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!min-w-0 [&_[data-slot=scroll-area-viewport]>div]:!w-full">
        {memories.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            기억된 정보가 없습니다
          </p>
        ) : (
          <div className="flex w-full min-w-0 flex-col gap-2 pb-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="group relative flex w-full max-w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-border/40 bg-foreground/[0.02] px-2.5 py-2 text-left transition-colors hover:border-border/80"
              >
                {editingMemory?.id === memory.id ? (
                  <div className="flex min-w-0 flex-col gap-2 pr-6">
                    <Textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault()
                          handleEditSave()
                        }
                        if (e.key === "Escape") {
                          e.preventDefault()
                          handleEditCancel()
                        }
                      }}
                      className="min-h-20 text-xs leading-relaxed"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={handleEditCancel}
                        className="h-6 w-6 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={handleEditSave}
                        disabled={!editValue.trim()}
                        className="h-6 w-6 cursor-pointer text-emerald-500 hover:text-emerald-500 disabled:text-muted-foreground"
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="min-w-0 break-words pr-6 text-xs leading-relaxed text-foreground">
                    {memory.content}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {memory.createdAt}
                </p>
                
                {/* 액션 버튼 (호버 시 표시) */}
                {editingMemory?.id !== memory.id && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        setEditingMemory(memory)
                        setEditValue(memory.content)
                      }}
                      className="h-5 w-5 cursor-pointer bg-background/80 hover:bg-muted"
                    >
                      <Edit2 className="size-3 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-5 w-5 cursor-pointer bg-background/80 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogMedia>
                            <Trash2 className="size-4 text-destructive" />
                          </AlertDialogMedia>
                          <AlertDialogTitle>기억을 삭제할까요?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 기억은 AI 개인화 컨텍스트에서 제거됩니다. 삭제한
                            뒤에는 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cursor-pointer">
                            취소
                          </AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => onDelete(memory.id)}
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

    </aside>
  )
}
