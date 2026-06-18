"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  FileText,
  Filter,
  HelpCircle,
  Info,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  type DistrictData,
  districtsData,
  personaResults,
} from "@/features/startup/lib/data"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/components/ui/native-select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"

type MapTab = "sectors" | "demographics" | "traffic"

type DistrictShape = {
  id: DistrictData["id"]
  points: string
  markerX: number
  markerY: number
  labelX: number
  labelY: number
  statsY: number
}

const districtShapes: DistrictShape[] = [
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

const mapPalette = {
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

const getPersistedPersona = () => {
  if (typeof window === "undefined") {
    return null
  }

  const persona = localStorage.getItem("g15_persona")
  return persona && personaResults[persona] ? persona : null
}

const getInitialDistrict = (persona: string | null) => {
  if (persona) {
    const personaInfo = personaResults[persona]
    const recommendedDistrictId = personaInfo?.recommendedDistricts[0]
    if (recommendedDistrictId) {
      const district = districtsData.find(
        (currentDistrict) => currentDistrict.id === recommendedDistrictId
      )
      if (district) {
        return district
      }
    }
  }

  return districtsData[0]
}

function MapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaQuery = searchParams.get("persona")
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(
    () => getInitialDistrict(personaQuery || getPersistedPersona())
  )
  const [activeTab, setActiveTab] = useState<MapTab>("traffic")
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [budgetRange, setBudgetRange] = useState("all")
  const [targetDemographic, setTargetDemographic] = useState("all")
  const [recommendationsOnly, setRecommendationsOnly] = useState(() =>
    Boolean(personaQuery || getPersistedPersona())
  )
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([
    {
      sender: "ai",
      text: "안녕하세요! Gemini 15 AI 창업 비서입니다. 왼쪽 지도에서 행정동 상권을 탭해 매출 및 유동인구를 비교하시거나, 창업 관련 질문을 편하게 말씀해 주세요.",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [storedPersona, setStoredPersona] = useState<string | null>(() =>
    getPersistedPersona()
  )
  const activePersona = personaQuery || storedPersona

  const handleSelectDistrict = (district: DistrictData) => {
    setSelectedDistrict(district)

    const welcomeMessage = {
      sender: "ai" as const,
      text: `[${district.nameKo}] 상권을 분석합니다. 월평균 매출은 ${district.avgSales.toLocaleString()}만원 이고, 3년 F&B 생존율은 ${district.survivalRate3Year}% 입니다. 더 상세히 알고 싶은 부분(피크 타임, 연령 비중, 프랜차이즈 후보군)을 말씀해 주시면 안내해 드릴게요!`,
    }
    setChatHistory((prev) => [...prev, welcomeMessage])
  }

  const filteredDistricts = districtsData.filter((district) => {
    if (selectedCategory !== "all") {
      const hasSector = district.topSectors.some((sector) =>
        sector.sector.includes(selectedCategory)
      )
      if (!hasSector) {
        return false
      }
    }

    if (budgetRange !== "all") {
      if (budgetRange === "low" && district.avgSales > 3000) {
        return false
      }
      if (budgetRange === "high" && district.avgSales < 3500) {
        return false
      }
    }

    if (targetDemographic !== "all") {
      const dominantAge = district.footTrafficAge.reduce((current, next) =>
        next.percentage > current.percentage ? next : current
      )

      if (targetDemographic === "20" && dominantAge.ageGroup !== "20대") {
        return false
      }
      if (targetDemographic === "30" && dominantAge.ageGroup !== "30대") {
        return false
      }
      if (
        targetDemographic === "50" &&
        dominantAge.ageGroup !== "40대" &&
        dominantAge.ageGroup !== "50대 이상"
      ) {
        return false
      }
    }

    if (recommendationsOnly && activePersona) {
      const personaInfo = personaResults[activePersona]
      if (
        personaInfo &&
        !personaInfo.recommendedDistricts.includes(district.id)
      ) {
        return false
      }
    }

    return true
  })

  const filteredDistrictIds = new Set(
    filteredDistricts.map((district) => district.id)
  )

  const handleSendChat = (text: string) => {
    if (!text.trim()) {
      return
    }

    const userMessage = { sender: "user" as const, text }
    setChatHistory((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    setTimeout(() => {
      let aiText = ""
      const districtName = selectedDistrict
        ? selectedDistrict.nameKo
        : "해당 상권"
      const normalizedText = text.toLowerCase()

      if (normalizedText.includes("매출") || normalizedText.includes("돈")) {
        aiText = `${districtName}의 최근 카드사 결제 정보를 분석하면 주말 매출 점유율이 42.1%로 높으며, 식음료 매장당 월평균 결제 단가는 24,500원선으로 안정적인 성장을 기록 중입니다.`
      } else if (
        normalizedText.includes("생존") ||
        normalizedText.includes("폐업") ||
        normalizedText.includes("위험")
      ) {
        aiText = `${districtName}의 3년차 가맹점 생존율은 ${selectedDistrict?.survivalRate3Year}%로 양호한 편이나, 특정 커피 전문점 브랜드들이 과포화 상태이므로 차별화된 F&B 아이템 선정이 필요합니다.`
      } else if (
        normalizedText.includes("추천") ||
        normalizedText.includes("프랜차이즈")
      ) {
        const brands = selectedDistrict?.recommendedFranchises
          .map((franchise) => franchise.name)
          .join(", ")
        aiText = `${districtName}의 매출 연령 비중상 [ ${brands} ] 가맹점이 적합도가 높으며, 초기 창업 비용은 최소 입점 비용과 권리금을 조율할 필요가 있습니다.`
      } else {
        aiText = `입력하신 창업 실무 조언을 소상공인 정책 대출 및 화재 보험 보장 요율 데이터베이스와 결합하여 검토한 결과, ${districtName}은 주중 직장인과 주말 2030 유동층이 조화를 이루는 비즈니스 구조를 띄고 있어 리스크가 낮습니다.`
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiText }])
      setIsTyping(false)
    }, 700)
  }

  const presetPrompts = [
    {
      text: "주말 업종 매출액 비중",
      action: () => handleSendChat("상권의 주말 업종 매출액 비중을 요약해 줘."),
    },
    {
      text: "과포화 업종 및 위험성",
      action: () =>
        handleSendChat("상권 내 과포화 업종과 폐업 방지 대책을 알려줘."),
    },
    {
      text: "입점 추천 가맹본부 후보",
      action: () => handleSendChat("이곳에 창업 가능한 유력 프랜차이즈는?"),
    },
  ]

  const handleGenerateReport = () => {
    if (!selectedDistrict) {
      return
    }

    const chatSummaries = chatHistory
      .filter((chat) => chat.sender === "user" || chat.sender === "ai")
      .map((chat) => `${chat.sender === "user" ? "Q:" : "A:"} ${chat.text}`)
      .slice(-4)
      .join("\n")

    localStorage.setItem("g15_temp_chat", chatSummaries)
    router.push(`/report?district=${selectedDistrict.id}`)
  }

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-muted/40">
      <Card
        className={`absolute top-4 bottom-4 left-4 z-20 w-80 gap-0 overflow-hidden py-0 transition-transform duration-300 ${
          isFilterOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]"
        }`}
      >
        <CardHeader className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">상권 탐색 필터</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsFilterOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 text-xs">
          {activePersona ? (
            <Card size="sm" className="bg-primary/5">
              <CardContent>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge variant="secondary">나의 유저 타워 로드됨</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      localStorage.removeItem("g15_persona")
                      setStoredPersona(null)
                      setRecommendationsOnly(false)
                      if (personaQuery) {
                        router.replace("/map")
                      }
                    }}
                  >
                    해제
                  </Button>
                </div>
                <p className="font-medium text-foreground">
                  {personaResults[activePersona]?.title}
                </p>

                <label className="mt-3 flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={recommendationsOnly}
                    onCheckedChange={(checked) =>
                      setRecommendationsOnly(checked === true)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    추천 상권만 지도에 표시
                  </span>
                </label>
              </CardContent>
            </Card>
          ) : (
            <Card size="sm" className="bg-muted/20">
              <CardContent className="text-center">
                <p className="mb-2 leading-relaxed text-muted-foreground">
                  성향 온보딩 분석을 하시면 어울리는 행정동 상권 정보가 자동
                  로드됩니다.
                </p>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/onboarding">
                    <HelpCircle className="h-3.5 w-3.5" />
                    성향 분석하기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              창업 희망 업종
            </label>
            <NativeSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="all">전체 업종</NativeSelectOption>
              <NativeSelectOption value="커피">
                커피 및 디저트 카페
              </NativeSelectOption>
              <NativeSelectOption value="일식">
                일식 전문점 / 이자카야
              </NativeSelectOption>
              <NativeSelectOption value="한식">
                한식 밥집 / 요리주점
              </NativeSelectOption>
              <NativeSelectOption value="아시안">
                아시안 푸드 / 마라탕
              </NativeSelectOption>
              <NativeSelectOption value="스튜디오">
                셀프 스튜디오 / 사진관
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              자본금 규모
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {["all", "low", "high"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={budgetRange === type ? "secondary" : "outline"}
                  size="lg"
                  onClick={() => setBudgetRange(type)}
                  className="w-full"
                >
                  {type === "all" ? "전체" : type === "low" ? "소자본" : "여유"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              핵심 타겟 연령층
            </label>
            <NativeSelect
              value={targetDemographic}
              onChange={(e) => setTargetDemographic(e.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="all">전체 연령</NativeSelectOption>
              <NativeSelectOption value="20">
                20대 위주 (대학생/관광객)
              </NativeSelectOption>
              <NativeSelectOption value="30">
                30대 위주 (직장인/오피스)
              </NativeSelectOption>
              <NativeSelectOption value="50">
                40대 이상 (전통시장/주거지역)
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-4 text-xs text-muted-foreground">
          <span>검색: {filteredDistricts.length}개 지역</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setSelectedCategory("all")
              setBudgetRange("all")
              setTargetDemographic("all")
              setRecommendationsOnly(false)
            }}
          >
            필터 초기화
          </Button>
        </CardFooter>
      </Card>

      {!isFilterOpen && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setIsFilterOpen(true)}
          className="absolute top-4 left-4 z-20 gap-1.5"
        >
          <Filter className="h-4 w-4 text-primary" />
          <span>필터 열기</span>
        </Button>
      )}

      <div className="relative flex h-full flex-1 items-center justify-center bg-background select-none">
        <svg
          viewBox="0 0 800 500"
          className="h-full max-h-[85vh] w-full p-4 text-xs font-medium"
        >
          <defs>
            <pattern
              id="mapGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={mapPalette.grid}
                strokeWidth="1"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          <path
            d="M 50,300 Q 150,280 250,280 T 450,320 T 650,270 T 750,290"
            fill="none"
            stroke={mapPalette.riverOuter}
            strokeWidth="38"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 50,300 Q 150,280 250,280 T 450,320 T 650,270 T 750,290"
            fill="none"
            stroke={mapPalette.riverInner}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />
          <text
            x="350"
            y="305"
            fill={mapPalette.riverLabel}
            opacity="0.35"
            className="text-xs font-semibold italic"
          >
            Han River
          </text>

          {districtShapes.map((shape) => {
            const district = districtsData.find(
              (currentDistrict) => currentDistrict.id === shape.id
            )

            if (!district) {
              return null
            }

            const isSelected = selectedDistrict?.id === district.id
            const isVisible = filteredDistrictIds.has(district.id)
            const isRecommended = Boolean(
              activePersona &&
              personaResults[activePersona]?.recommendedDistricts.includes(
                district.id
              )
            )

            return (
              <g
                key={district.id}
                onClick={() => handleSelectDistrict(district)}
                className="group cursor-pointer"
              >
                <polygon
                  points={shape.points}
                  fill={
                    isSelected
                      ? mapPalette.activeFill
                      : isVisible
                        ? mapPalette.visibleFill
                        : mapPalette.mutedFill
                  }
                  stroke={
                    isSelected
                      ? mapPalette.activeStroke
                      : isVisible
                        ? mapPalette.visibleStroke
                        : mapPalette.mutedStroke
                  }
                  strokeWidth={isSelected ? 2.5 : 1}
                  className="transition-[fill,stroke] duration-200 group-hover:opacity-90"
                />
                {isRecommended && (
                  <circle
                    cx={shape.markerX}
                    cy={shape.markerY}
                    r="4"
                    fill={mapPalette.marker}
                    className="animate-pulse"
                  />
                )}
                <text
                  x={shape.labelX}
                  y={shape.labelY}
                  fill={isSelected ? mapPalette.activeLabel : mapPalette.label}
                  className="pointer-events-none text-xs font-semibold"
                >
                  {district.nameKo}
                </text>
                <text
                  x={shape.labelX}
                  y={shape.statsY}
                  fill={
                    isSelected ? mapPalette.activeSubLabel : mapPalette.subLabel
                  }
                  className="pointer-events-none font-mono text-[9px]"
                >
                  {district.avgSales.toLocaleString()}만원
                </text>
              </g>
            )
          })}
        </svg>

        <Card size="sm" className="absolute bottom-4 left-4 z-10 gap-2.5">
          <CardContent className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-4 rounded-sm border"
                style={{
                  backgroundColor: mapPalette.activeFill,
                  borderColor: mapPalette.activeStroke,
                }}
              ></span>
              <span>선택된 상권</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-2.5 w-4 rounded-sm border"
                style={{
                  backgroundColor: mapPalette.visibleFill,
                  borderColor: mapPalette.visibleStroke,
                }}
              ></span>
              <span>필터 조건 충족</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-2.5 w-4 rounded-sm border"
                style={{
                  backgroundColor: mapPalette.mutedFill,
                  borderColor: mapPalette.mutedStroke,
                }}
              ></span>
              <span>기타 상권</span>
            </div>
            {activePersona && (
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary"></span>
                <span className="text-xs font-medium text-primary">
                  내 성향 추천 상권
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedDistrict && (
        <div
          className={`absolute right-0 bottom-4 z-10 px-4 md:px-8 ${
            isFilterOpen ? "left-80" : "left-0"
          }`}
        >
          <Card className="mx-auto max-w-4xl gap-0 overflow-hidden py-0">
            <CardContent className="flex flex-col gap-6 py-6 md:flex-row">
              <div className="flex flex-col justify-between border-b border-border pb-6 md:w-1/3 md:border-r md:border-b-0 md:pr-6 md:pb-0">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {selectedDistrict.nameKo}
                    </h3>
                    <Badge variant="outline">{selectedDistrict.nameEn}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {selectedDistrict.desc}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs">
                  <div>
                    <span className="block text-xs text-muted-foreground">
                      월평균 매출
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {selectedDistrict.avgSales.toLocaleString()}만원
                    </span>
                    <span className="block text-xs font-medium text-primary">
                      +{selectedDistrict.yoySalesChange}% YoY
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">
                      3년 생존률
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {selectedDistrict.survivalRate3Year}%
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      밀집도: {selectedDistrict.densityScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as MapTab)}
                >
                  <TabsList
                    variant="line"
                    className="mb-3.5 border-b border-border pb-2"
                  >
                    <TabsTrigger value="traffic">시간대 유동인구</TabsTrigger>
                    <TabsTrigger value="demographics">연령분포</TabsTrigger>
                    <TabsTrigger value="sectors">밀집 업종/생존율</TabsTrigger>
                  </TabsList>

                  <TabsContent value="traffic" className="mt-0 h-32">
                    <ChartContainer
                      config={{
                        traffic: {
                          label: "유동인구 (천명)",
                          color: "var(--chart-1)",
                        },
                      }}
                      className="h-32 w-full"
                    >
                      <LineChart data={selectedDistrict.footTrafficHourly}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis tickLine={false} axisLine={false} width={25} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="traffic"
                          stroke="var(--chart-1)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          name="유동인구 (천명)"
                        />
                      </LineChart>
                    </ChartContainer>
                  </TabsContent>

                  <TabsContent value="demographics" className="mt-0 h-32">
                    <ChartContainer
                      config={{
                        percentage: {
                          label: "비중 (%)",
                          color: "var(--chart-1)",
                        },
                      }}
                      className="h-32 w-full"
                    >
                      <BarChart data={selectedDistrict.footTrafficAge}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="ageGroup"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis tickLine={false} axisLine={false} width={25} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => `${value}%`}
                            />
                          }
                        />
                        <Bar dataKey="percentage" radius={4} name="비중 (%)">
                          {selectedDistrict.footTrafficAge.map(
                            (entry, index) => (
                              <Cell
                                key={`age-${index}`}
                                fill={
                                  entry.percentage > 35
                                    ? "var(--chart-1)"
                                    : "var(--chart-2)"
                                }
                              />
                            )
                          )}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </TabsContent>

                  <TabsContent value="sectors" className="mt-0">
                    <div className="grid max-h-32 grid-cols-2 gap-3 overflow-y-auto">
                      {selectedDistrict.topSectors.map((sector, idx) => (
                        <Card key={idx} size="sm" className="bg-muted/20">
                          <CardContent className="flex items-center justify-between">
                            <div>
                              <span className="block font-medium text-foreground">
                                {sector.sector}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                경쟁강도: {sector.density}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block font-medium text-primary">
                                {sector.survivalRate}%
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                3년 생존율
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    AI 컨설턴트와의 면담 내용을 기반으로 상세 리포트를
                    설계합니다.
                  </span>

                  <Button
                    type="button"
                    size="lg"
                    onClick={handleGenerateReport}
                    className="gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    AI 상권 리포트 생성
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card
        className={`absolute top-4 right-4 bottom-4 z-20 w-80 gap-0 overflow-hidden py-0 transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-[calc(100%+16px)]"
        }`}
      >
        <CardHeader className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">AI 상권 분석 상담원</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsChatOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          {chatHistory.map((chat, idx) => (
            <div
              key={idx}
              className={`flex max-w-[85%] flex-col ${
                chat.sender === "user"
                  ? "items-end self-end"
                  : "items-start self-start"
              }`}
            >
              <span className="mb-1 text-xs text-muted-foreground">
                {chat.sender === "user" ? "나" : "AI 비서"}
              </span>
              <div
                className={`rounded-2xl border p-3 leading-relaxed ${
                  chat.sender === "user"
                    ? "rounded-tr-none border-primary bg-primary text-primary-foreground"
                    : "rounded-tl-none border-border bg-muted/40 text-foreground"
                }`}
              >
                {chat.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="animate-pulse self-start text-xs text-muted-foreground">
              AI가 상권 통계 정보를 매칭 중입니다...
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              자주 묻는 질문
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetPrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={prompt.action}
                >
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendChat(chatInput)
            }}
            className="flex gap-2"
          >
            <Input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="상권이나 창업에 대해 질문해 보세요..."
              className="flex-1"
            />
            <Button type="submit" size="lg" className="px-3">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGenerateReport}
            className="w-full gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>상담 내용으로 리포트 작성</span>
          </Button>
        </CardFooter>
      </Card>

      {!isChatOpen && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setIsChatOpen(true)}
          className="absolute top-4 right-4 z-20 gap-1.5"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>AI 상담 비서</span>
        </Button>
      )}
    </div>
  )
}

export function DistrictMapScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-muted/30 text-xs text-muted-foreground">
          지도 분석 모듈 로드 중...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  )
}
