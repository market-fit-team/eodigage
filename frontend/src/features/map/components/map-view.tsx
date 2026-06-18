"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Filter, MessageSquare } from "lucide-react"
import { MapChatWidget } from "@/features/agent/components/map-chat-widget/map-chat-widget"
import { CanvasWidget } from "@/features/map/components/canvas-widget/canvas-widget"
import { FilterWidget } from "@/features/map/components/filter-widget/filter-widget"
import { ResultWidget } from "@/features/map/components/result-widget/result-widget"
import {
  getInitialTradeAreaId,
  getPersistedPersona,
} from "@/features/map/lib/get-initial-trade-area"
import { getSelectedTradeArea } from "@/features/map/lib/map-selectors"
import { useMapStore } from "@/features/map/store/map-store"
import { Button } from "@/shared/components/ui/button"

// MapView owns the map page frame: left filter panel, center canvas,
// bottom result dock, and right agent panel.
export function MapView() {
  const searchParams = useSearchParams()
  const personaQuery = searchParams.get("persona")
  const isChatOpen = useMapStore((state) => state.isChatOpen)
  const isFilterOpen = useMapStore((state) => state.isFilterOpen)
  const closeChat = useMapStore((state) => state.closeChat)
  const openChat = useMapStore((state) => state.openChat)
  const openFilter = useMapStore((state) => state.openFilter)
  const selectedTradeAreaId = useMapStore((state) => state.selectedTradeAreaId)
  const setActivePersona = useMapStore((state) => state.setActivePersona)
  const setRecommendationsOnly = useMapStore(
    (state) => state.setRecommendationsOnly
  )
  const setSelectedTradeAreaId = useMapStore(
    (state) => state.setSelectedTradeAreaId
  )
  const selectedTradeArea = getSelectedTradeArea(selectedTradeAreaId)

  useEffect(() => {
    // The route query overrides persisted onboarding persona for shared links.
    const nextPersona = personaQuery || getPersistedPersona()

    if (nextPersona) {
      setActivePersona(nextPersona)
      setRecommendationsOnly(true)
      setSelectedTradeAreaId(getInitialTradeAreaId(nextPersona))
      return
    }

    setActivePersona(null)
    setRecommendationsOnly(false)
    setSelectedTradeAreaId(getInitialTradeAreaId(null))
  }, [
    personaQuery,
    setActivePersona,
    setRecommendationsOnly,
    setSelectedTradeAreaId,
  ])

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-muted/40">
      {/* Left sidebar: layout shell only. FilterWidget owns the filter form. */}
      <div
        className={`absolute top-4 bottom-4 left-4 z-20 w-80 transition-transform duration-300 ${
          isFilterOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]"
        }`}
      >
        <FilterWidget />
      </div>

      {!isFilterOpen && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={openFilter}
          className="absolute top-4 left-4 z-20 gap-1.5"
        >
          <Filter className="h-4 w-4 text-primary" />
          <span>필터 열기</span>
        </Button>
      )}

      {/* Center stage: the SVG map and legend live in the canvas widget. */}
      <CanvasWidget />

      {/* Result dock follows the left sidebar state so it does not sit under it. */}
      <div
        className={`absolute right-0 bottom-4 z-10 px-4 md:px-8 ${
          isFilterOpen ? "left-80" : "left-0"
        }`}
      >
        <ResultWidget />
      </div>

      {/* Right sidebar: layout shell only. MapChatWidget owns chat behavior. */}
      <div
        className={`absolute top-4 right-4 bottom-4 z-20 w-80 transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-[calc(100%+16px)]"
        }`}
      >
        <MapChatWidget
          selectedTradeArea={selectedTradeArea}
          onClose={closeChat}
        />
      </div>

      {!isChatOpen && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={openChat}
          className="absolute top-4 right-4 z-20 gap-1.5"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>AI 상담 비서</span>
        </Button>
      )}
    </div>
  )
}
