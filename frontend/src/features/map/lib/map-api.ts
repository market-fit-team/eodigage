import {
  type IndustryMajorOption,
  industryFilterOptions,
} from "@/features/map/lib/industry-filter-options"
import {
  toAdminAreaMapData,
  toDetailReportData,
  toMarketAreaSearchResult,
  toMarketIndustryOptions,
  toMarketPreviewData,
} from "@/features/map/lib/map-api-mappers"
import type { DongCode, MarketRecommendedArea } from "@/features/map/types/map"
import { getAdminAreas as requestAdminAreas } from "@/shared/api/generated/market/endpoints/admin-areas/admin-areas"
import { getMarketIndustries as requestMarketIndustries } from "@/shared/api/generated/market/endpoints/market-industry/market-industry"
import {
  getMarketReportPreviewByDong as requestMarketPreview,
  getMarketReportByDong as requestMarketReport,
} from "@/shared/api/generated/market/endpoints/market-reports/market-reports"
import { searchAreas as requestSearchAreas } from "@/shared/api/generated/market/endpoints/market-search/market-search"

export const getAdminAreas = async () =>
  toAdminAreaMapData((await requestAdminAreas()).data)

export const getMarketPreview = async (dongCode: DongCode) =>
  toMarketPreviewData((await requestMarketPreview(dongCode)).data)

export const getMarketReport = async (dongCode: DongCode) =>
  toDetailReportData((await requestMarketReport(dongCode)).data ?? {})

export const searchMarketAreas = async (params: {
  industryCode?: string
  keyword?: string
}) =>
  toMarketAreaSearchResult(
    (
      await requestSearchAreas({
        industryCode: params.industryCode,
        keyword: params.keyword,
      })
    ).data
  )

export const getMarketIndustries = async (): Promise<IndustryMajorOption[]> => {
  const options = toMarketIndustryOptions(
    (await requestMarketIndustries()).data
  )

  // 업종 응답이 비면 검색/필터 UI가 동작하도록 임시 옵션으로 폴백한다.
  return options.length > 0 ? options : industryFilterOptions
}

// TODO: market OpenAPI에 추천 목록 endpoint가 추가되면 Orval 생성 함수로 교체한다.
export const getMarketRecommendedAreas = async (): Promise<
  MarketRecommendedArea[]
> => []
