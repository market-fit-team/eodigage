"use client"

import { useGetArtifactApiV1AgentArtifactsArtifactIdGet } from "@/shared/api/generated/agent/endpoints/agent-artifacts/agent-artifacts"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

type ChatArtifactDetailViewProps = {
  artifactId: string
}

export function ChatArtifactDetailView({
  artifactId,
}: ChatArtifactDetailViewProps) {
  const { data, error, isLoading } =
    useGetArtifactApiV1AgentArtifactsArtifactIdGet(artifactId)

  if (isLoading) {
    return <Skeleton className="h-[60dvh] rounded-xl" />
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertDescription>
          아티팩트 상세를 불러오지 못했습니다.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-h-[80dvh]">
      <CardHeader>
        <CardTitle>{data.title ?? `${data.type} 아티팩트`}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.type} · v{data.version}
        </p>
        {data.summary && (
          <p className="text-xs text-muted-foreground">{data.summary}</p>
        )}
      </CardHeader>
      <CardContent>
        <pre className="max-h-[60dvh] overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-6 whitespace-pre-wrap">
          {data.raw_text}
        </pre>
        {/* TODO: artifact type별 viewer registry를 도입하면 raw_text 대신 전용 viewer를 연결한다. */}
      </CardContent>
    </Card>
  )
}
