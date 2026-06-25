import { useQuery } from "@tanstack/react-query"
import { marketPreviewQueryOptions } from "@/features/map/lib/map-query-options"
import type { DongCode } from "@/features/map/types/map"

export function useMarketPreview(dongCode: DongCode | null) {
  return useQuery({
    ...marketPreviewQueryOptions(dongCode ?? ""),
    enabled: dongCode !== null,
  })
}
