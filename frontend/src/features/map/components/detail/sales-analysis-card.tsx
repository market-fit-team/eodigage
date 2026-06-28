import { IndustrySalesRankingSection } from "@/features/map/components/detail/industry-sales-ranking"
import { WeekdayWeekendSalesSection } from "@/features/map/components/detail/weekday-weekend-sales"
import type {
  IndustrySalesRank,
  WeekdayWeekendSalesSummary,
} from "@/features/map/types/map"
import { Card, CardContent } from "@/shared/components/ui/card"

type SalesAnalysisCardProps = {
  rankings: IndustrySalesRank[]
  weekdayWeekendSales: WeekdayWeekendSalesSummary | null
}

export function SalesAnalysisCard({
  rankings,
  weekdayWeekendSales,
}: SalesAnalysisCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="space-y-8">
        <IndustrySalesRankingSection rankings={rankings} />
        <div className="border-t" />
        <WeekdayWeekendSalesSection sales={weekdayWeekendSales} />
      </CardContent>
    </Card>
  )
}
