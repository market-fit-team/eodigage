import { Activity } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type {
  FootTrafficData,
  HourlyFootTraffic,
} from "@/features/map/types/map"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart"

type FootTrafficChartProps = {
  points: HourlyFootTraffic[]
}

type FootTrafficSummaryPanelProps = {
  footTraffic: FootTrafficData
}

const getOrderedPoints = (points: HourlyFootTraffic[]) =>
  [...points].sort((a, b) => Number(a.hour) - Number(b.hour))

const weekdayLabels: Record<string, string> = {
  FRI: "금요일",
  MON: "월요일",
  SAT: "토요일",
  SUN: "일요일",
  THU: "목요일",
  TUE: "화요일",
  WED: "수요일",
}

const FOOT_TRAFFIC_COLOR = "var(--chart-1)"

function FootTrafficSummaryPanel({
  footTraffic,
}: FootTrafficSummaryPanelProps) {
  const peakWeekday = footTraffic.peakWeekday
    ? (weekdayLabels[footTraffic.peakWeekday] ?? footTraffic.peakWeekday)
    : "-"
  const youngAdultRatio =
    footTraffic.youngAdultRatio === undefined
      ? "-"
      : `${footTraffic.youngAdultRatio.toFixed(1)}%`

  return (
    <aside className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
      <dl>
        <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
          <dt className="text-xs font-medium text-primary-foreground/60">
            총 유동인구
          </dt>
          <dd className="mt-1.5 text-2xl font-bold tracking-tight">
            {footTraffic.total.toLocaleString()}명
          </dd>
        </div>

        <div className="mt-3 divide-y divide-border border-y border-border">
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-xs text-muted-foreground">피크 시간대</dt>
            <dd className="text-sm font-semibold text-foreground">
              {footTraffic.peakTimeSlot ?? "-"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-xs text-muted-foreground">피크 요일</dt>
            <dd className="text-sm font-semibold text-foreground">
              {peakWeekday}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-xs text-muted-foreground">20·30대 비중</dt>
            <dd className="text-sm font-semibold text-foreground">
              {youngAdultRatio}
            </dd>
          </div>
        </div>
      </dl>
    </aside>
  )
}

function FootTrafficChart({ points }: FootTrafficChartProps) {
  const chartData = getOrderedPoints(points)

  return (
    <ChartContainer
      config={{ traffic: { label: "유동인구", color: FOOT_TRAFFIC_COLOR } }}
      className="h-72 w-full"
    >
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          interval={2}
          tickFormatter={(hour) => `${Number(hour)}시`}
        />
        <YAxis tickLine={false} axisLine={false} width={64} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(hour) => `${hour}:00`}
              formatter={(value) =>
                `유동인구: ${Number(value).toLocaleString()}명`
              }
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          name="유동인구"
          stroke="var(--color-traffic)"
          fill="var(--color-traffic)"
          fillOpacity={0.12}
          strokeWidth={2.5}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function FootTrafficChartCard({
  footTraffic,
}: {
  footTraffic: FootTrafficData | null
}) {
  return (
    <Card className="overflow-hidden border-border shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </span>
          <span>
            <span className="block">시간대별 유동인구</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              방문 피크 시간과 주요 유입 흐름을 확인합니다.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-stretch">
        {footTraffic ? (
          <>
            <div className="min-w-0">
              <FootTrafficChart points={footTraffic.points} />
              <p className="mt-3 text-[10px] text-muted-foreground">
                서울시 상권분석서비스 행정동별 생활인구 기준
              </p>
            </div>
            <FootTrafficSummaryPanel footTraffic={footTraffic} />
          </>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground lg:col-span-2">
            선택한 기간과 행정동에는 유동인구 데이터가 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
