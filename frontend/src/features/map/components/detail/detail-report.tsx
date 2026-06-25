"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DetailAnalysisSummary } from "@/features/map/components/detail/detail-analysis-summary"
import { DetailReportSections } from "@/features/map/components/detail/detail-report-sections"
import { FootTrafficChartCard } from "@/features/map/components/detail/foot-traffic-chart"
import { FranchiseStartupCostCard } from "@/features/map/components/detail/franchise-startup-cost-card"
import { useAdminAreas } from "@/features/map/hooks/use-admin-areas"
import { useMarketReport } from "@/features/map/hooks/use-market-report"
import { Skeleton } from "@/shared/components/ui/skeleton"

type DetailReportMode = "modal" | "page"

function DetailReportSkeleton() {
  return (
    <>
      <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-72 rounded-xl lg:col-span-2" />
    </>
  )
}

function DetailReportContent({ mode }: { mode: DetailReportMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dongCode =
    searchParams.get("dongCode") || searchParams.get("district") || ""
  const { data: adminAreas } = useAdminAreas()
  const { data: report, isError, isLoading } = useMarketReport(dongCode)
  const dong = adminAreas?.dongGeoJson.features.find(
    (feature) => feature.properties.code === dongCode
  )?.properties

  // 모달(인터셉트)에서는 뒤로가기로 지도 슬롯만 닫는다. 직접 진입·새로고침한
  // 풀페이지에서는 히스토리가 없거나 외부일 수 있어 /map으로 안전하게 보낸다.
  const handleBack = () => {
    if (mode === "modal") {
      router.back()
      return
    }
    router.push("/map")
  }

  return (
    <div className="min-h-full bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            지도 탐색으로
          </button>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {dong?.name ?? dongCode}
        </h1>

        <DetailAnalysisSummary
          summary={
            dongCode
              ? `${dong?.sigunguName ?? "-"} · 행정동 코드 ${dongCode}`
              : "지도에서 행정동을 선택하면 상권 상세 리포트를 확인할 수 있습니다."
          }
        />

        {/* 상세 카드 그리드 */}
        <div className="grid gap-4 lg:grid-cols-2">
          {!dongCode ? (
            <div className="rounded-xl border bg-card p-6 text-xs text-muted-foreground lg:col-span-2">
              선택된 행정동이 없습니다. 지도 탐색에서 행정동을 선택해주세요.
            </div>
          ) : isLoading ? (
            <DetailReportSkeleton />
          ) : isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-xs leading-relaxed text-destructive lg:col-span-2">
              상권 상세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해
              주세요.
            </div>
          ) : !report ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-xs leading-relaxed text-muted-foreground lg:col-span-2">
              선택한 행정동의 상권 상세 데이터가 없습니다.
            </div>
          ) : (
            <>
              <DetailReportSections data={report} />
              <FranchiseStartupCostCard franchises={[]} />
              <FootTrafficChartCard points={report.footTraffic} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function DetailReport({ mode = "page" }: { mode?: DetailReportMode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-muted/30 text-xs text-muted-foreground">
          상권 정보를 불러오는 중...
        </div>
      }
    >
      <DetailReportContent mode={mode} />
    </Suspense>
  )
}
