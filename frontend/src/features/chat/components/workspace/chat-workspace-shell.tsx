"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Folder, Menu, MessageSquare, NotebookPen, X } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { LibraryPanel } from "@/features/chat/components/workspace/library-panel"
import { MemoryPanel } from "@/features/chat/components/workspace/memory-panel"
import { RightSidebar } from "@/features/chat/components/workspace/right-sidebar"
import { ThreadList } from "@/features/chat/components/workspace/thread-list"
import { useChatWorkspace } from "@/features/chat/providers/chat-workspace-provider"
import type { HitlDecision } from "@/features/chat/types/hitl-interrupt-payload"
import { useListDocumentsApiV1AgentDocumentsGet } from "@/shared/api/generated/agent/endpoints/agent-documents/agent-documents"
import { useListMemoriesApiV1AgentMemoriesGet } from "@/shared/api/generated/agent/endpoints/agent-memories/agent-memories"
import {
  getListThreadsApiV1AgentThreadsGetQueryKey,
  useCreateThreadApiV1AgentThreadsPost,
  useDeleteThreadApiV1AgentThreadsThreadIdDelete,
  useListThreadsApiV1AgentThreadsGet,
} from "@/shared/api/generated/agent/endpoints/agent-threads/agent-threads"
import { Button } from "@/shared/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

type ChatWorkspaceShellProps = {
  children: ReactNode
  currentThreadId: string | null
  onHitlDecide?: (decisions: HitlDecision[]) => void
}

export function ChatWorkspaceShell({
  children,
  currentThreadId,
  onHitlDecide,
}: ChatWorkspaceShellProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    activeLeftTab,
    isLeftSidebarOpen,
    rightPanel,
    selectedDocumentIds,
    setActiveLeftTab,
    setIsLeftSidebarOpen,
    setRightPanel,
    toggleDocument,
  } = useChatWorkspace()
  const threadsQuery = useListThreadsApiV1AgentThreadsGet()
  const documentsQuery = useListDocumentsApiV1AgentDocumentsGet()
  const memoriesQuery = useListMemoriesApiV1AgentMemoriesGet()
  const createThread = useCreateThreadApiV1AgentThreadsPost()
  const deleteThread = useDeleteThreadApiV1AgentThreadsThreadIdDelete()

  const documents = documentsQuery.data?.documents ?? []
  const threads = threadsQuery.data?.threads ?? []
  const memories = memoriesQuery.data?.memories ?? []
  const isRightPanelOpen = rightPanel !== null
  const chatPanelDefaultSize = isLeftSidebarOpen
    ? isRightPanelOpen
      ? "46%"
      : "76%"
    : isRightPanelOpen
      ? "65%"
      : "100%"
  const docPanelDefaultSize = isLeftSidebarOpen ? "30%" : "35%"
  const activityButtonClassName =
    "size-8 cursor-pointer rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
  const activeActivityButtonClassName =
    "bg-muted text-foreground ring-1 ring-border/40 hover:bg-muted"

  const invalidateThreads = () => {
    void queryClient.invalidateQueries({
      queryKey: getListThreadsApiV1AgentThreadsGetQueryKey(),
    })
  }

  const handleCreateThread = () => {
    createThread.mutate(
      {
        data: {
          title: "새 대화",
        },
      },
      {
        onSuccess: (thread) => {
          invalidateThreads()
          router.push(`/chat/${thread.id}`)
          toast.success("새 대화가 시작되었습니다.")
        },
      }
    )
  }

  const handleDeleteThread = (threadId: string) => {
    deleteThread.mutate(
      { threadId },
      {
        onSuccess: () => {
          invalidateThreads()
          if (currentThreadId === threadId) {
            router.push("/chat")
          }
          toast("대화가 삭제되었습니다.")
        },
      }
    )
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background text-foreground">
      <div className="relative z-0 flex w-10 shrink-0 flex-col items-center justify-between border-r border-border/30 bg-background/95 py-3">
        <div className="flex flex-col gap-2">
          <ActivityButton
            className={cn(
              activityButtonClassName,
              activeLeftTab === "threads" && isLeftSidebarOpen
                ? activeActivityButtonClassName
                : "hover:bg-muted/70"
            )}
            label="채팅 목록"
            onClick={() => {
              setActiveLeftTab("threads")
              setIsLeftSidebarOpen(true)
            }}
          >
            <MessageSquare className="size-4" />
          </ActivityButton>
          <ActivityButton
            className={cn(
              activityButtonClassName,
              activeLeftTab === "library" && isLeftSidebarOpen
                ? activeActivityButtonClassName
                : "hover:bg-muted/70"
            )}
            label="라이브러리"
            onClick={() => {
              setActiveLeftTab("library")
              setIsLeftSidebarOpen(true)
            }}
          >
            <Folder className="size-4" />
          </ActivityButton>
          <ActivityButton
            className={cn(
              activityButtonClassName,
              activeLeftTab === "memory" && isLeftSidebarOpen
                ? activeActivityButtonClassName
                : "hover:bg-muted/70"
            )}
            label="AI 메모리"
            onClick={() => {
              setActiveLeftTab("memory")
              setIsLeftSidebarOpen(true)
            }}
          >
            <NotebookPen className="size-4" />
          </ActivityButton>
        </div>
      </div>

      {isLeftSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="absolute top-3 left-3 z-30 cursor-pointer md:hidden"
          id="mobile-menu-btn"
        >
          {isLeftSidebarOpen ? (
            <X className="size-4" />
          ) : (
            <Menu className="size-4" />
          )}
        </Button>

        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {isLeftSidebarOpen && (
            <>
              <ResizablePanel defaultSize="24%" minSize="18%" maxSize="36%">
                {activeLeftTab === "threads" && (
                  <ThreadList
                    threads={threads}
                    isLoading={threadsQuery.isLoading}
                    activeThreadId={currentThreadId}
                    onSelectThread={(threadId) => {
                      router.push(`/chat/${threadId}`)
                      if (window.innerWidth < 768) {
                        setIsLeftSidebarOpen(false)
                      }
                    }}
                    onCreateThread={handleCreateThread}
                    onDeleteThread={handleDeleteThread}
                    onToggleCollapse={() => setIsLeftSidebarOpen(false)}
                  />
                )}
                {activeLeftTab === "library" && (
                  <LibraryPanel
                    documents={documents}
                    isLoading={documentsQuery.isLoading}
                    selectedDocumentIds={selectedDocumentIds}
                    onToggleDocument={toggleDocument}
                    onOpenDocument={(document) =>
                      setRightPanel({ kind: "library-document", document })
                    }
                    onCollapsePanel={() => setIsLeftSidebarOpen(false)}
                    side="left"
                  />
                )}
                {activeLeftTab === "memory" && (
                  <MemoryPanel
                    memories={memories}
                    isLoading={memoriesQuery.isLoading}
                    onCloseSidebar={() => setIsLeftSidebarOpen(false)}
                  />
                )}
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="z-10 !w-1.5 cursor-col-resize bg-border/40 transition-colors hover:bg-primary/40"
              />
            </>
          )}

          <ResizablePanel defaultSize={chatPanelDefaultSize} minSize="40%">
            {children}
          </ResizablePanel>

          {isRightPanelOpen && rightPanel && (
            <>
              <ResizableHandle
                withHandle
                className="!w-1.5 cursor-col-resize bg-border/40 transition-colors hover:bg-primary/40"
              />
              <ResizablePanel
                defaultSize={docPanelDefaultSize}
                minSize="20%"
                maxSize="50%"
              >
                <RightSidebar
                  panel={rightPanel}
                  documents={documents}
                  isDocumentsLoading={documentsQuery.isLoading}
                  onClose={() => setRightPanel(null)}
                  onOpenDocument={(document) =>
                    setRightPanel({ kind: "library-document", document })
                  }
                  onHitlDecide={onHitlDecide}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

function ActivityButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode
  className: string
  label: string
  onClick: () => void
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={className}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
