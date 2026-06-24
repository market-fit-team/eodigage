"use client"

import { useChatWorkspaceOnboarding } from "@/features/llm-chat/hooks/workspace/use-chat-workspace-onboarding"
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
import { Skeleton } from "@/shared/components/ui/skeleton"
import { formatRelativeTime } from "@/shared/utils"

type ChatOnboardingPanelProps = {
  currentThreadId: string | null
}

export function ChatOnboardingPanel({
  currentThreadId,
}: ChatOnboardingPanelProps) {
  const { error, isLoading, onboarding } =
    useChatWorkspaceOnboarding(currentThreadId)

  if (!currentThreadId) {
    return (
      <Empty className="border border-border/60">
        <EmptyHeader>
          <EmptyTitle>온보딩 컨텍스트는 스레드 선택 후 표시됩니다.</EmptyTitle>
          <EmptyDescription>
            현재 스레드에 연결된 프로필/카테고리 정보만 보여줍니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (isLoading) {
    return <Skeleton className="mx-3 mt-3 h-28 rounded-lg" />
  }

  if (error || !onboarding) {
    return (
      <Empty className="border border-border/60">
        <EmptyHeader>
          <EmptyTitle>온보딩 컨텍스트가 아직 연결되지 않았습니다.</EmptyTitle>
          <EmptyDescription>
            현재 스레드에 기본 프로필이나 수동 연결 결과가 없을 수 있습니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="p-3">
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">현재 온보딩 컨텍스트</CardTitle>
            <Badge variant="secondary">{onboarding.source}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs">
            결과 코드:{" "}
            <span className="font-medium">{onboarding.resultCode}</span>
          </div>
          <div className="text-xs">
            선택 카테고리:{" "}
            <span className="font-medium">
              {onboarding.selectedCategoryCode ?? "없음"}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {formatRelativeTime(onboarding.updatedAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
