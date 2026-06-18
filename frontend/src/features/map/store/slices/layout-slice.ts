import type { StateCreator } from "zustand"

export type LayoutSlice = {
  closeChat: () => void
  closeFilter: () => void
  isChatOpen: boolean
  isFilterOpen: boolean
  openChat: () => void
  openFilter: () => void
}

// Sidebar visibility is map layout state, not widget state.
export const createLayoutSlice: StateCreator<LayoutSlice> = (set) => ({
  closeChat: () => set({ isChatOpen: false }),
  closeFilter: () => set({ isFilterOpen: false }),
  isChatOpen: false,
  isFilterOpen: true,
  openChat: () => set({ isChatOpen: true }),
  openFilter: () => set({ isFilterOpen: true }),
})
