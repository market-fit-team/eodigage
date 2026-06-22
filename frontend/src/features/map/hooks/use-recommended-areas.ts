import { skipToken, useQuery } from "@tanstack/react-query"
import { recommendationQueryKeys } from "@/features/map/lib/recommendation-query-keys"
import type { TradeAreaId } from "@/features/map/types/map"

// 지도는 추천 출처를 구분하지 않고 현재 추천 목록 하나만 구독한다.
export function useRecommendedAreas() {
  const { data: recommendedTradeAreaIds = [] } = useQuery<TradeAreaId[]>({
    queryKey: recommendationQueryKeys.list,
    queryFn: skipToken,
  })

  return recommendedTradeAreaIds
}
