import { districtsData, personaResults } from "@/features/startup/lib/data"

export const getPersistedPersona = () => {
  if (typeof window === "undefined") {
    return null
  }

  const persona = localStorage.getItem("g15_persona")
  return persona && personaResults[persona] ? persona : null
}

export const getInitialTradeAreaId = (persona: string | null) => {
  if (persona) {
    const personaInfo = personaResults[persona]
    const recommendedDistrictId = personaInfo?.recommendedDistricts[0]

    if (recommendedDistrictId) {
      return recommendedDistrictId
    }
  }

  return districtsData[0]?.id ?? null
}
