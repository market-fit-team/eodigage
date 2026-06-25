"use client"

import { RecommendationEmpty } from "@/features/map/components/recommendation/recommendation-empty"
import { RecommendationItem } from "@/features/map/components/recommendation/recommendation-item"
import { useMarketRecommendations } from "@/features/map/hooks/use-market-recommendations"
import { useMapStore } from "@/features/map/store/map-store"
import { CardContent } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

function RecommendationSkeleton() {
  return (
    <CardContent className="flex flex-1 flex-col gap-2 px-3 py-3">
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
    </CardContent>
  )
}

// 로그인 사용자의 추천 행정동 목록을 표시하고 선택 상태를 지도/미리보기에 반영한다.
export function Recommendation() {
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)
  const selectDong = useMapStore((state) => state.selectDong)
  const focusMapOnDong = useMapStore((state) => state.focusMapOnDong)
  const resetFilters = useMapStore((state) => state.resetFilters)

  const { areas, isError, isLoading } = useMarketRecommendations()

  const handleSelect = (dongCode: string) => {
    selectDong(dongCode)
    focusMapOnDong(dongCode)
  }

  if (isLoading) {
    return <RecommendationSkeleton />
  }

  if (isError) {
    return (
      <CardContent className="flex flex-1 items-center justify-center px-4 py-3 text-center text-xs leading-relaxed text-destructive">
        추천 상권 목록을 불러오지 못했습니다.
      </CardContent>
    )
  }

  if (areas.length === 0) {
    return (
      <RecommendationEmpty
        hasRecommendations={false}
        onResetFilters={resetFilters}
      />
    )
  }

  return (
    <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 text-xs">
      {areas.map((tradeArea) => {
        return (
          <RecommendationItem
            key={tradeArea.dongCode}
            tradeArea={tradeArea}
            isSelected={tradeArea.dongCode === selectedDongCode}
            onSelect={() => handleSelect(tradeArea.dongCode)}
          />
        )
      })}
    </CardContent>
  )
}
