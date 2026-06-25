import { useMutation } from "@tanstack/react-query"
import { scrapMarketTarget } from "@/features/map/lib/map-api"

export function useMarketScrap() {
  return useMutation({
    mutationFn: scrapMarketTarget,
  })
}
