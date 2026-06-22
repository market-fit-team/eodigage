"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useFilteredRecommendedAreas } from "@/features/map/hooks/use-filtered-recommended-areas"
import { useRecommendedAreas } from "@/features/map/hooks/use-recommended-areas"
import { useMapStore } from "@/features/map/store/map-store"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { CardContent } from "@/shared/components/ui/card"

// 추천 원천(온보딩·설문·AI)은 useFilteredRecommendedAreas 훅이 필터까지 적용해 파생하므로
// 여기서는 표시만 맡는다.
export function RecommendationWidget() {
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)
  const selectDong = useMapStore((state) => state.selectDong)
  const focusMapOnDong = useMapStore((state) => state.focusMapOnDong)
  const resetFilters = useMapStore((state) => state.resetFilters)

  // 추천 자체 유무(필터 전)와 필터 적용 결과를 구분해 빈 상태 안내를 다르게 보여준다.
  const hasAnyRecommendation = useRecommendedAreas().length > 0
  const recommendedTradeAreas = useFilteredRecommendedAreas()

  const handleSelect = (dongCode: string) => {
    selectDong(dongCode)
    focusMapOnDong(dongCode)
  }

  if (recommendedTradeAreas.length === 0) {
    return (
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-3 text-center text-xs">
        <Sparkles className="h-6 w-6 text-muted-foreground" />
        {hasAnyRecommendation ? (
          // 추천은 있으나 현재 필터가 모두 걸러낸 경우
          <>
            <p className="leading-relaxed text-muted-foreground">
              현재 필터 조건에 맞는 추천 상권이 없습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              필터 초기화
            </Button>
          </>
        ) : (
          // 온보딩·설문 추천이 아예 없는 경우
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

  return (
    <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 text-xs">
      {recommendedTradeAreas.map((tradeArea) => {
        const isSelected = tradeArea.id === selectedDongCode

        return (
          <button
            key={tradeArea.id}
            type="button"
            onClick={() => handleSelect(tradeArea.id)}
            className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {tradeArea.nameKo}
              </span>
              <Badge variant="outline">{tradeArea.nameEn}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              월평균 매출 {tradeArea.avgSales.toLocaleString()}만원 · 3년 생존률{" "}
              {tradeArea.survivalRate3Year}%
            </span>
          </button>
        )
      })}
    </CardContent>
  )
}
