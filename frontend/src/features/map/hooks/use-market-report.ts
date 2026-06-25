import { useQuery } from "@tanstack/react-query"
import { marketReportQueryOptions } from "@/features/map/lib/map-query-options"
import type { DongCode } from "@/features/map/types/map"

export function useMarketReport(dongCode: DongCode) {
  return useQuery({
    ...marketReportQueryOptions(dongCode),
    enabled: dongCode.length > 0,
  })
}
