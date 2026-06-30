import { Store } from "lucide-react"
import { CommercialChangeIndicatorSection } from "@/features/map/components/detail/commercial-change-indicator"
import { CompetitionAnalysisSection } from "@/features/map/components/detail/competition-analysis"
import type {
  CommercialChangeIndicator,
  CompetitionStats,
} from "@/features/map/types/map"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type MarketEnvironmentCardProps = {
  competition: CompetitionStats | null
  indicator: CommercialChangeIndicator | null
}

export function MarketEnvironmentCard({
  competition,
  indicator,
}: MarketEnvironmentCardProps) {
  return (
    <Card className="overflow-hidden border-border shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Store className="h-4 w-4" />
          </span>
          <span>
            <span className="block">시장 환경</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              경쟁 강도와 상권 변화 신호를 함께 봅니다.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {competition ? (
          <CompetitionAnalysisSection competition={competition} />
        ) : null}
        {competition && indicator ? <div className="border-t" /> : null}
        {indicator ? (
          <CommercialChangeIndicatorSection indicator={indicator} />
        ) : null}
      </CardContent>
    </Card>
  )
}
