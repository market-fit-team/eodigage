import { ChatArtifactDetailView } from "@/features/llm-chat/components/workspace/chat-artifact-detail-view"

type ChatArtifactDetailPageProps = {
  params: Promise<{
    artifactId: string
  }>
}

export default async function ChatArtifactDetailPage({
  params,
}: ChatArtifactDetailPageProps) {
  const { artifactId } = await params

  return (
    <div className="mx-auto max-w-4xl p-4">
      <ChatArtifactDetailView artifactId={artifactId} />
    </div>
  )
}
