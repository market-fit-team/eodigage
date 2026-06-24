import { ChatDetailDialog } from "@/features/llm-chat/components/workspace/chat-detail-dialog"
import { ChatDocumentDetailView } from "@/features/llm-chat/components/workspace/chat-document-detail-view"

type ChatDocumentDetailModalPageProps = {
  params: Promise<{
    documentId: string
  }>
}

export default async function ChatDocumentDetailModalPage({
  params,
}: ChatDocumentDetailModalPageProps) {
  const { documentId } = await params

  return (
    <ChatDetailDialog
      title="문서 raw_text"
      description="현재 단계에서는 문서를 원문 문자열 그대로 보여줍니다."
    >
      <ChatDocumentDetailView documentId={documentId} />
    </ChatDetailDialog>
  )
}
