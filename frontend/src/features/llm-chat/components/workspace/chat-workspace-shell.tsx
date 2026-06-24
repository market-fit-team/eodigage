"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { PanelLeft, PanelRight } from "lucide-react"
import { ChatContextPanel } from "@/features/llm-chat/components/workspace/chat-context-panel"
import { ChatThreadSidebar } from "@/features/llm-chat/components/workspace/chat-thread-sidebar"
import { useChatWorkspaceUi } from "@/features/llm-chat/providers/chat-workspace-ui-provider"
import { Button } from "@/shared/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"

type ChatWorkspaceShellProps = {
  children: ReactNode
}

const resolveThreadIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean)
  const chatIndex = segments.findIndex((segment) => segment === "chat")
  const maybeThreadId = segments[chatIndex + 1]

  if (
    !maybeThreadId ||
    maybeThreadId === "documents" ||
    maybeThreadId === "artifacts"
  ) {
    return null
  }

  return maybeThreadId
}

export function ChatWorkspaceShell({ children }: ChatWorkspaceShellProps) {
  const pathname = usePathname()
  const currentThreadId = resolveThreadIdFromPathname(pathname)
  const {
    isSidebarOpen,
    isContextPanelOpen,
    setSidebarOpen,
    setContextPanelOpen,
  } = useChatWorkspaceUi()

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] bg-background">
      <aside className="hidden w-80 shrink-0 border-r border-border/60 bg-card/50 lg:flex">
        <ChatThreadSidebar currentThreadId={currentThreadId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center justify-between border-b border-border/60 px-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="채팅 목록 열기"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium">LLM Chat Workspace</div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="컨텍스트 패널 열기"
            onClick={() => setContextPanelOpen(true)}
          >
            <PanelRight className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1">{children}</div>
      </div>

      <aside className="hidden w-96 shrink-0 border-l border-border/60 bg-card/30 xl:flex">
        <ChatContextPanel currentThreadId={currentThreadId} />
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>채팅 목록</SheetTitle>
            <SheetDescription>
              저장된 채팅 목록을 열고 원하는 대화를 선택합니다.
            </SheetDescription>
          </SheetHeader>
          <ChatThreadSidebar currentThreadId={currentThreadId} />
        </SheetContent>
      </Sheet>

      <Sheet open={isContextPanelOpen} onOpenChange={setContextPanelOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>컨텍스트 패널</SheetTitle>
            <SheetDescription>
              문서, 아티팩트, 메모리, 온보딩 컨텍스트를 확인합니다.
            </SheetDescription>
          </SheetHeader>
          <ChatContextPanel currentThreadId={currentThreadId} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
