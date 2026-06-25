import { ChartNoAxesCombined } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type DetailAnalysisSummaryProps = {
  summary: string
}

export function DetailAnalysisSummary({ summary }: DetailAnalysisSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <ChartNoAxesCombined className="h-4 w-4 text-primary" />
          상권 상세 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </CardContent>
    </Card>
  )
}
