import { Suspense } from "react"
import { ChatStoreProvider } from "@/features/agent/store/chat-store"
import { MapView } from "@/features/map/components/map-view"
import { MapStoreProvider } from "@/features/map/store/map-store"

export default function MapPage() {
  return (
    <MapStoreProvider>
      <ChatStoreProvider>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center bg-muted/30 text-xs text-muted-foreground">
              지도 분석 모듈 로드 중...
            </div>
          }
        >
          <MapView />
        </Suspense>
      </ChatStoreProvider>
    </MapStoreProvider>
  )
}
