import { ChatDocumentDetailView } from "@/features/llm-chat/components/workspace/chat-document-detail-view"

type ChatDocumentDetailPageProps = {
  params: Promise<{
    documentId: string
  }>
}

export default async function ChatDocumentDetailPage({
  params,
}: ChatDocumentDetailPageProps) {
  const { documentId } = await params

  return (
    <div className="mx-auto max-w-4xl p-4">
      <ChatDocumentDetailView documentId={documentId} />
    </div>
  )
}
