import { ChatWorkspaceThreadView } from "@/features/chat/components/workspace/chat-workspace-thread-view"

type ChatThreadPageProps = {
  params: Promise<{
    threadId: string
  }>
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { threadId } = await params

  return <ChatWorkspaceThreadView threadId={threadId} />
}
