"use client"

import * as React from "react"
import {
  BrainCircuit,
  Check,
  Edit2,
  PanelLeftClose,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  getListMemoriesApiV1AgentMemoriesGetQueryKey,
  useCreateMemoryApiV1AgentMemoriesPost,
  useDeleteMemoryApiV1AgentMemoriesMemoryIdDelete,
  useUpdateMemoryApiV1AgentMemoriesMemoryIdPatch,
} from "@/shared/api/generated/agent/endpoints/agent-memories/agent-memories"
import type { MemoryResponse } from "@/shared/api/generated/agent/schemas"
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
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { formatRelativeTime } from "@/shared/utils"

type MemoryPanelProps = {
  memories: MemoryResponse[]
  isLoading?: boolean
  onCloseSidebar: () => void
}

export function MemoryPanel({
  memories,
  isLoading,
  onCloseSidebar,
}: MemoryPanelProps) {
  const queryClient = useQueryClient()
  const [newValue, setNewValue] = React.useState("")
  const [editingMemory, setEditingMemory] =
    React.useState<MemoryResponse | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const createMemory = useCreateMemoryApiV1AgentMemoriesPost()
  const updateMemory = useUpdateMemoryApiV1AgentMemoriesMemoryIdPatch()
  const deleteMemory = useDeleteMemoryApiV1AgentMemoriesMemoryIdDelete()

  const invalidateMemories = () => {
    void queryClient.invalidateQueries({
      queryKey: getListMemoriesApiV1AgentMemoriesGetQueryKey(),
    })
  }

  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (!trimmed) {
      toast("기억할 내용을 먼저 입력해주세요.")
      return
    }

    createMemory.mutate(
      {
        data: {
          content: trimmed,
        },
      },
      {
        onSuccess: () => {
          setNewValue("")
          invalidateMemories()
          toast.success("새로운 기억이 추가되었습니다.")
        },
      }
    )
  }

  const handleEditSave = () => {
    if (!editingMemory || !editValue.trim()) {
      setEditingMemory(null)
      return
    }

    updateMemory.mutate(
      {
        memoryId: editingMemory.id,
        data: {
          content: editValue.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditingMemory(null)
          invalidateMemories()
          toast.success("기억이 수정되었습니다.")
        },
      }
    )
  }

  const handleEditCancel = () => {
    setEditingMemory(null)
    setEditValue("")
  }

  const handleDelete = (id: string) => {
    deleteMemory.mutate(
      { memoryId: id },
      {
        onSuccess: () => {
          invalidateMemories()
          toast("기억이 삭제되었습니다.")
        },
      }
    )
  }

  return (
    <aside className="flex h-full w-full min-w-0 shrink-0 flex-col overflow-hidden border-r border-border/30 bg-background">
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
                className="hidden cursor-pointer text-muted-foreground hover:text-foreground md:flex"
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

      <div className="px-3 pb-3">
        <div className="relative">
          <Input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder="AI에게 새 기억 입력..."
            className="h-8 w-full rounded-md bg-muted/40 py-1.5 pr-8 pl-3 text-xs"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleAdd}
            disabled={createMemory.isPending}
            className="absolute top-1 right-1 h-6 w-6 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full [&_[data-slot=scroll-area-viewport]>div]:!min-w-0">
        {isLoading ? (
          <div className="space-y-2 pb-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : memories.length === 0 ? (
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
                      onChange={(event) => setEditValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === "Enter"
                        ) {
                          event.preventDefault()
                          handleEditSave()
                        }
                        if (event.key === "Escape") {
                          event.preventDefault()
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
                        disabled={!editValue.trim() || updateMemory.isPending}
                        className="h-6 w-6 cursor-pointer text-emerald-500 hover:text-emerald-500 disabled:text-muted-foreground"
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="min-w-0 pr-6 text-xs leading-relaxed break-words text-foreground">
                    {memory.content}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(memory.updated_at)} ·{" "}
                  {memory.is_enabled ? "활성" : "비활성"}
                </p>

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
                          <AlertDialogTitle>
                            기억을 삭제할까요?
                          </AlertDialogTitle>
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
                            onClick={() => handleDelete(memory.id)}
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
