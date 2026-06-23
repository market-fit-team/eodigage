"use client"

import * as React from "react"
import { Trash2, Edit2, Check, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Input } from "@/shared/components/ui/input"
import type { AiMemory } from "../_fixtures/mock-data"

interface MemorySettingsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  memories: AiMemory[]
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
  onAdd: (content: string) => void
}

export function MemorySettingsModal({
  isOpen,
  onOpenChange,
  memories,
  onDelete,
  onUpdate,
  onAdd,
}: MemorySettingsModalProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [newValue, setNewValue] = React.useState("")

  const handleEditStart = (memory: AiMemory) => {
    setEditingId(memory.id)
    setEditValue(memory.content)
  }

  const handleEditSave = (id: string) => {
    if (editValue.trim()) {
      onUpdate(id, editValue.trim())
    }
    setEditingId(null)
  }

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim())
      setNewValue("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Memory 관리</DialogTitle>
          <DialogDescription>
            AI가 대화에서 기억하고 있는 사용자 정보, 취향, 컨텍스트입니다. 이 정보들은 새로운 대화 시 맞춤형 응답을 제공하는 데 사용됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* 새 메모리 추가 */}
          <div className="flex items-center gap-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="새로운 정보를 AI에게 기억시킵니다..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd()
              }}
            />
            <Button onClick={handleAdd} size="sm">추가</Button>
          </div>

          {/* 메모리 목록 */}
          <ScrollArea className="h-[300px] rounded-md border border-border/40 bg-muted/20 p-4">
            {memories.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-10">
                기억된 정보가 없습니다.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {editingId === memory.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(memory.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                          />
                          <Button size="icon-sm" variant="ghost" onClick={() => handleEditSave(memory.id)}>
                            <Check className="size-4 text-emerald-500" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="flex-1 text-sm leading-relaxed">{memory.content}</p>
                      )}

                      {editingId !== memory.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon-xs" variant="ghost" onClick={() => handleEditStart(memory)}>
                            <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button size="icon-xs" variant="ghost" onClick={() => onDelete(memory.id)}>
                            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      생성일: {memory.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
