import { Sparkles } from "lucide-react"
import { TrendThemeCarousel } from "@/features/trend/components/trend-forecast-banner-widget/trend-theme-carousel"
import { getTrendForecastBanner } from "@/features/trend/lib/trend-forecast-server-api"
import { Badge } from "@/shared/components/ui/badge"

// 트렌드 기능의 진입 배너다. 주제(전체·주말·남성·여성·20·30대)를 나눠 보여준다.
// 데이터는 trend-service 예측 결과에서 가져오고, 서비스가 없으면 섹션을 생략한다.
export async function TrendForecastBannerWidget() {
  const trendForecastBanner = await getTrendForecastBanner()

  // 서비스 불가/계약 불일치 시 가짜 데이터 대신 섹션을 생략한다.
  if (!trendForecastBanner) return null

  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" />
            {trendForecastBanner.eyebrow}
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {trendForecastBanner.title}
          </h2>
        </div>

        <TrendThemeCarousel themes={trendForecastBanner.themes} />
      </div>
    </section>
  )
}
