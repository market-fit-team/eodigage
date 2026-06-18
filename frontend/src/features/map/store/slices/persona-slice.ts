import type { StateCreator } from "zustand"

export type PersonaSlice = {
  activePersona: string | null
  clearActivePersona: () => void
  setActivePersona: (activePersona: string | null) => void
}

// Persona state bridges onboarding output to map recommendations.
export const createPersonaSlice: StateCreator<PersonaSlice> = (set) => ({
  activePersona: null,
  clearActivePersona: () => set({ activePersona: null }),
  setActivePersona: (activePersona) => set({ activePersona }),
})
