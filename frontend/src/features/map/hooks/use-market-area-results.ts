import { useQuery } from "@tanstack/react-query"
import { getIndustryCode } from "@/features/map/lib/industry-filter-options"
import { marketAreaSearchQueryOptions } from "@/features/map/lib/map-query-options"
import { useMapStore } from "@/features/map/store/map-store"

const getHasSearchCondition = ({
  keyword,
  selectedMajorCategory,
  selectedMinorCategory,
}: {
  keyword: string
  selectedMajorCategory: string
  selectedMinorCategory: string
}) =>
  Boolean(
    keyword.trim() ||
      selectedMajorCategory !== "all" ||
      selectedMinorCategory !== "all"
  )

export function useMarketAreaResults() {
  const appliedSearchKeyword = useMapStore(
    (state) => state.appliedSearchKeyword
  )
  const selectedMajorCategory = useMapStore(
    (state) => state.selectedMajorCategory
  )
  const selectedMinorCategory = useMapStore(
    (state) => state.selectedMinorCategory
  )
  const industryCode = getIndustryCode({
    selectedMajorCategory,
    selectedMinorCategory,
  })
  const keyword = appliedSearchKeyword.trim()
  const hasSearchCondition = getHasSearchCondition({
    keyword: appliedSearchKeyword,
    selectedMajorCategory,
    selectedMinorCategory,
  })
  const searchQuery = useQuery({
    ...marketAreaSearchQueryOptions({
      industryCode,
      keyword: keyword || undefined,
    }),
    enabled: hasSearchCondition,
  })

  return {
    areas: searchQuery.data?.areas ?? [],
    hasSearchCondition,
    isError: hasSearchCondition ? searchQuery.isError : false,
    isLoading: hasSearchCondition ? searchQuery.isLoading : false,
  }
}
