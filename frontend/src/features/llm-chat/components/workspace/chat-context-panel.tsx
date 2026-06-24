"use client"

import { ChatArtifactList } from "@/features/llm-chat/components/workspace/chat-artifact-list"
import { ChatDocumentList } from "@/features/llm-chat/components/workspace/chat-document-list"
import { ChatMemoryList } from "@/features/llm-chat/components/workspace/chat-memory-list"
import { ChatOnboardingPanel } from "@/features/llm-chat/components/workspace/chat-onboarding-panel"
import { useChatWorkspaceUi } from "@/features/llm-chat/providers/chat-workspace-ui-provider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"

type ChatContextPanelProps = {
  currentThreadId: string | null
}

export function ChatContextPanel({ currentThreadId }: ChatContextPanelProps) {
  const { activeTab, setActiveTab } = useChatWorkspaceUi()

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      className="min-h-0 flex-1"
    >
      <div className="border-b border-border/60 px-3 py-3">
        <div className="mb-2">
          <h2 className="text-sm font-semibold">컨텍스트 패널</h2>
          <p className="text-xs text-muted-foreground">
            문서와 아티팩트를 선택하면 다음 대화 입력에 함께 전달됩니다.
          </p>
        </div>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">문서</TabsTrigger>
          <TabsTrigger value="artifacts">결과물</TabsTrigger>
          <TabsTrigger value="memories">메모리</TabsTrigger>
          <TabsTrigger value="onboarding">온보딩</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="documents" className="min-h-0 flex-1">
        <ChatDocumentList />
      </TabsContent>
      <TabsContent value="artifacts" className="min-h-0 flex-1">
        <ChatArtifactList currentThreadId={currentThreadId} />
      </TabsContent>
      <TabsContent value="memories" className="min-h-0 flex-1">
        <ChatMemoryList />
      </TabsContent>
      <TabsContent value="onboarding" className="min-h-0 flex-1">
        <ChatOnboardingPanel currentThreadId={currentThreadId} />
      </TabsContent>
    </Tabs>
  )
}
