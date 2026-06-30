import type { KeyboardEvent, ReactNode, Ref } from "react"
import { RotateCcw, Search, X } from "lucide-react"
import { IndustryPicker } from "@/features/map/components/filter/industry-picker"
import type { IndustryMajorOption } from "@/features/map/lib/industry-filter-options"
import { Button } from "@/shared/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/components/ui/input-group"

type FilterBarProps = {
  appliedSearchKeyword: string
  filterRef: Ref<HTMLDivElement>
  hasSearchCondition: boolean
  industryOptions: IndustryMajorOption[]
  isIndustryOptionsError: boolean
  isIndustryOptionsLoading: boolean
  onClearSearchKeyword: () => void
  onExecuteTextSearch: () => void
  onFilterPointerDown: () => void
  onResetFilters: () => void
  onSearchFocus: () => void
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onSelectIndustry: (
    selectedMajorCategory: string,
    selectedMinorCategory: string
  ) => void
  resultDropdown: ReactNode
  resultCount: number
  searchInputRef: Ref<HTMLInputElement>
  selectedMajorCategory: string
  selectedMinorCategory: string
}

export function FilterBar({
  appliedSearchKeyword,
  filterRef,
  hasSearchCondition,
  industryOptions,
  isIndustryOptionsError,
  isIndustryOptionsLoading,
  onClearSearchKeyword,
  onExecuteTextSearch,
  onFilterPointerDown,
  onResetFilters,
  onSearchFocus,
  onSearchKeyDown,
  onSelectIndustry,
  resultDropdown,
  resultCount,
  searchInputRef,
  selectedMajorCategory,
  selectedMinorCategory,
}: FilterBarProps) {
  return (
    <div
      ref={filterRef}
      className="relative"
      onPointerDown={onFilterPointerDown}
    >
      {/* 검색·업종·조건을 하나의 둥근 바에 통합한다(분리하지 않는다). */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-2 py-2 text-xs shadow-lg backdrop-blur">
        {/* 검색 */}
        <InputGroup className="h-9 min-w-48 flex-1 border-0 bg-transparent shadow-none focus-within:ring-0">
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            defaultValue={appliedSearchKeyword}
            onFocus={onSearchFocus}
            onKeyDown={onSearchKeyDown}
            placeholder="구, 행정동, 상권, 프랜차이즈 검색"
            aria-label="지역 및 상권 검색"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label="검색어 지우기"
              className="group-has-[input:placeholder-shown]/input-group:hidden"
              onClick={onClearSearchKeyword}
            >
              <X />
            </InputGroupButton>
            <InputGroupButton
              type="button"
              size="xs"
              aria-label="검색 실행"
              onClick={onExecuteTextSearch}
            >
              검색
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <div className="h-6 w-px shrink-0 bg-border" />

        {/* 업종 필터 */}
        <IndustryPicker
          industryOptions={industryOptions}
          isError={isIndustryOptionsError}
          isLoading={isIndustryOptionsLoading}
          onSelectIndustry={onSelectIndustry}
          selectedMajorCategory={selectedMajorCategory}
          selectedMinorCategory={selectedMinorCategory}
        />

        {/* 조건 상태 + 초기화 */}
        {hasSearchCondition ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="shrink-0 gap-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="조건 초기화"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{resultCount}개 · 초기화</span>
          </Button>
        ) : (
          <span className="hidden shrink-0 px-2 text-muted-foreground md:inline">
            조건 없음
          </span>
        )}
      </div>

      {/* 검색 결과 드롭다운은 카드 아래에 떠서(absolute) 카드 높이에 영향을 주지 않는다. */}
      {resultDropdown ? (
        <div className="absolute top-full right-0 left-0 z-20 mt-1.5">
          {resultDropdown}
        </div>
      ) : null}
    </div>
  )
}
