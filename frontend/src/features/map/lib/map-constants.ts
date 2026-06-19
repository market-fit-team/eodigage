import type { DistrictData } from "@/features/startup/lib/data"

type DistrictShape = {
  id: DistrictData["id"]
  points: string
  markerX: number
  markerY: number
  labelX: number
  labelY: number
  statsY: number
}

export const districtShapes: DistrictShape[] = [
  {
    id: "mapo",
    points: "145,155 255,135 235,235 125,215",
    markerX: 180,
    markerY: 170,
    labelX: 175,
    labelY: 185,
    statsY: 200,
  },
  {
    id: "jongno",
    points: "295,95 435,85 405,175 275,175",
    markerX: 345,
    markerY: 125,
    labelX: 335,
    labelY: 135,
    statsY: 150,
  },
  {
    id: "seongdong",
    points: "485,115 625,125 605,215 465,195",
    markerX: 535,
    markerY: 150,
    labelX: 525,
    labelY: 155,
    statsY: 170,
  },
  {
    id: "itaewon",
    points: "305,205 415,205 435,285 315,295",
    markerX: 365,
    markerY: 240,
    labelX: 355,
    labelY: 245,
    statsY: 260,
  },
  {
    id: "gangnam",
    points: "485,325 635,315 615,425 465,415",
    markerX: 545,
    markerY: 360,
    labelX: 535,
    labelY: 365,
    statsY: 380,
  },
]

export const mapPalette = {
  activeFill: "var(--foreground)",
  activeStroke: "var(--primary)",
  activeLabel: "var(--background)",
  activeSubLabel: "var(--primary-foreground)",
  visibleFill: "var(--background)",
  visibleStroke: "var(--border)",
  mutedFill: "var(--muted)",
  mutedStroke: "var(--border)",
  label: "var(--foreground)",
  subLabel: "var(--muted-foreground)",
  marker: "var(--primary)",
  grid: "var(--border)",
  riverOuter: "var(--muted)",
  riverInner: "var(--border)",
  riverLabel: "var(--primary)",
} as const
