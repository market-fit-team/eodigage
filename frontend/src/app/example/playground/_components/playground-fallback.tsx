"use client"

import { type FallbackProps } from "react-error-boundary"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

export function PlaygroundSuspenseFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>로딩 중...</CardTitle>
        <CardDescription>데이터를 불러오는 중입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div>잠시만 기다려주세요...</div>
      </CardContent>
    </Card>
  )
}

export function PlaygroundErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    <Card>
      <CardHeader>
        <CardTitle>플레이그라운드 로딩 실패</CardTitle>
        <CardDescription>
          클라이언트 컴포넌트에서 에러가 발생했습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre>{errorMessage}</pre>
        <div>
          <Button onClick={resetErrorBoundary}>다시 시도하기</Button>
        </div>
      </CardContent>
    </Card>
  )
}
