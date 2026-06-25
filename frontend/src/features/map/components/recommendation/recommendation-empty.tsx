import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useSession } from "@/features/auth/lib/auth-client"
import { Button } from "@/shared/components/ui/button"
import { CardContent } from "@/shared/components/ui/card"

type RecommendationEmptyProps = {
  hasRecommendations: boolean
  onResetFilters: () => void
}

export function RecommendationEmpty({
  hasRecommendations,
  onResetFilters,
}: RecommendationEmptyProps) {
  const pathname = usePathname()
  const { data: session, isPending } = useSession()
  const loginHref = `/login?${new URLSearchParams({
    callbackURL: pathname ?? "/map",
  }).toString()}`

  return (
    <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-3 text-center text-xs">
      <Sparkles className="h-6 w-6 text-muted-foreground" />
      {hasRecommendations ? (
        <>
          <p className="leading-relaxed text-muted-foreground">
            현재 필터 조건에 맞는 추천 상권이 없습니다.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
          >
            필터 초기화
          </Button>
        </>
      ) : isPending ? (
        <p className="leading-relaxed text-muted-foreground">
          추천 상권 상태를 확인하는 중입니다.
        </p>
      ) : !session ? (
        <>
          <p className="leading-relaxed text-muted-foreground">
            로그인하면 성향 분석 결과를 바탕으로 어울리는 행정동 상권을
            추천받을 수 있습니다.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={loginHref}>로그인하기</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="leading-relaxed text-muted-foreground">
            아직 추천 상권이 없습니다. 성향 분석을 완료하면 어울리는 행정동
            상권이 자동으로 추천됩니다.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">성향 분석 시작하기</Link>
          </Button>
        </>
      )}
    </CardContent>
  )
}
