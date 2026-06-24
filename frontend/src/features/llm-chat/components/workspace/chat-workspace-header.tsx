"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useChatWorkspaceArtifacts } from "@/features/llm-chat/hooks/workspace/use-chat-workspace-artifacts"
import { useChatWorkspaceUi } from "@/features/llm-chat/providers/chat-workspace-ui-provider"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { formatRelativeTime } from "@/shared/utils"

type ChatWorkspaceHeaderProps = {
  appThreadId: string
  title: string
  subtitle: string | null
}

export function ChatWorkspaceHeader({
  appThreadId,
  title,
  subtitle,
}: ChatWorkspaceHeaderProps) {
  const { artifacts } = useChatWorkspaceArtifacts(appThreadId)
  const { setActiveTab } = useChatWorkspaceUi()

  const latestArtifact = artifacts[0] ?? null

  return (
    <header className="border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle ??
              "LangGraph thread와 앱 스레드를 연결한 워크스페이스입니다."}
          </p>
        </div>

        {latestArtifact && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              생성된 결과물 {artifacts.length}개
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/example/chat/artifacts/${latestArtifact.id}`}
                onClick={() => setActiveTab("artifacts")}
              >
                최신 결과물 보기
              </Link>
            </Button>
          </div>
        )}
      </div>

      {latestArtifact && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          최근 생성 결과물: {latestArtifact.title} ·{" "}
          {formatRelativeTime(latestArtifact.updatedAt)}
        </p>
      )}
    </header>
  )
}
