import { BarChart3 } from "lucide-react"
import type { IndustrySalesRank } from "@/features/map/types/map"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

type IndustrySalesRankingProps = {
  rankings: IndustrySalesRank[]
}

export function IndustrySalesRankingSection({
  rankings,
}: IndustrySalesRankingProps) {
  return (
    <section aria-labelledby="industry-sales-ranking-title">
      <h3
        id="industry-sales-ranking-title"
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <BarChart3 className="h-4 w-4 text-primary" />
        업종별 추정매출
      </h3>
      {rankings.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed px-3 py-4 text-xs text-muted-foreground">
          선택한 기간과 행정동에는 업종별 추정매출 데이터가 없습니다.
        </p>
      ) : null}
      {rankings.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>순위</TableHead>
                <TableHead>업종</TableHead>
                <TableHead>추정매출</TableHead>
                <TableHead>전분기 대비</TableHead>
                <TableHead>점포 수</TableHead>
                <TableHead>점포당 매출 추정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((row) => (
                <TableRow key={row.rank}>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {row.rank}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.industryName}
                  </TableCell>
                  <TableCell className="font-mono">
                    {row.estimatedSalesAmount.toLocaleString()}만원
                  </TableCell>
                  <TableCell
                    className={`font-mono font-medium ${
                      row.previousPeriodChangeRate >= 0
                        ? "text-foreground"
                        : "text-destructive"
                    }`}
                  >
                    {row.previousPeriodChangeRate >= 0 ? "+" : ""}
                    {row.previousPeriodChangeRate}%
                  </TableCell>
                  <TableCell className="font-mono">
                    {row.storeCount.toLocaleString()}개
                  </TableCell>
                  <TableCell className="font-mono">
                    {row.estimatedSalesPerStore.toLocaleString()}만원
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  )
}
