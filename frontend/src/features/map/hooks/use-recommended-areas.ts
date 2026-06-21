import { useMemo } from "react"
import {
  getRecommendedTradeAreaIds,
  resolveRecommendedTradeAreaIds,
} from "@/features/map/lib/map-selectors"
import { useMapStore } from "@/features/map/store/map-store"

// 표시할 추천 동 id는 store 원천 상태(activePersona, chatTradeAreaIds, leftPanelMode)에서 파생
export function useRecommendedAreas() {
  const activePersona = useMapStore((state) => state.activePersona)
  const chatTradeAreaIds = useMapStore((state) => state.chatTradeAreaIds)
  const leftPanelMode = useMapStore((state) => state.leftPanelMode)

  const onboardingTradeAreaIds = useMemo(
    () => getRecommendedTradeAreaIds(activePersona),
    [activePersona]
  )

  return useMemo(
    () =>
      resolveRecommendedTradeAreaIds({
        chatTradeAreaIds,
        isChatPanelActive: leftPanelMode === "chat",
        onboardingTradeAreaIds,
        surveyTradeAreaIds: null,
      }),
    [chatTradeAreaIds, leftPanelMode, onboardingTradeAreaIds]
  )
}
