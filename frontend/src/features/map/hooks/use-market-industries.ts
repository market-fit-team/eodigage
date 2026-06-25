import { useQuery } from "@tanstack/react-query"
import { marketIndustriesQueryOptions } from "@/features/map/lib/map-query-options"

export function useMarketIndustries() {
  return useQuery(marketIndustriesQueryOptions())
}
