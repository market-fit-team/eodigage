import type { MarketFranchiseRecommendation } from "@/features/map/types/map"

type PreviewFranchiseRecommendationsProps = {
  franchises: MarketFranchiseRecommendation[]
}

export function PreviewFranchiseRecommendations({
  franchises,
}: PreviewFranchiseRecommendationsProps) {
  if (franchises.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs leading-relaxed text-muted-foreground">
        이 상권에서 추천할 프랜차이즈 데이터가 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {franchises.map((franchise, index) => (
        <div
          key={`${franchise.brandCode}-${index}`}
          className="rounded-xl border border-border bg-card px-3 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {franchise.brandName}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {franchise.companyName ?? "프랜차이즈"}
              {franchise.startupCostTotal == null
                ? ""
                : ` · 예상 창업 비용 ${franchise.startupCostTotal.toLocaleString()}만원`}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
