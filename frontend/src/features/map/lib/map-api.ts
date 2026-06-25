import type { Geometry } from "geojson"
import {
  type IndustryMajorOption,
  industryFilterOptions,
} from "@/features/map/lib/industry-filter-options"
import {
  getGetAdminAreasUrl,
} from "@/shared/api/generated/market/endpoints/admin-areas/admin-areas"
import {
  getGetMarketReportByDongUrl,
  getGetMarketReportPreviewByDongUrl,
} from "@/shared/api/generated/market/endpoints/market-reports/market-reports"
import { getSearchAreasUrl } from "@/shared/api/generated/market/endpoints/market-search/market-search"
import type {
  ApiResponseAdminAreaHierarchyResponse,
  ApiResponseAreaSearchResponse,
  ApiResponseMarketReportPreviewResponse,
  ApiResponseMarketReportResponse,
} from "@/shared/api/generated/market/schemas"
import type {
  AdminAreaFeature,
  AdminAreaMapData,
  DetailReportData,
  DongCode,
  MarketPreviewData,
  MarketPreviewIndustryRanking,
  MarketRecommendedArea,
  MarketScrapTarget,
  MarketSearchArea,
} from "@/features/map/types/map"

type GeneratedAdminAreas = NonNullable<
  ApiResponseAdminAreaHierarchyResponse["data"]
>

type GeneratedMarketPreview = NonNullable<
  ApiResponseMarketReportPreviewResponse["data"]
>

type GeneratedMarketReport = NonNullable<
  ApiResponseMarketReportResponse["data"]
>

type GeneratedSearchAreas = NonNullable<
  ApiResponseAreaSearchResponse["data"]
>

type GeneratedAreaProperties = NonNullable<
  NonNullable<GeneratedAdminAreas["sigungu"]>[number]["properties"]
>

const toStringValue = (value: string | undefined, fallback = "") =>
  value ?? fallback

const toNumberValue = (value: number | undefined, fallback = 0) =>
  value ?? fallback

const fetchPublicMarketApi = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Market API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

const isGeometry = (geometry: unknown): geometry is Geometry =>
  typeof geometry === "object" &&
  geometry !== null &&
  "type" in geometry &&
  "coordinates" in geometry

const toLngLatCoordinate = (coordinate: number[]) => {
  const [first, second, ...rest] = coordinate

  if (first === undefined || second === undefined) {
    return coordinate
  }

  const looksLikeLatLng =
    Math.abs(first) <= 90 &&
    Math.abs(second) > 90 &&
    Math.abs(second) <= 180

  return looksLikeLatLng ? [second, first, ...rest] : coordinate
}

const normalizeLngLatCoordinates = (coordinates: unknown): unknown => {
  if (!Array.isArray(coordinates)) {
    return coordinates
  }

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return toLngLatCoordinate(coordinates)
  }

  return coordinates.map(normalizeLngLatCoordinates)
}

const normalizeGeometryLngLat = (geometry: Geometry): Geometry => {
  if (geometry.type === "GeometryCollection") {
    return {
      ...geometry,
      geometries: geometry.geometries.map(normalizeGeometryLngLat),
    }
  }

  return {
    ...geometry,
    coordinates: normalizeLngLatCoordinates(geometry.coordinates),
  } as Geometry
}

const hasPointCoordinate = (lat: number | undefined, lng: number | undefined) =>
  lat !== undefined && lng !== undefined

const toAdminAreaProperties = (
  properties: GeneratedAreaProperties | undefined,
  areaType: "dong" | "sigungu"
) => ({
  areaType,
  baseDate: toStringValue(properties?.baseDate),
  centerLat: toNumberValue(properties?.centerLat),
  centerLng: toNumberValue(properties?.centerLng),
  code: toStringValue(properties?.code),
  name: toStringValue(properties?.name),
  sigunguCode: toStringValue(properties?.sigunguCode),
  sigunguName: toStringValue(properties?.sigunguName),
})

const toGeoJsonFeature = (
  area: {
    geometry?: unknown
    properties?: GeneratedAreaProperties
  },
  areaType: "dong" | "sigungu"
): AdminAreaFeature | null => {
  if (!isGeometry(area.geometry)) {
    return null
  }

  return {
    geometry: normalizeGeometryLngLat(area.geometry),
    properties: toAdminAreaProperties(area.properties, areaType),
    type: "Feature",
  }
}

const toAdminAreaMapData = (
  payload: GeneratedAdminAreas | undefined
): AdminAreaMapData => {
  const sigungu = payload?.sigungu ?? []

  return {
    dongGeoJson: {
      features: sigungu.flatMap((area) =>
        (area.dongs ?? [])
          .map((dong) => toGeoJsonFeature(dong, "dong"))
          .filter((feature): feature is AdminAreaFeature => feature !== null)
      ),
      type: "FeatureCollection",
    },
    sigunguGeoJson: {
      features: sigungu
        .map((area) => toGeoJsonFeature(area, "sigungu"))
        .filter((feature): feature is AdminAreaFeature => feature !== null),
      type: "FeatureCollection",
    },
  }
}

const toMarketSearchArea = (
  area: NonNullable<GeneratedSearchAreas["areas"]>[number]
): MarketSearchArea => ({
  centerLat: area.centerLat ?? 0,
  centerLng: area.centerLng ?? 0,
  dongCode: toStringValue(area.dongCode),
  dongName: toStringValue(area.dongName, area.dongCode),
  sigunguCode: toStringValue(area.sigunguCode),
  sigunguName: toStringValue(area.sigunguName),
})

const hasSearchMarkerCoordinate = (
  area: NonNullable<GeneratedSearchAreas["areas"]>[number]
) =>
  Boolean(area.dongCode) && hasPointCoordinate(area.centerLat, area.centerLng)

const toMarketPreviewRanking = (
  ranking: NonNullable<GeneratedMarketPreview["industryRankings"]>[number]
): MarketPreviewIndustryRanking => ({
  estimatedSalesAmount: toNumberValue(ranking.estimatedSalesAmount),
  estimatedSalesPerStore: toNumberValue(ranking.estimatedSalesPerStore),
  industryCode: toStringValue(ranking.industryCode),
  industryName: toStringValue(ranking.industryName),
  previousPeriodChangeRate: toNumberValue(ranking.previousPeriodChangeRate),
  rank: toNumberValue(ranking.rank),
  salesCount: toNumberValue(ranking.salesCount),
  storeCount: toNumberValue(ranking.storeCount),
})

const toAgeGroupLabel = (ageGroup: string) =>
  ageGroup === "60+" ? "60대+" : `${ageGroup}대`

const toManwon = (value: number | undefined) =>
  Math.round(toNumberValue(value) / 10_000)

const toDetailReportData = (payload: GeneratedMarketReport): DetailReportData => {
  const genderAgeGroups = payload.residentPopulation?.genderAgeGroups ?? []
  const ageGroups = Array.from(
    new Set(genderAgeGroups.map((item) => toStringValue(item.ageGroup)))
  ).filter(Boolean)

  return {
    commercialChangeIndicator: {
      code:
        payload.tradeAreaChange?.changeIndex === "HH" ||
        payload.tradeAreaChange?.changeIndex === "HL" ||
        payload.tradeAreaChange?.changeIndex === "LH" ||
        payload.tradeAreaChange?.changeIndex === "LL"
          ? payload.tradeAreaChange.changeIndex
          : "LL",
      description: toStringValue(payload.tradeAreaChange?.displayDescription),
      label: toStringValue(payload.tradeAreaChange?.changeIndexName),
    },
    competition: {
      closeCount: toNumberValue(payload.stores?.closedStores),
      franchiseStoreCount: toNumberValue(payload.stores?.franchiseStores),
      openCount: toNumberValue(payload.stores?.openedStores),
      storeCount: toNumberValue(payload.stores?.totalStores),
    },
    footTraffic: (payload.floatingPopulation?.timeSlots ?? []).map((slot) => ({
      hour: toStringValue(slot.timeSlot).split("-")[0] ?? "",
      value: toNumberValue(slot.count),
    })),
    residentPopulation: {
      byAge: ageGroups.map((ageGroup) => {
        const male =
          genderAgeGroups.find(
            (item) => item.ageGroup === ageGroup && item.gender === "male"
          )?.count ?? 0
        const female =
          genderAgeGroups.find(
            (item) => item.ageGroup === ageGroup && item.gender === "female"
          )?.count ?? 0

        return {
          ageGroup: toAgeGroupLabel(ageGroup),
          female,
          male,
        }
      }),
      total: toNumberValue(payload.residentPopulation?.total),
    },
    sectorSalesRanking: (payload.sales?.industryRankings ?? []).map(
      (ranking) => ({
        estimatedSales: toManwon(ranking.estimatedSalesAmount),
        qoqChange: toNumberValue(ranking.previousPeriodChangeRate),
        rank: toNumberValue(ranking.rank),
        salesPerStore: toManwon(ranking.estimatedSalesPerStore),
        sector: toStringValue(ranking.industryName),
        storeCount: toNumberValue(ranking.storeCount),
      })
    ),
    sectorWeekdayWeekendSales: [
      {
        sector: "전체",
        weekday: toManwon(payload.sales?.weekdaySalesAmount),
        weekend: toManwon(payload.sales?.weekendSalesAmount),
      },
    ],
  }
}

export const getAdminAreas = async () =>
  toAdminAreaMapData(
    (await fetchPublicMarketApi<ApiResponseAdminAreaHierarchyResponse>(
      getGetAdminAreasUrl()
    )).data
  )

export const getMarketPreview = async (
  dongCode: DongCode
): Promise<MarketPreviewData> => {
  const payload = (
    await fetchPublicMarketApi<ApiResponseMarketReportPreviewResponse>(
      getGetMarketReportPreviewByDongUrl(dongCode)
    )
  ).data

  return {
    // TODO: preview 응답에 프랜차이즈 추천 목록이 추가되면 실제 필드로 변환한다.
    franchiseRecommendations: [],
    industryRankings: (payload?.industryRankings ?? []).map(
      toMarketPreviewRanking
    ),
  }
}

export const getMarketReport = async (dongCode: DongCode) =>
  toDetailReportData(
    (
      await fetchPublicMarketApi<ApiResponseMarketReportResponse>(
        getGetMarketReportByDongUrl(dongCode)
      )
    ).data ?? {}
  )

export const searchMarketAreas = async (params: {
  industryCode?: string
  keyword?: string
}) => {
  const payload = (
    await fetchPublicMarketApi<ApiResponseAreaSearchResponse>(
      getSearchAreasUrl({
        industryCode: params.industryCode,
        keyword: params.keyword,
      })
    )
  ).data

  return {
    areas: (payload?.areas ?? [])
      .filter(hasSearchMarkerCoordinate)
      .map(toMarketSearchArea),
    keyword: toStringValue(payload?.keyword),
  }
}

// TODO: market OpenAPI에 업종 목록 endpoint가 추가되면 Orval 생성 함수로 교체한다.
export const getMarketIndustries = async (): Promise<IndustryMajorOption[]> =>
  industryFilterOptions

// TODO: market OpenAPI에 추천 목록 endpoint가 추가되면 Orval 생성 함수로 교체한다.
export const getMarketRecommendedAreas = async (): Promise<
  MarketRecommendedArea[]
> => []

// TODO: 상권(행정동)·프랜차이즈 스크랩 API가 추가되면 실제 Orval mutation으로 연결한다.
export const scrapMarketTarget = async (
  target: MarketScrapTarget
): Promise<MarketScrapTarget> => target
