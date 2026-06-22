import { useMemo } from "react"
import { skipToken, useQuery } from "@tanstack/react-query"
import { resolveRecommendedTradeAreaIds } from "@/features/map/lib/map-selectors"
import { recommendationQueryKeys } from "@/features/map/lib/recommendation-query-keys"
import { useMapStore } from "@/features/map/store/map-store"
import type { TradeAreaId } from "@/features/map/types/map"

// 기본 추천은 조회 결과에서 받고, AI 추천과 패널 모드는 공유 UI 상태에서 조합한다.
export function useRecommendedAreas() {
  const leftPanelMode = useMapStore((state) => state.leftPanelMode)
  const { data: onboardingTradeAreaIds = null } = useQuery<TradeAreaId[]>({
    queryKey: recommendationQueryKeys.onboarding,
    queryFn: skipToken,
  })
  const { data: surveyTradeAreaIds = null } = useQuery<TradeAreaId[]>({
    queryKey: recommendationQueryKeys.survey,
    queryFn: skipToken,
  })
  const { data: chatRecommendedTradeAreaIds = null } = useQuery<TradeAreaId[]>({
    queryKey: recommendationQueryKeys.chat,
    queryFn: skipToken,
  })

  return useMemo(
    () =>
      resolveRecommendedTradeAreaIds({
        chatRecommendedTradeAreaIds,
        onboardingTradeAreaIds,
        shouldUseChatRecommendations: leftPanelMode === "chat",
        surveyTradeAreaIds,
      }),
    [
      chatRecommendedTradeAreaIds,
      leftPanelMode,
      onboardingTradeAreaIds,
      surveyTradeAreaIds,
    ]
  )
}
