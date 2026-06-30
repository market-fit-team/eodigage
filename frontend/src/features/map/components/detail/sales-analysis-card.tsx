import { TrendingUp } from "lucide-react"
import { IndustrySalesRankingSection } from "@/features/map/components/detail/industry-sales-ranking"
import { WeekdayWeekendSalesSection } from "@/features/map/components/detail/weekday-weekend-sales"
import type {
  IndustrySalesRank,
  WeekdayWeekendSalesSummary,
} from "@/features/map/types/map"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type SalesAnalysisCardProps = {
  rankings: IndustrySalesRank[]
  weekdayWeekendSales: WeekdayWeekendSalesSummary | null
}

export function SalesAnalysisCard({
  rankings,
  weekdayWeekendSales,
}: SalesAnalysisCardProps) {
  return (
    <Card className="overflow-hidden border-border shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <TrendingUp className="h-4 w-4" />
          </span>
          <span>
            <span className="block">매출 분석</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              업종별 매출 순위와 요일별 매출 비중을 확인합니다.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <IndustrySalesRankingSection rankings={rankings} />
        <div className="border-t" />
        <WeekdayWeekendSalesSection sales={weekdayWeekendSales} />
      </CardContent>
    </Card>
  )
}
