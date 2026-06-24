"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SendHorizonal } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateThreadApiV1AgentThreadsPost } from "@/shared/api/generated/agent/endpoints/agent-threads/agent-threads"
import { Button } from "@/shared/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/components/ui/empty"
import { Textarea } from "@/shared/components/ui/textarea"

export function ChatWorkspaceEmptyState() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState("")
  const createThread = useCreateThreadApiV1AgentThreadsPost()

  const submit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || createThread.isPending) {
      return
    }

    // mutation pending 동안 버튼과 submit 진입을 함께 잠가 중복 스레드 생성을 막는다.
    const thread = await createThread.mutateAsync({
      data: {
        title: "새 대화",
      },
    })
    await queryClient.invalidateQueries()
    router.push(
      `/example/chat/${thread.id}?starter=${encodeURIComponent(trimmed)}`
    )
  }

  return (
    <div className="flex h-full items-center justify-center px-4 py-10">
      <Empty className="max-w-2xl border border-border/60 bg-card/60">
        <EmptyHeader>
          <EmptyTitle>새 대화를 시작해 보세요.</EmptyTitle>
          <EmptyDescription>
            첫 메시지를 보내면 앱 스레드를 만들고 해당 대화로 바로 이동합니다.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xl items-stretch">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="예: 이번 분기 시장 적합성 가설을 정리해 줘"
            className="min-h-32 resize-none bg-background"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => void submit()}
              disabled={!draft.trim() || createThread.isPending}
            >
              <SendHorizonal className="size-3.5" />새 대화 시작
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
