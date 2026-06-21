"use client"

import { MapChatWidget } from "@/features/agent/components/map-chat-widget/map-chat-widget"
import { ExploreWidgetHeader } from "@/features/map/components/explore-widget/explore-widget-header"
import { RecommendationWidget } from "@/features/map/components/recommendation-widget/recommendation-widget"
import { useMapStore } from "@/features/map/store/map-store"
import type { DistrictData } from "@/features/startup/lib/data"
import { Card } from "@/shared/components/ui/card"

type ExploreWidgetProps = {
  selectedTradeArea: DistrictData | null
}

export function ExploreWidget({ selectedTradeArea }: ExploreWidgetProps) {
  const leftPanelMode = useMapStore((state) => state.leftPanelMode)

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <ExploreWidgetHeader />
      {leftPanelMode === "chat" ? (
        <MapChatWidget selectedTradeArea={selectedTradeArea} />
      ) : (
        <RecommendationWidget />
      )}
    </Card>
  )
}
