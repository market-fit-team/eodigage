"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useRecommendedAreas } from "@/features/map/hooks/use-recommended-areas"
import { getSelectedTradeArea } from "@/features/map/lib/map-selectors"
import { useMapStore } from "@/features/map/store/map-store"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { CardContent } from "@/shared/components/ui/card"

// 추천 원천(온보딩·설문·AI)은 useRecommendedAreas 훅이 파생하므로 여기서는 표시만 맡는다.
export function RecommendationWidget() {
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)
  const selectDong = useMapStore((state) => state.selectDong)
  const focusMapOnDong = useMapStore((state) => state.focusMapOnDong)

  const recommendedTradeAreaIds = useRecommendedAreas()
  const recommendedTradeAreas = recommendedTradeAreaIds
    .map((dongCode) => getSelectedTradeArea(dongCode))
    .filter((tradeArea) => tradeArea !== null)

  const handleSelect = (dongCode: string) => {
    selectDong(dongCode)
    focusMapOnDong(dongCode)
  }

  return (
    <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 text-xs">
      {recommendedTradeAreas.length === 0 ? (
        // 온보딩·설문 추천이 모두 없을 때의 CTA
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
          <p className="leading-relaxed text-muted-foreground">
            아직 추천 상권이 없습니다. 성향 분석을 완료하면 어울리는 행정동
            상권이 자동으로 추천됩니다.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">성향 분석 시작하기</Link>
          </Button>
        </div>
      ) : (
        recommendedTradeAreas.map((tradeArea) => {
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
                월평균 매출 {tradeArea.avgSales.toLocaleString()}만원 · 3년
                생존률 {tradeArea.survivalRate3Year}%
              </span>
            </button>
          )
        })
      )}
    </CardContent>
  )
}
