import type { StateCreator } from "zustand"
import type { BudgetRange, TargetDemographic } from "@/features/map/types/map"

export type FilterSlice = {
  budgetRange: BudgetRange
  recommendationsOnly: boolean
  resetFilters: () => void
  selectedCategory: string
  setBudgetRange: (budgetRange: BudgetRange) => void
  setRecommendationsOnly: (recommendationsOnly: boolean) => void
  setSelectedCategory: (selectedCategory: string) => void
  setTargetDemographic: (targetDemographic: TargetDemographic) => void
  targetDemographic: TargetDemographic
}

// These values are the applied map filters that canvas and filter widgets share.
export const createFilterSlice: StateCreator<FilterSlice> = (set) => ({
  budgetRange: "all",
  recommendationsOnly: false,
  resetFilters: () =>
    set({
      budgetRange: "all",
      recommendationsOnly: false,
      selectedCategory: "all",
      targetDemographic: "all",
    }),
  selectedCategory: "all",
  setBudgetRange: (budgetRange) => set({ budgetRange }),
  setRecommendationsOnly: (recommendationsOnly) => set({ recommendationsOnly }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setTargetDemographic: (targetDemographic) => set({ targetDemographic }),
  targetDemographic: "all",
})
