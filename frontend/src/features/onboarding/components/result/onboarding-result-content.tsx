import Link from "next/link"
import {
  ChartColumnIncreasing,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import {
  buildOnboardingInsights,
  getOnboardingEntryPath,
} from "@/features/onboarding/lib/onboarding-result"
import type { OnboardingSurveyResult } from "@/features/onboarding/types/onboarding"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { ProfileRadar } from "./profile-radar"
import { ProfileSummary } from "./profile-summary"
import { RecommendationCard } from "./recommendation-card"

type OnboardingResultContentProps = {
  actions?: React.ReactNode
  result: OnboardingSurveyResult
}

export function OnboardingResultContent({
  actions,
  result,
}: OnboardingResultContentProps) {
  const profile = result.profile
  const userProfile = profile.user_profile
  const recommendations = result.prediction.recommendations
  const insights = buildOnboardingInsights(userProfile)

  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-background via-background to-accent/10 px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                분석 완료
              </Badge>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                맞춤 상권 추천 결과
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                {userProfile.profile_name}님의 창업 성향을 기준으로 추천 상권{" "}
                {recommendations.length}곳을 정리했습니다.
              </p>
            </div>

            {actions}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <aside className="space-y-5 lg:col-span-5">
            <div className="space-y-5 lg:sticky lg:top-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-4 w-1 rounded-full bg-primary" />
                나의 창업 성향
              </h2>

              <Card>
                <CardContent className="flex items-center justify-center pt-4 pb-2">
                  <ProfileRadar profile={userProfile} />
                </CardContent>
              </Card>

              <ProfileSummary
                profileCode={profile.profile_code}
                userProfile={userProfile}
              />

              <Card className="border-primary/15 bg-primary/[0.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary/70" />
                    핵심 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                  {insights.map((insight) => (
                    <div key={insight.text} className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          insight.tone === "positive"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span>{insight.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </aside>

          <section className="space-y-5 lg:col-span-7">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-4 w-1 rounded-full bg-primary" />
              추천 상권 TOP {recommendations.length}
            </h2>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.item_id}
                  item={recommendation}
                  delay={index * 80}
                />
              ))}
            </div>

            <Card className="border-border/60 bg-muted/15">
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ChartColumnIncreasing className="h-4 w-4 text-primary" />
                  결과 해석 팁
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  추천 결과는 설문 응답 기반 성향 점수와 상권 특징을 함께 반영한
                  참고용 분석입니다. 실제 창업 전에는 현장 조사와 비용 검토를
                  함께 진행하는 편이 안전합니다.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 border-t border-border/30 pt-4 sm:flex-row">
              <Button asChild variant="outline" className="w-full sm:flex-1">
                <Link href={getOnboardingEntryPath()}>
                  <RotateCcw className="h-4 w-4" />
                  설문 다시 하기
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
