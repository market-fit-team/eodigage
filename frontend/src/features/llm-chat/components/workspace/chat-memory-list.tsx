"use client"

import { useChatWorkspaceMemories } from "@/features/llm-chat/hooks/workspace/use-chat-workspace-memories"
import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { formatRelativeTime } from "@/shared/utils"

export function ChatMemoryList() {
  const { error, isLoading, memories } = useChatWorkspaceMemories()

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`memory-skeleton-${index}`}
            className="h-20 rounded-lg"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Empty className="border border-border/60">
        <EmptyHeader>
          <EmptyTitle>메모리를 불러오지 못했습니다.</EmptyTitle>
          <EmptyDescription>메모리 목록을 다시 조회해 주세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (memories.length === 0) {
    return (
      <Empty className="border border-border/60">
        <EmptyHeader>
          <EmptyTitle>저장된 메모리가 없습니다.</EmptyTitle>
          <EmptyDescription>
            장기 메모리는 스레드 바깥에서 재사용되는 사용자 메모입니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {memories.map((memory) => (
          <Card key={memory.id} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{memory.source}</CardTitle>
                <Badge variant={memory.isEnabled ? "secondary" : "outline"}>
                  {memory.isEnabled ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs">{memory.content}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatRelativeTime(memory.updatedAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
