import { Users } from "lucide-react"
import type { ResidentPopulation } from "@/features/map/types/map"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type ResidentPopulationCardProps = {
  population: ResidentPopulation
}

const getAgeLabel = (ageGroup: string) =>
  ageGroup.endsWith("대") || ageGroup.endsWith("대+")
    ? ageGroup
    : ageGroup === "60+"
      ? "60대+"
      : `${ageGroup}대`

export function ResidentPopulationCard({
  population,
}: ResidentPopulationCardProps) {
  const chartData = population.byAge.map((item) => ({
    ...item,
    total: item.male + item.female,
  }))
  const malePopulation = chartData.reduce((total, item) => total + item.male, 0)
  const femalePopulation = chartData.reduce(
    (total, item) => total + item.female,
    0
  )
  const dominantAgeGroup = chartData.reduce(
    (dominant, item) => (item.total > dominant.total ? item : dominant),
    { ageGroup: "-", male: 0, female: 0, total: 0 }
  )
  const populationTotal = Math.max(population.total, 1)
  const maleRatio = Math.round((malePopulation / populationTotal) * 100)
  const femaleRatio = Math.round((femalePopulation / populationTotal) * 100)
  const maxAgeTotal = Math.max(...chartData.map((item) => item.total), 1)

  return (
    <Card className="overflow-hidden border-border shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-4 w-4" />
          </span>
          <span>
            <span className="block">연령대별 성별 상주인구</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              거주 인구 구성과 주요 연령대를 비교합니다.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="grid overflow-hidden rounded-xl border border-border bg-muted sm:grid-cols-[1.15fr_1fr_1fr] sm:divide-x sm:divide-border">
            <div className="p-5 sm:pr-6">
              <span className="block text-xs font-medium text-muted-foreground">
                총 상주인구
              </span>
              <span className="mt-1.5 block text-3xl font-bold tracking-tight text-foreground">
                {population.total.toLocaleString()}명
              </span>
            </div>
            <div className="border-t border-border p-5 sm:border-t-0 sm:px-6">
              <span className="block text-xs font-medium text-muted-foreground">
                최다 연령대
              </span>
              <span className="mt-1.5 block text-2xl font-bold tracking-tight text-foreground">
                {getAgeLabel(dominantAgeGroup.ageGroup)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {dominantAgeGroup.total.toLocaleString()}명
              </span>
            </div>
            <div className="border-t border-border p-5 sm:border-t-0 sm:pl-6">
              <span className="block text-xs font-medium text-muted-foreground">
                성별 비율
              </span>
              <span className="mt-1.5 block text-2xl font-bold tracking-tight text-foreground">
                남 {maleRatio}% · 여 {femaleRatio}%
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-foreground">
                연령대별 인구 규모
              </p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />남
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-chart-2" />여
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {chartData.map((item) => {
                const totalRatio = (item.total / maxAgeTotal) * 100
                const maleWidth =
                  item.total === 0 ? 0 : (item.male / item.total) * 100
                const femaleWidth = 100 - maleWidth

                return (
                  <div
                    key={item.ageGroup}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3"
                  >
                    <span className="text-right text-xs text-muted-foreground">
                      {getAgeLabel(item.ageGroup)}
                    </span>
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                        <span className="font-medium text-foreground">
                          {item.total.toLocaleString()}명
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          남 {item.male.toLocaleString()} · 여{" "}
                          {item.female.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-6 overflow-hidden rounded-md bg-muted">
                        <div
                          className="flex h-full overflow-hidden rounded-md"
                          style={{ width: `${Math.max(totalRatio, 4)}%` }}
                        >
                          <div
                            className="h-full bg-chart-1"
                            style={{ width: `${maleWidth}%` }}
                          />
                          <div
                            className="h-full bg-chart-2"
                            style={{ width: `${femaleWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
