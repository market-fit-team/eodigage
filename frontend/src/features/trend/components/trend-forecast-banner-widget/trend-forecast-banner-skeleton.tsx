import { Skeleton } from "@/shared/components/ui/skeleton"

// 트렌드 배너 로딩 상태. Suspense fallback으로 써서 페이지 셸을 먼저 그린다.
export function TrendForecastBannerSkeleton() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}
