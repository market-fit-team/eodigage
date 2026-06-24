"use client"

import { useGetDocumentApiV1AgentDocumentsDocumentIdGet } from "@/shared/api/generated/agent/endpoints/agent-documents/agent-documents"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

type ChatDocumentDetailViewProps = {
  documentId: string
}

export function ChatDocumentDetailView({
  documentId,
}: ChatDocumentDetailViewProps) {
  const { data, error, isLoading } =
    useGetDocumentApiV1AgentDocumentsDocumentIdGet(documentId)

  if (isLoading) {
    return <Skeleton className="h-[60dvh] rounded-xl" />
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertDescription>문서 상세를 불러오지 못했습니다.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-h-[80dvh]">
      <CardHeader>
        <CardTitle>{data.title ?? `${data.type} 문서`}</CardTitle>
        <p className="text-xs text-muted-foreground">{data.type}</p>
        {data.summary && (
          <p className="text-xs text-muted-foreground">{data.summary}</p>
        )}
      </CardHeader>
      <CardContent>
        <pre className="max-h-[60dvh] overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-6 whitespace-pre-wrap">
          {data.raw_text}
        </pre>
        {/* TODO: markdown/chart 전용 렌더러를 붙이면 raw_text 대신 구조화 렌더링으로 교체한다. */}
      </CardContent>
    </Card>
  )
}
