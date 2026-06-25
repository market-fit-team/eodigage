import type { StateCreator } from "zustand"

export type FilterSlice = {
  appliedSearchKeyword: string
  executeTextSearch: (searchKeyword: string) => void
  searchKeyword: string
  resetFilters: () => void
  selectedMajorCategory: string
  selectedMinorCategory: string
  setSelectedMajorCategory: (selectedMajorCategory: string) => void
  setSelectedMinorCategory: (selectedMinorCategory: string) => void
}

// 백엔드 상권 검색 API로 전달하는 검색어와 업종 필터 값이다.
export const createFilterSlice: StateCreator<FilterSlice> = (set) => ({
  appliedSearchKeyword: "",
  executeTextSearch: (searchKeyword) => {
    const nextSearchKeyword = searchKeyword.trim()

    set({
      appliedSearchKeyword: nextSearchKeyword,
      searchKeyword: nextSearchKeyword,
    })
  },
  searchKeyword: "",
  resetFilters: () =>
    set({
      appliedSearchKeyword: "",
      searchKeyword: "",
      selectedMajorCategory: "all",
      selectedMinorCategory: "all",
    }),
  selectedMajorCategory: "all",
  selectedMinorCategory: "all",
  setSelectedMajorCategory: (selectedMajorCategory) =>
    set({
      selectedMajorCategory,
      selectedMinorCategory: "all",
    }),
  setSelectedMinorCategory: (selectedMinorCategory) =>
    set({ selectedMinorCategory }),
})
