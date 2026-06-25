import { Suspense } from "react"
import { z } from "zod"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { ChatStoreProvider } from "@/features/agent/store/chat-store"
import { MapView } from "@/features/map/components/map-view"
import {
  getIndustryCode,
  getIndustryInitialState,
} from "@/features/map/lib/industry-filter-options"
import { prefetchMapPageQueries } from "@/features/map/lib/map-query-options"
import { MapStoreProvider } from "@/features/map/store/map-store"
import { queryConfig } from "@/shared/lib/react-query"

const MapSearchParamsSchema = z.object({
  cs1: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "all") : value),
    z.string().trim().default("all")
  ),
  cs2: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "all") : value),
    z.string().trim().default("all")
  ),
  franchise: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "") : value),
    z.string().trim().default("")
  ),
  industry: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "all") : value),
    z.string().trim().default("all")
  ),
  q: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "") : value),
    z.string().trim().default("")
  ),
})

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const rawSearchParams = (await searchParams) ?? {}
  const parsedSearchParams = MapSearchParamsSchema.safeParse(rawSearchParams)
  const initialFilters = parsedSearchParams.success
    ? (() => {
        const legacyIndustryState = getIndustryInitialState(
          parsedSearchParams.data.industry || "all"
        )
        const initialKeyword = [
          parsedSearchParams.data.q,
          parsedSearchParams.data.franchise,
        ]
          .filter(Boolean)
          .join(" ")

        return {
          appliedSearchKeyword: initialKeyword,
          searchKeyword: initialKeyword,
          selectedMajorCategory:
            parsedSearchParams.data.cs1 === "all"
              ? legacyIndustryState.selectedMajorCategory
              : parsedSearchParams.data.cs1,
          selectedMinorCategory:
            parsedSearchParams.data.cs2 === "all"
              ? legacyIndustryState.selectedMinorCategory
              : parsedSearchParams.data.cs2,
        }
      })()
    : {
        appliedSearchKeyword: "",
        searchKeyword: "",
        selectedMajorCategory: "all",
        selectedMinorCategory: "all",
      }
  const queryClient = new QueryClient({
    defaultOptions: queryConfig,
  })

  await prefetchMapPageQueries(queryClient, {
    industryCode: getIndustryCode(initialFilters),
    keyword: initialFilters.appliedSearchKeyword || undefined,
  })

  return (
    <MapStoreProvider initialState={initialFilters}>
      <ChatStoreProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                지도 분석 모듈 로드 중...
              </div>
            }
          >
            <MapView />
          </Suspense>
        </HydrationBoundary>
      </ChatStoreProvider>
    </MapStoreProvider>
  )
}
