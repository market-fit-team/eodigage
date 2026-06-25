import type { FeatureCollection, Point } from "geojson"
import type {
  GeoJSONSource,
  LngLatBoundsLike,
  Map,
  MapLayerMouseEvent,
} from "maplibre-gl"
import {
  DONG_BASE_LAYER_ID,
  DONG_BOUNDARY_LAYER_ID,
  DONG_HOVER_BOUNDARY_LAYER_ID,
  DONG_HOVER_LABEL_LAYER_ID,
  DONG_HOVER_LAYER_ID,
  DONG_RECOMMENDED_BOUNDARY_LAYER_ID,
  DONG_RECOMMENDED_LABEL_LAYER_ID,
  DONG_RECOMMENDED_LAYER_ID,
  DONG_SELECTED_BOUNDARY_LAYER_ID,
  DONG_SELECTED_LABEL_LAYER_ID,
  DONG_SELECTED_LAYER_ID,
  DONG_SOURCE_ID,
  GU_BOUNDARY_SOURCE_ID,
  SEARCH_RESULT_MARKER_LAYER_ID,
  SEARCH_RESULT_SOURCE_ID,
  getLayerFilterByCode,
  getLayerFilterByCodes,
  polygonLayers,
} from "@/features/map/lib/map-renderer/map-layers"
import type {
  AdminAreaMapData,
  MarketAreaListItem,
} from "@/features/map/types/map"
import type { DongCode } from "@/features/map/types/map"

export type DongPolygonMapActions = {
  clearPolygonHover: () => void
  focusMapOnDong: (dongCode: DongCode) => void
  hoverDong: (hoveredDongCode: DongCode | null) => void
  selectDong: (selectedDongCode: DongCode | null) => void
}

export type DongPolygonLayerState = {
  hoveredDongCode: DongCode | null
  recommendedDongCodes: DongCode[]
  searchResultAreas: MarketAreaListItem[]
  selectedDongCode: DongCode | null
}

type SearchResultMarkerProperties = {
  code: DongCode
  name: string
}

type SearchResultMarkerGeoJson = FeatureCollection<
  Point,
  SearchResultMarkerProperties
>

const recommendedLayerIds = [
  DONG_RECOMMENDED_LAYER_ID,
  DONG_RECOMMENDED_BOUNDARY_LAYER_ID,
  DONG_RECOMMENDED_LABEL_LAYER_ID,
] as const

const hoverLayerIds = [
  DONG_HOVER_LAYER_ID,
  DONG_HOVER_BOUNDARY_LAYER_ID,
] as const

const selectedLayerIds = [
  DONG_SELECTED_LAYER_ID,
  DONG_SELECTED_BOUNDARY_LAYER_ID,
  DONG_SELECTED_LABEL_LAYER_ID,
] as const

const hasLayer = (map: Map, layerId: string) => Boolean(map.getLayer(layerId))

const getEventDongCode = (event: MapLayerMouseEvent) => {
  const code = event.features?.[0]?.properties?.code

  return code == null ? null : String(code)
}

const getEmptySearchResultMarkers = (): SearchResultMarkerGeoJson => ({
  features: [],
  type: "FeatureCollection",
})

const toSearchResultMarkers = (
  areas: MarketAreaListItem[]
): SearchResultMarkerGeoJson => ({
  features: areas.map((area) => ({
    geometry: {
      coordinates: [area.centerLng, area.centerLat],
      type: "Point",
    },
    properties: {
      code: area.dongCode,
      name: area.dongName,
    },
    type: "Feature",
  })),
  type: "FeatureCollection",
})

export const getDongByCode = (
  adminAreas: AdminAreaMapData,
  code: DongCode | null
) =>
  adminAreas.dongGeoJson.features.find((dong) => dong.properties.code === code)
    ?.properties ?? null

export const getDongBoundsByCodes = (
  adminAreas: AdminAreaMapData,
  codes: DongCode[]
): LngLatBoundsLike | null => {
  const codeSet = new Set(codes)
  const bounds = {
    maxLat: Number.NEGATIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
  }

  adminAreas.dongGeoJson.features.forEach((feature) => {
    if (!codeSet.has(feature.properties.code)) {
      return
    }

    const coordinates =
      feature.geometry.type === "Polygon"
        ? feature.geometry.coordinates.flat(1)
        : feature.geometry.type === "MultiPolygon"
          ? feature.geometry.coordinates.flat(2)
          : []

    coordinates.forEach(([lng, lat]) => {
      bounds.minLng = Math.min(bounds.minLng, lng)
      bounds.minLat = Math.min(bounds.minLat, lat)
      bounds.maxLng = Math.max(bounds.maxLng, lng)
      bounds.maxLat = Math.max(bounds.maxLat, lat)
    })
  })

  if (
    !Number.isFinite(bounds.minLng) ||
    !Number.isFinite(bounds.minLat) ||
    !Number.isFinite(bounds.maxLng) ||
    !Number.isFinite(bounds.maxLat)
  ) {
    return null
  }

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ]
}

const updateGeoJsonSource = (
  map: Map,
  sourceId: string,
  data: AdminAreaMapData["dongGeoJson"] | AdminAreaMapData["sigunguGeoJson"]
) => {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined

  source?.setData(data)
}

export const syncSearchResultMarkers = (
  map: Map,
  areas: MarketAreaListItem[]
) => {
  const source = map.getSource(SEARCH_RESULT_SOURCE_ID) as
    | GeoJSONSource
    | undefined

  source?.setData(toSearchResultMarkers(areas))
}

export const syncDongPolygonSourceData = (
  map: Map,
  adminAreas: AdminAreaMapData
) => {
  updateGeoJsonSource(map, DONG_SOURCE_ID, adminAreas.dongGeoJson)
  updateGeoJsonSource(map, GU_BOUNDARY_SOURCE_ID, adminAreas.sigunguGeoJson)
}

export const addDongPolygonLayers = (
  map: Map,
  adminAreas: AdminAreaMapData
) => {
  if (map.getSource(DONG_SOURCE_ID)) {
    syncDongPolygonSourceData(map, adminAreas)
    return
  }

  map.addSource(DONG_SOURCE_ID, {
    data: adminAreas.dongGeoJson,
    type: "geojson",
  })
  map.addSource(GU_BOUNDARY_SOURCE_ID, {
    data: adminAreas.sigunguGeoJson,
    type: "geojson",
  })
  map.addSource(SEARCH_RESULT_SOURCE_ID, {
    data: getEmptySearchResultMarkers(),
    type: "geojson",
  })
  polygonLayers.forEach((layer) => {
    map.addLayer(layer)
  })
}

type BindDongPolygonEventsInput = DongPolygonMapActions & {
  map: Map
}

export const bindDongPolygonEvents = ({
  clearPolygonHover,
  focusMapOnDong,
  hoverDong,
  map,
  selectDong,
}: BindDongPolygonEventsInput) => {
  map.on("mousemove", DONG_BASE_LAYER_ID, (event: MapLayerMouseEvent) => {
    const code = getEventDongCode(event)

    if (!code) {
      return
    }

    map.getCanvas().style.cursor = "pointer"
    hoverDong(code)
  })

  map.on("mouseleave", DONG_BASE_LAYER_ID, () => {
    map.getCanvas().style.cursor = ""
    clearPolygonHover()
  })

  map.on("click", DONG_BASE_LAYER_ID, (event: MapLayerMouseEvent) => {
    const code = getEventDongCode(event)

    if (!code) {
      return
    }

    selectDong(code)
    focusMapOnDong(code)
  })

  map.on("mousemove", SEARCH_RESULT_MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer"
  })

  map.on("mouseleave", SEARCH_RESULT_MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = ""
  })

  map.on(
    "click",
    SEARCH_RESULT_MARKER_LAYER_ID,
    (event: MapLayerMouseEvent) => {
      const code = getEventDongCode(event)

      if (!code) {
        return
      }

      selectDong(code)
      focusMapOnDong(code)
    }
  )
}

type SyncDongPolygonLayersInput = DongPolygonLayerState & {
  map: Map
}

export const syncDongPolygonLayers = ({
  hoveredDongCode,
  map,
  recommendedDongCodes,
  searchResultAreas,
  selectedDongCode,
}: SyncDongPolygonLayersInput) => {
  if (!hasLayer(map, DONG_BOUNDARY_LAYER_ID)) {
    return
  }

  const recommendedFilter = getLayerFilterByCodes(recommendedDongCodes)
  const hoverFilter = getLayerFilterByCode(hoveredDongCode)
  const selectedFilter = getLayerFilterByCode(selectedDongCode)

  recommendedLayerIds.forEach((layerId) => {
    map.setFilter(layerId, recommendedFilter)
  })
  hoverLayerIds.forEach((layerId) => {
    map.setFilter(layerId, hoverFilter)
  })
  selectedLayerIds.forEach((layerId) => {
    map.setFilter(layerId, selectedFilter)
  })
  syncSearchResultMarkers(map, searchResultAreas)
  map.setFilter(
    DONG_HOVER_LABEL_LAYER_ID,
    getLayerFilterByCode(
      hoveredDongCode === selectedDongCode ? null : hoveredDongCode
    )
  )
}
