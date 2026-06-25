import type { Feature, FeatureCollection, Geometry } from "geojson"

export type TradeAreaId = string

export type MapTab = "franchises" | "sales"

export type DongCode = string

export type AdminAreaProperties = {
  areaType: "dong" | "sigungu"
  baseDate: string
  centerLat: number
  centerLng: number
  code: string
  name: string
  sigunguCode: string
  sigunguName: string
}

export type AdminAreaFeature = Feature<Geometry, AdminAreaProperties>

export type SigunguAdminArea = AdminAreaFeature & {
  dongs: AdminAreaFeature[]
}

export type AdminAreaMapData = {
  dongGeoJson: FeatureCollection<Geometry, AdminAreaProperties>
  sigunguGeoJson: FeatureCollection<Geometry, AdminAreaProperties>
}

export type MarketSearchArea = {
  centerLat: number
  centerLng: number
  dongCode: DongCode
  dongName: string
  sigunguCode: string
  sigunguName: string
}

export type MarketRecommendedArea = {
  dongCode: DongCode
  score: number
}

export type MarketScrapTargetType = "dong" | "franchise"

export type MarketScrapTarget = {
  id: string
  type: MarketScrapTargetType
}

export type MarketFranchiseRecommendation = {
  brandName: string
  expectedStartupCost?: number
  franchiseId: string
  industryName?: string
}

export type MarketAreaListItem = MarketSearchArea & {
  score?: number
}

export type MarketPreviewIndustryRanking = {
  estimatedSalesAmount: number
  estimatedSalesPerStore: number
  industryCode: string
  industryName: string
  previousPeriodChangeRate: number
  rank: number
  salesCount: number
  storeCount: number
}

export type MarketPreviewData = {
  franchiseRecommendations: MarketFranchiseRecommendation[]
  industryRankings: MarketPreviewIndustryRanking[]
}

export type MapFocusRequest = {
  dongCode: DongCode
  requestId: number
}

export type HourlyFootTraffic = {
  hour: string
  value: number
}

export type ResidentPopulationByAge = {
  ageGroup: string
  male: number
  female: number
}

export type ResidentPopulation = {
  total: number
  byAge: ResidentPopulationByAge[]
}

export type SectorWeekdayWeekendSales = {
  sector: string
  weekday: number
  weekend: number
}

export type SectorSalesRank = {
  rank: number
  sector: string
  estimatedSales: number
  qoqChange: number
  storeCount: number
  salesPerStore: number
}

export type CompetitionStats = {
  storeCount: number
  franchiseStoreCount: number
  openCount: number
  closeCount: number
}

export type CommercialChangeIndicator = {
  code: "HH" | "HL" | "LH" | "LL"
  label: string
  description: string
}

export type DetailReportData = {
  footTraffic: HourlyFootTraffic[]
  residentPopulation: ResidentPopulation
  sectorWeekdayWeekendSales: SectorWeekdayWeekendSales[]
  sectorSalesRanking: SectorSalesRank[]
  competition: CompetitionStats
  commercialChangeIndicator: CommercialChangeIndicator
}
