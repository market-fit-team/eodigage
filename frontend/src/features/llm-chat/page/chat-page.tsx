"use client"

import { Suspense } from "react"
import {
  ChatApp,
  ChatAppSkeleton,
} from "@/features/llm-chat/page/components/chat-shell"

export function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-4xl flex-col overflow-hidden border-x border-border/60 bg-background">
      <Suspense fallback={<ChatAppSkeleton />}>
        <ChatApp />
      </Suspense>
    </div>
  )
}
