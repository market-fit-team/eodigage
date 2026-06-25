import { TrendBannerBlock } from "@/features/trend/components/trend-forecast-banner-widget/trend-theme-carousel"
import { getTrendForecastBanner } from "@/features/trend/lib/trend-forecast-server-api"

// 트렌드 기능의 진입 배너다. 하나의 블록 안에서 상단 토글로 두 모드를 전환한다.
// - 곧 뜰 동네: 검증된 예측 모델(다음 8주 상승 전망, 역추세).
// - 지금 인기: 최근 실측 생활인구 증가(예측 아님, 사실 보고).
// 데이터는 trend-service에서 가져오고, 서비스가 없으면 섹션을 생략한다.
export async function TrendForecastBannerWidget() {
  const trendForecastBanner = await getTrendForecastBanner()

  // 서비스 불가/계약 불일치 시 가짜 데이터 대신 섹션을 생략한다.
  if (!trendForecastBanner) return null

  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TrendBannerBlock banner={trendForecastBanner} />
      </div>
    </section>
  )
}
