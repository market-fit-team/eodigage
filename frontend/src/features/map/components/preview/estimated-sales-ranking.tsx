import type { MarketPreviewIndustryRanking } from "@/features/map/types/map"

type PreviewEstimatedSalesRankingProps = {
  rankings: MarketPreviewIndustryRanking[]
}

export function PreviewEstimatedSalesRanking({
  rankings,
}: PreviewEstimatedSalesRankingProps) {
  if (rankings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs leading-relaxed text-muted-foreground">
        업종별 추정매출 데이터가 없습니다.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        선택한 상권에서 추정매출이 높은 업종입니다.
      </p>
      <ol className="flex flex-col gap-2">
        {rankings.slice(0, 3).map((ranking) => (
          <li
            key={ranking.industryCode}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {ranking.rank}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {ranking.industryName}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                점포 {ranking.storeCount.toLocaleString()}개 · 점포당{" "}
                {Math.round(
                  ranking.estimatedSalesPerStore / 10_000
                ).toLocaleString()}
                만원
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
