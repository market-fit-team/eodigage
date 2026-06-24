import { ChatArtifactDetailView } from "@/features/llm-chat/components/workspace/chat-artifact-detail-view"
import { ChatDetailDialog } from "@/features/llm-chat/components/workspace/chat-detail-dialog"

type ChatArtifactDetailModalPageProps = {
  params: Promise<{
    artifactId: string
  }>
}

export default async function ChatArtifactDetailModalPage({
  params,
}: ChatArtifactDetailModalPageProps) {
  const { artifactId } = await params

  return (
    <ChatDetailDialog
      title="아티팩트 raw_text"
      description="현재 단계에서는 아티팩트를 원문 문자열 그대로 보여줍니다."
    >
      <ChatArtifactDetailView artifactId={artifactId} />
    </ChatDetailDialog>
  )
}
