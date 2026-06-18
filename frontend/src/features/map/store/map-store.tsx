"use client"

import { type ReactNode, createContext, useContext, useState } from "react"
import { createStore, useStore } from "zustand"
import {
  type FilterSlice,
  createFilterSlice,
} from "@/features/map/store/slices/filter-slice"
import {
  type LayoutSlice,
  createLayoutSlice,
} from "@/features/map/store/slices/layout-slice"
import {
  type PersonaSlice,
  createPersonaSlice,
} from "@/features/map/store/slices/persona-slice"
import {
  type SelectionSlice,
  createSelectionSlice,
} from "@/features/map/store/slices/selection-slice"

export type MapState = FilterSlice & LayoutSlice & PersonaSlice & SelectionSlice

// Map store is scoped by MapStoreProvider so a route remount starts fresh map UI state.
const createMapStore = (initialState?: Partial<MapState>) =>
  createStore<MapState>()((set, get, api) => ({
    ...createFilterSlice(set, get, api),
    ...createLayoutSlice(set, get, api),
    ...createPersonaSlice(set, get, api),
    ...createSelectionSlice(set, get, api),
    ...initialState,
  }))

type MapStoreApi = ReturnType<typeof createMapStore>

const MapStoreContext = createContext<MapStoreApi | undefined>(undefined)

type MapStoreProviderProps = {
  children: ReactNode
  initialState?: Partial<MapState>
}

export function MapStoreProvider({
  children,
  initialState,
}: MapStoreProviderProps) {
  const [store] = useState(() => createMapStore(initialState))

  return (
    <MapStoreContext.Provider value={store}>
      {children}
    </MapStoreContext.Provider>
  )
}

export function useMapStore<T>(selector: (state: MapState) => T): T {
  const mapStoreContext = useContext(MapStoreContext)

  if (!mapStoreContext) {
    throw new Error("useMapStore must be used within MapStoreProvider")
  }

  return useStore(mapStoreContext, selector)
}
