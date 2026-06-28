import { MarketEnvironmentCard } from "@/features/map/components/detail/market-environment-card"
import { ResidentPopulationCard } from "@/features/map/components/detail/resident-population-card"
import { SalesAnalysisCard } from "@/features/map/components/detail/sales-analysis-card"
import type { DetailReportData } from "@/features/map/types/map"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert"
import { Card, CardContent } from "@/shared/components/ui/card"

type DetailReportSectionsProps = {
  data: DetailReportData
}

function MissingDetailSection({ title }: { title: string }) {
  return (
    <Card className="lg:col-span-2">
      <CardContent>
        <Alert>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>
            선택한 기간과 행정동에는 이 섹션의 수집 데이터가 없습니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export function DetailReportSections({ data }: DetailReportSectionsProps) {
  return (
    <>
      {data.residentPopulation ? (
        <ResidentPopulationCard population={data.residentPopulation} />
      ) : (
        <MissingDetailSection title="연령대별 성별 상주인구" />
      )}

      {data.competition || data.commercialChangeIndicator ? (
        <MarketEnvironmentCard
          competition={data.competition}
          indicator={data.commercialChangeIndicator}
        />
      ) : (
        <MissingDetailSection title="시장 환경" />
      )}

      <SalesAnalysisCard
        rankings={data.industrySalesRanking}
        weekdayWeekendSales={data.weekdayWeekendSales}
      />
    </>
  )
}
