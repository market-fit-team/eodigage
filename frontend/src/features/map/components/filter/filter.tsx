"use client"

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { SearchResultDropdown } from "@/features/map/components/filter/search-result-dropdown"
import { useMarketAreaResults } from "@/features/map/hooks/use-market-area-results"
import { useMarketIndustries } from "@/features/map/hooks/use-market-industries"
import { useMapStore } from "@/features/map/store/map-store"
import type { MarketSearchArea } from "@/features/map/types/map"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/components/ui/input-group"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/components/ui/native-select"

// Filter는 MapView 상단의 가로 검색 바를 소유한다.
// 구/행정동/상권/프랜차이즈 검색어와 업종 필터를 백엔드 조회 조건으로 전달한다.
export function Filter() {
  const [closedResultKey, setClosedResultKey] = useState<string | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const appliedSearchKeyword = useMapStore(
    (state) => state.appliedSearchKeyword
  )
  const executeTextSearch = useMapStore((state) => state.executeTextSearch)
  const focusMapOnDong = useMapStore((state) => state.focusMapOnDong)
  const resetFilters = useMapStore((state) => state.resetFilters)
  const selectDong = useMapStore((state) => state.selectDong)
  const selectedMajorCategory = useMapStore(
    (state) => state.selectedMajorCategory
  )
  const selectedMinorCategory = useMapStore(
    (state) => state.selectedMinorCategory
  )
  const setSelectedMajorCategory = useMapStore(
    (state) => state.setSelectedMajorCategory
  )
  const setSelectedMinorCategory = useMapStore(
    (state) => state.setSelectedMinorCategory
  )

  const { areas, hasSearchCondition, isError, isLoading } =
    useMarketAreaResults()
  const {
    data: industryOptions = [],
    isError: isIndustryOptionsError,
    isLoading: isIndustryOptionsLoading,
  } = useMarketIndustries()
  const minorOptions = useMemo(
    () =>
      industryOptions.find(
        (option) => option.code === selectedMajorCategory
      )?.minors ?? [],
    [industryOptions, selectedMajorCategory]
  )
  const resultKey = [
    appliedSearchKeyword.trim(),
    selectedMajorCategory,
    selectedMinorCategory,
  ].join("|")
  const isResultOpen = hasSearchCondition && closedResultKey !== resultKey

  useEffect(() => {
    if (!isResultOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        filterRef.current?.contains(event.target)
      ) {
        return
      }

      setClosedResultKey(resultKey)
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isResultOpen, resultKey])

  const handleResetFilters = () => {
    resetFilters()
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
    setClosedResultKey("|all|all")
  }

  const handleExecuteTextSearch = () => {
    executeTextSearch(searchInputRef.current?.value ?? "")
    setClosedResultKey(null)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    handleExecuteTextSearch()
  }

  const handleSelectArea = (area: MarketSearchArea) => {
    selectDong(area.dongCode)
    focusMapOnDong(area.dongCode)
    setClosedResultKey(resultKey)
  }

  const handleFilterPointerDown = () => {
    if (closedResultKey === resultKey) {
      setClosedResultKey(null)
    }
  }

  const handleClearSearchKeyword = () => {
    if (!searchInputRef.current) {
      return
    }

    searchInputRef.current.value = ""
    searchInputRef.current.focus()
  }

  return (
    <Card
      ref={filterRef}
      className="overflow-hidden border bg-card py-0 shadow-sm"
      onPointerDown={handleFilterPointerDown}
    >
      <CardContent className="flex flex-wrap items-center gap-2 overflow-visible px-3 py-2.5 text-xs">
        <div className="min-w-64 flex-1">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              defaultValue={appliedSearchKeyword}
              onFocus={() => {
                if (hasSearchCondition) {
                  setClosedResultKey(null)
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="구·행정동·상권·프랜차이즈 검색"
              aria-label="지역 및 상권 검색"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="검색어 지우기"
                className="group-has-[input:placeholder-shown]/input-group:hidden"
                onClick={handleClearSearchKeyword}
              >
                <X />
              </InputGroupButton>
              <InputGroupButton
                type="button"
                size="xs"
                aria-label="검색 실행"
                onClick={handleExecuteTextSearch}
              >
                검색
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <NativeSelect
          value={selectedMajorCategory}
          onChange={(event) => setSelectedMajorCategory(event.target.value)}
          className="w-36 shrink-0"
          disabled={isIndustryOptionsLoading || isIndustryOptionsError}
        >
          <NativeSelectOption value="all">
            {isIndustryOptionsLoading
              ? "업종 로딩 중"
              : isIndustryOptionsError
                ? "업종 로드 실패"
                : "전체 대분류"}
          </NativeSelectOption>
          {industryOptions.map((option) => (
            <NativeSelectOption key={option.code} value={option.code}>
              {option.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          value={selectedMinorCategory}
          onChange={(event) => setSelectedMinorCategory(event.target.value)}
          className="w-40 shrink-0"
          disabled={
            selectedMajorCategory === "all" ||
            isIndustryOptionsLoading ||
            isIndustryOptionsError
          }
        >
          <NativeSelectOption value="all">전체 소분류</NativeSelectOption>
          {minorOptions.map((option) => (
            <NativeSelectOption key={option.code} value={option.code}>
              {option.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <div className="ml-auto flex shrink-0 items-center gap-2 text-muted-foreground">
          <span>{hasSearchCondition ? `${areas.length}개 지역` : "조건 없음"}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleResetFilters}
          >
            조건 초기화
          </Button>
        </div>
      </CardContent>

      {hasSearchCondition && isResultOpen ? (
        <SearchResultDropdown
          areas={areas}
          isError={isError}
          isLoading={isLoading}
          onClose={() => setClosedResultKey(resultKey)}
          onSelectArea={handleSelectArea}
        />
      ) : null}
    </Card>
  )
}
