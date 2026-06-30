import type { MarketAreaListItem } from "@/features/map/types/map"

type RecommendationItemProps = {
  isSelected: boolean
  onSelect: () => void
  rank: number
  tradeArea: MarketAreaListItem
}

export function RecommendationItem({
  isSelected,
  onSelect,
  rank,
  tradeArea,
}: RecommendationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-card hover:border-primary/30 hover:bg-muted"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isSelected
              ? "bg-primary-foreground text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {rank}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-semibold ${
              isSelected ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {tradeArea.dongName}
          </span>
          <span
            className={`mt-1 block truncate text-[11px] ${
              isSelected
                ? "text-primary-foreground/60"
                : "text-muted-foreground"
            }`}
          >
            {tradeArea.score == null
              ? tradeArea.sigunguName
              : `추천 점수 ${tradeArea.score}`}
          </span>
        </span>
      </button>
    </li>
  )
}
