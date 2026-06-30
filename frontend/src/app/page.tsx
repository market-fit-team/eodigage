import { Suspense } from "react"
import { HomeCtaWidget } from "@/features/home/components/home-cta-widget/home-cta-widget"
import { MainPostCarouselWidgetContainer } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget-container"
// import { MainPostCarouselWidget } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget"
import { TrendForecastBannerSkeleton } from "@/features/trend/components/trend-forecast-banner-widget/trend-forecast-banner-skeleton"
import { TrendForecastBannerWidget } from "@/features/trend/components/trend-forecast-banner-widget/trend-forecast-banner-widget"

export default function HomePage() {
  return (
    <main className="flex-1 bg-background pb-20">
      <Suspense fallback={<TrendForecastBannerSkeleton />}>
        <TrendForecastBannerWidget />
      </Suspense>

      <div className="bg-background py-10">
        <div className="mx-auto max-w-7xl space-y-9 px-4 sm:px-6 lg:px-8">
          <MainPostCarouselWidgetContainer />
          <HomeCtaWidget />
        </div>
      </div>
    </main>
  )
}
