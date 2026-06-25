import { type QueryClient, queryOptions } from "@tanstack/react-query"
import {
  getAdminAreas,
  getMarketIndustries,
  getMarketPreview,
  getMarketRecommendedAreas,
  getMarketReport,
  searchMarketAreas,
} from "@/features/map/lib/map-api"
import type { DongCode } from "@/features/map/types/map"

export const mapQueryKeys = {
  adminAreas: ["map", "admin-areas"] as const,
  areaSearch: (params: { industryCode?: string; keyword?: string }) =>
    ["map", "area-search", params] as const,
  industries: ["map", "industries"] as const,
  preview: (dongCode: DongCode | null) => ["map", "preview", dongCode] as const,
  recommendations: ["map", "recommendations"] as const,
  report: (dongCode: DongCode) => ["map", "report", dongCode] as const,
}

export const adminAreasQueryOptions = () =>
  queryOptions({
    queryFn: getAdminAreas,
    queryKey: mapQueryKeys.adminAreas,
    staleTime: 1000 * 60 * 60,
  })

export const marketAreaSearchQueryOptions = (params: {
  industryCode?: string
  keyword?: string
}) =>
  queryOptions({
    queryFn: () => searchMarketAreas(params),
    queryKey: mapQueryKeys.areaSearch(params),
  })

export const marketIndustriesQueryOptions = () =>
  queryOptions({
    queryFn: getMarketIndustries,
    queryKey: mapQueryKeys.industries,
    staleTime: 1000 * 60 * 60,
  })

export const marketRecommendationsQueryOptions = () =>
  queryOptions({
    queryFn: getMarketRecommendedAreas,
    queryKey: mapQueryKeys.recommendations,
  })

export const marketPreviewQueryOptions = (dongCode: DongCode) =>
  queryOptions({
    queryFn: () => getMarketPreview(dongCode),
    queryKey: mapQueryKeys.preview(dongCode),
  })

export const marketReportQueryOptions = (dongCode: DongCode) =>
  queryOptions({
    queryFn: () => getMarketReport(dongCode),
    queryKey: mapQueryKeys.report(dongCode),
  })

export const prefetchMapPageQueries = (
  queryClient: QueryClient,
  areaSearchParams: {
    industryCode?: string
    keyword?: string
  } = {}
) => {
  const hasSearchParams = Boolean(
    areaSearchParams.keyword || areaSearchParams.industryCode
  )
  const queries = [
    queryClient.prefetchQuery(adminAreasQueryOptions()),
    queryClient.prefetchQuery(marketIndustriesQueryOptions()),
    queryClient.prefetchQuery(marketRecommendationsQueryOptions()),
  ]

  if (hasSearchParams) {
    queries.push(
      queryClient.prefetchQuery(marketAreaSearchQueryOptions(areaSearchParams))
    )
  }

  return Promise.allSettled(queries)
}
