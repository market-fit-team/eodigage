"use client"

import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { PreviewSummary } from "@/features/map/components/preview/preview-summary"
import { PreviewTabs } from "@/features/map/components/preview/preview-tabs"
import { useAdminAreas } from "@/features/map/hooks/use-admin-areas"
import { useMarketPreview } from "@/features/map/hooks/use-market-preview"
import { useMapStore } from "@/features/map/store/map-store"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

function TradeAreaPreviewSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function TradeAreaPreview() {
  const router = useRouter()
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)
  const selectDong = useMapStore((state) => state.selectDong)
  const { data: adminAreas } = useAdminAreas()
  const { data: preview, isError, isLoading } =
    useMarketPreview(selectedDongCode)
  const selectedDong = adminAreas?.dongGeoJson.features.find(
    (feature) => feature.properties.code === selectedDongCode
  )?.properties

  if (!selectedDongCode) {
    return null
  }

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <PreviewSummary
            dongCode={selectedDongCode}
            dongName={selectedDong?.name ?? selectedDongCode}
            onClose={() => selectDong(null)}
            sigunguName={selectedDong?.sigunguName ?? "-"}
          />
          <div className="mt-5">
            {isLoading ? (
              <TradeAreaPreviewSkeleton />
            ) : isError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-4 text-xs leading-relaxed text-destructive">
                상권 미리보기를 불러오지 못했습니다. 잠시 후 다시 시도해
                주세요.
              </p>
            ) : !preview ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs leading-relaxed text-muted-foreground">
                선택한 행정동의 상권 미리보기 데이터가 없습니다.
              </p>
            ) : (
              <PreviewTabs preview={preview} />
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <Button
            type="button"
            size="lg"
            onClick={() =>
              router.push(`/map/detail?dongCode=${selectedDongCode}`)
            }
            className="w-full gap-1.5"
          >
            <FileText className="h-4 w-4" />
            상권 상세 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
