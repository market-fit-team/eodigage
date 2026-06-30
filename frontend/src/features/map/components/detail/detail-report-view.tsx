import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  MapPin,
  Store,
  Users,
} from "lucide-react"
import { DetailReportSections } from "@/features/map/components/detail/detail-report-sections"
import { DetailReportSkeleton } from "@/features/map/components/detail/detail-report-skeleton"
import { DetailReportStateCard } from "@/features/map/components/detail/detail-report-state-card"
import { FootTrafficChartCard } from "@/features/map/components/detail/foot-traffic-chart"
import { FranchiseStartupCostCard } from "@/features/map/components/detail/franchise-startup-cost-card"
import type { DetailReportData } from "@/features/map/types/map"

type DetailReportViewProps = {
  dongCode: string
  dongName: string
  isError: boolean
  isLoading: boolean
  onBack: () => void
  report?: DetailReportData
  sigunguName: string
}

export function DetailReportView({
  dongCode,
  dongName,
  isError,
  isLoading,
  onBack,
  report,
  sigunguName,
}: DetailReportViewProps) {
  const topIndustry = report?.industrySalesRanking[0]
  const totalStores = report?.competition?.storeCount
  const totalPopulation = report?.residentPopulation?.total
  const strongerSalesDay =
    report?.weekdayWeekendSales == null
      ? null
      : report.weekdayWeekendSales.weekday >= report.weekdayWeekendSales.weekend
        ? "주중"
        : "주말"
  const kpis = [
    {
      icon: BarChart3,
      label: "매출 1위 업종",
      value: topIndustry?.industryName ?? "-",
    },
    {
      icon: Store,
      label: "전체 점포 수",
      value: totalStores == null ? "-" : `${totalStores.toLocaleString()}개`,
    },
    {
      icon: Users,
      label: "상주인구",
      value:
        totalPopulation == null ? "-" : `${totalPopulation.toLocaleString()}명`,
    },
    {
      icon: CalendarRange,
      label: "매출 강세",
      value: strongerSalesDay ?? "-",
    },
  ]

  return (
    <div className="min-h-full bg-background pb-10">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3.5 py-2 text-xs font-medium text-primary-foreground/75 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            지도 탐색으로
          </button>

          <div className="mt-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs font-semibold text-primary-foreground/70">
              <MapPin className="h-3.5 w-3.5" />
              {sigunguName || "서울"}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {dongName}
            </h1>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 p-4"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/60">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground">
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </div>
                <p className="mt-2.5 truncate text-lg font-bold text-primary-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </section>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {!dongCode ? (
            <DetailReportStateCard state="no-selection" />
          ) : isLoading ? (
            <DetailReportSkeleton />
          ) : isError ? (
            <DetailReportStateCard state="error" />
          ) : !report ? (
            <DetailReportStateCard state="empty" />
          ) : (
            <>
              <DetailReportSections data={report} />
              <FranchiseStartupCostCard
                franchises={report.franchiseRecommendations}
              />
              <FootTrafficChartCard footTraffic={report.footTraffic} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
