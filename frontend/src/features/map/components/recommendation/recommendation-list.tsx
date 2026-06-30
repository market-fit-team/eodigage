import { ArrowLeft } from "lucide-react"
import { RecommendationItem } from "@/features/map/components/recommendation/recommendation-item"
import type { MarketAreaListItem } from "@/features/map/types/map"
import { Button } from "@/shared/components/ui/button"
import { CardContent } from "@/shared/components/ui/card"

type RecommendationListProps = {
  areas: MarketAreaListItem[]
  onBackToCategories: () => void
  onSelectArea: (dongCode: string) => void
  selectedDongCode: string | null
}

export function RecommendationList({
  areas,
  onBackToCategories,
  onSelectArea,
  selectedDongCode,
}: RecommendationListProps) {
  return (
    <CardContent className="flex flex-1 flex-col overflow-y-auto px-4 py-4 text-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBackToCategories}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft data-icon="inline-start" className="size-3.5" />
          </Button>
          <h3 className="truncate text-sm font-semibold text-foreground">
            추천 후보
          </h3>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {areas.length}개
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {areas.map((tradeArea, index) => (
          <RecommendationItem
            key={tradeArea.dongCode}
            rank={index + 1}
            tradeArea={tradeArea}
            isSelected={tradeArea.dongCode === selectedDongCode}
            onSelect={() => onSelectArea(tradeArea.dongCode)}
          />
        ))}
      </ol>
    </CardContent>
  )
}
