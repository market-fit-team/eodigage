"use client"

import { ChevronRight, Sparkles } from "lucide-react"
import { Canvas } from "@/features/map/components/canvas/canvas"
import { Explore } from "@/features/map/components/explore/explore"
import { Filter } from "@/features/map/components/filter/filter"
import { MarketPreview } from "@/features/map/components/preview/market-preview"
import { useMapStore } from "@/features/map/store/map-store"
import { Button } from "@/shared/components/ui/button"

// MapView는 지도 페이지 프레임을 소유한다.
// 상단 필터 바, 왼쪽 추천/채팅 패널, 중앙 지도, 오른쪽 상세 패널 배치를 여기서 결정한다.
export function MapView() {
  const isLeftPanelOpen = useMapStore((state) => state.isLeftPanelOpen)
  const openLeftPanel = useMapStore((state) => state.openLeftPanel)
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-muted">
      {/* 지도는 모든 패널 아래에 고정되는 배경 레이어다. */}
      <div className="absolute inset-0 z-0">
        <Canvas />
      </div>

      {/* 상단 영역: 추천·AI 패널 열기 버튼(핵심 기능)과 검색/필터 바를 가로로 분리해 배치한다. */}
      <div
        className={`absolute top-4 z-30 flex items-stretch gap-2 transition-[right,left] duration-200 ${
          isLeftPanelOpen ? "left-[22rem]" : "left-5"
        } ${selectedDongCode ? "right-[22rem]" : "right-5"}`}
      >
        {/* 패널이 닫혔을 때만 노출. 지도 위에서 왼쪽 패널을 다시 여는 보조 컨트롤이다. */}
        {!isLeftPanelOpen ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={openLeftPanel}
            className="h-auto shrink-0 gap-1.5 rounded-xl border-primary bg-primary px-4 font-semibold text-primary-foreground shadow-lg backdrop-blur hover:bg-primary/90 hover:text-primary-foreground"
            aria-label="추천·AI 패널 열기"
          >
            <Sparkles className="h-4 w-4 text-primary-foreground/80" />
            추천·AI 상담
            <ChevronRight className="h-6 w-6 text-primary-foreground/55" />
          </Button>
        ) : null}

        <div className="min-w-0 flex-1">
          <Filter />
        </div>
      </div>

      {/* 왼쪽 패널: 공통 토글 헤더로 추천 목록과 AI 채팅을 한 자리에서 전환한다. */}
      {/* 패널이 닫혔을 때 다시 여는 토글은 검색 드롭다운에 가려지지 않도록 필터 바 좌측에 둔다. */}
      {isLeftPanelOpen ? (
        <div className="absolute top-4 bottom-4 left-5 z-20 w-80">
          <Explore />
        </div>
      ) : null}

      {/* 오른쪽 패널은 선택된 동의 상권 미리보기를 보여준다. */}
      {selectedDongCode && (
        <div className="absolute top-4 right-5 bottom-5 z-20 w-80">
          <MarketPreview />
        </div>
      )}
    </div>
  )
}
