"use client"

import { MapAgentChatPanel } from "@/features/agent/components/map-chat-widget/map-agent-chat-panel"
import type { DistrictData } from "@/features/startup/lib/data"

type MapChatWidgetProps = {
  selectedTradeArea: DistrictData | null
}

export function MapChatWidget({ selectedTradeArea }: MapChatWidgetProps) {
  void selectedTradeArea

  return <MapAgentChatPanel />
}
