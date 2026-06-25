import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAdminAreas } from "@/features/map/hooks/use-admin-areas"
import { marketRecommendationsQueryOptions } from "@/features/map/lib/map-query-options"
import type { MarketAreaListItem } from "@/features/map/types/map"

export function useMarketRecommendations() {
  const { data: adminAreas } = useAdminAreas()
  const query = useQuery(marketRecommendationsQueryOptions())
  const adminAreaByDongCode = useMemo(
    () =>
      new Map(
        (adminAreas?.dongGeoJson.features ?? []).map((feature) => [
          feature.properties.code,
          feature.properties,
        ])
      ),
    [adminAreas]
  )

  const areas = useMemo<MarketAreaListItem[]>(
    () =>
      (query.data ?? []).map((area) => {
        const adminArea = adminAreaByDongCode.get(area.dongCode)

        return {
          centerLat: adminArea?.centerLat ?? 0,
          centerLng: adminArea?.centerLng ?? 0,
          dongCode: area.dongCode,
          dongName: adminArea?.name ?? area.dongCode,
          score: area.score,
          sigunguCode: adminArea?.sigunguCode ?? "",
          sigunguName: adminArea?.sigunguName ?? "-",
        }
      }),
    [adminAreaByDongCode, query.data]
  )

  return {
    areas,
    isError: query.isError,
    isLoading: query.isLoading,
  }
}
