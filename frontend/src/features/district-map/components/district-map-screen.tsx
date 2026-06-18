"use client"

import React, { Suspense, useEffect, useState } from "react"
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/features/startup/components/ui/button"
import {
  type DistrictData,
  districtsData,
  personaResults,
} from "@/features/startup/lib/data"

function MapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaQuery = searchParams.get("persona")

  // State Variables
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<
    "sectors" | "demographics" | "traffic"
  >("traffic")

  // Left Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [budgetRange, setBudgetRange] = useState<string>("all")
  const [targetDemographic, setTargetDemographic] = useState<string>("all")
  const [recommendationsOnly, setRecommendationsOnly] = useState(false)

  // Right Chat State
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

  // Onboarding Persona state
  const [userPersona, setUserPersona] = useState<string | null>(null)

  useEffect(() => {
    // Load persona
    const persona = personaQuery || localStorage.getItem("g15_persona")
    if (persona) {
      setUserPersona(persona)
      setRecommendationsOnly(true)
      const pInfo = personaResults[persona]
      if (pInfo && pInfo.recommendedDistricts.length > 0) {
        const matchingDist = districtsData.find(
          (d) => d.id === pInfo.recommendedDistricts[0]
        )
        if (matchingDist) {
          setSelectedDistrict(matchingDist)
        }
      }
    } else {
      setSelectedDistrict(districtsData[0])
    }
  }, [personaQuery])

  // Select district
  const handleSelectDistrict = (district: DistrictData) => {
    setSelectedDistrict(district)

    // Greeting
    const welcomeMsg = {
      sender: "ai" as const,
      text: `[${district.nameKo}] 상권을 분석합니다. 월평균 매출은 ${district.avgSales.toLocaleString()}만원 이고, 3년 F&B 생존율은 ${district.survivalRate3Year}% 입니다. 더 상세히 알고 싶은 부분(피크 타임, 연령 비중, 프랜차이즈 후보군)을 말씀해 주시면 안내해 드릴게요!`,
    }
    setChatHistory((prev) => [...prev, welcomeMsg])
  }

  // Filter districts
  const filteredDistricts = districtsData.filter((dist) => {
    if (selectedCategory !== "all") {
      const hasSector = dist.topSectors.some((s) =>
        s.sector.includes(selectedCategory)
      )
      if (!hasSector) return false
    }
    if (budgetRange !== "all") {
      if (budgetRange === "low" && dist.avgSales > 3000) return false
      if (budgetRange === "high" && dist.avgSales < 3500) return false
    }
    if (recommendationsOnly && userPersona) {
      const pInfo = personaResults[userPersona]
      if (pInfo && !pInfo.recommendedDistricts.includes(dist.id)) return false
    }
    return true
  })

  // AI Chat simulation
  const handleSendChat = (text: string) => {
    if (!text.trim()) return

    const userMsg = { sender: "user" as const, text }
    setChatHistory((prev) => [...prev, userMsg])
    setChatInput("")
    setIsTyping(true)

    setTimeout(() => {
      let aiText = ""
      const distName = selectedDistrict ? selectedDistrict.nameKo : "해당 상권"

      const q = text.toLowerCase()
      if (q.includes("매출") || q.includes("돈")) {
        aiText = `${distName}의 최근 카드사 결제 정보를 분석하면 주말 매출 점유율이 42.1%로 높으며, 식음료 매장당 월평균 결제 단가는 24,500원선으로 안정적인 성장을 기록 중입니다.`
      } else if (
        q.includes("생존") ||
        q.includes("폐업") ||
        q.includes("위험")
      ) {
        aiText = `${distName}의 3년차 가맹점 생존율은 ${selectedDistrict?.survivalRate3Year}%로 양호한 편이나, 특정 커피 전문점 브랜드들이 과포화 상태이므로 차별화된 F&B 아이템 선정이 필요합니다.`
      } else if (q.includes("추천") || q.includes("프랜차이즈")) {
        const brands = selectedDistrict?.recommendedFranchises
          .map((f) => f.name)
          .join(", ")
        aiText = `${distName}의 매출 연령 비중상 [ ${brands} ] 가맹점이 적합도가 높으며, 초기 창업 비용은 최소 입점 비용과 권리금을 조율할 필요가 있습니다.`
      } else {
        aiText = `입력하신 창업 실무 조언을 소상공인 정책 대출 및 화재 보험 보장 요율 데이터베이스와 결합하여 검토한 결과, ${distName}은 주중 직장인과 주말 2030 유동층이 조화를 이루는 비즈니스 구조를 띄고 있어 리스크가 낮습니다.`
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
    if (!selectedDistrict) return

    const chatSummaries = chatHistory
      .filter((c) => c.sender === "user" || c.sender === "ai")
      .map((c) => `${c.sender === "user" ? "Q:" : "A:"} ${c.text}`)
      .slice(-4)
      .join("\n")

    localStorage.setItem("g15_temp_chat", chatSummaries)
    router.push(`/report?district=${selectedDistrict.id}`)
  }

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-zinc-100/70">
      {/* 1. LEFT FILTER PANE (Floating) */}
      <div
        className={`absolute top-4 bottom-4 left-4 z-20 flex w-80 flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-transform duration-300 ${
          isFilterOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]"
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
              <Filter className="h-4 w-4 text-blue-600" />
              <span>상권 탐색 필터</span>
            </div>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="cursor-pointer p-1 text-zinc-400 transition-colors hover:text-zinc-950"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex flex-col gap-5 p-5 text-xs">
            {/* User Tower Profile Link */}
            {userPersona ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wide text-blue-600 uppercase">
                    나의 유저 타워 로드됨
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem("g15_persona")
                      setUserPersona(null)
                      setRecommendationsOnly(false)
                    }}
                    className="text-[10px] text-zinc-400 underline hover:text-blue-600"
                  >
                    해제
                  </button>
                </div>
                <p className="leading-snug font-bold text-zinc-900">
                  {personaResults[userPersona]?.title}
                </p>

                <label className="mt-2.5 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={recommendationsOnly}
                    onChange={(e) => setRecommendationsOnly(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-zinc-650 text-[11px] font-medium">
                    추천 상권만 지도에 표시
                  </span>
                </label>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-4 text-center">
                <p className="mb-2 leading-relaxed text-zinc-500">
                  성향 온보딩 분석을 하시면 어울리는 행정동 상권 정보가 자동
                  로드됩니다.
                </p>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-0.5 font-bold text-blue-600 hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> 성향 분석하기
                </Link>
              </div>
            )}

            {/* Sector Category */}
            <div>
              <label className="text-zinc-450 mb-1.5 block font-bold tracking-wide">
                창업 희망 업종
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">전체 업종</option>
                <option value="커피">커피 및 디저트 카페</option>
                <option value="일식">일식 전문점 / 이자카야</option>
                <option value="한식">한식 밥집 / 요리주점</option>
                <option value="아시안">아시안 푸드 / 마라탕</option>
                <option value="스튜디오">셀프 스튜디오 / 사진관</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="text-zinc-455 mb-1.5 block font-bold tracking-wide">
                자본금 규모
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {["all", "low", "high"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setBudgetRange(type)}
                    className={`cursor-pointer rounded-lg border p-2 text-xs font-semibold transition-colors ${
                      budgetRange === type
                        ? "border-blue-600 bg-blue-50/30 font-bold text-blue-600"
                        : "text-zinc-650 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {type === "all"
                      ? "전체"
                      : type === "low"
                        ? "소자본"
                        : "여유"}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Age */}
            <div>
              <label className="text-zinc-450 mb-1.5 block font-bold tracking-wide">
                핵심 타겟 연령층
              </label>
              <select
                value={targetDemographic}
                onChange={(e) => setTargetDemographic(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">전체 연령</option>
                <option value="20">20대 위주 (대학생/관광객)</option>
                <option value="30">30대 위주 (직장인/오피스)</option>
                <option value="50">40대 이상 (전통시장/주거지역)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-zinc-150 flex items-center justify-between border-t bg-zinc-50 p-4 text-xs font-medium text-zinc-400">
          <span>검색: {filteredDistricts.length}개 지역</span>
          <button
            onClick={() => {
              setSelectedCategory("all")
              setBudgetRange("all")
              setTargetDemographic("all")
              setRecommendationsOnly(false)
            }}
            className="text-blue-650 cursor-pointer font-bold hover:underline"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* FILTER TOGGLE BUTTON */}
      {!isFilterOpen && (
        <button
          onClick={() => setIsFilterOpen(true)}
          className="absolute top-4 left-4 z-20 flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-md transition-colors hover:bg-zinc-50"
        >
          <Filter className="h-4 w-4 text-blue-600" />
          <span>필터 열기</span>
        </button>
      )}

      {/* 2. INTERACTIVE MAP CANVAS (CENTER) */}
      <div className="relative flex h-full flex-1 items-center justify-center bg-zinc-50/50 select-none">
        <svg
          viewBox="0 0 800 500"
          className="h-full max-h-[85vh] w-full p-4 text-xs font-semibold"
        >
          {/* Grid lines */}
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
                stroke="rgba(0,0,0,0.025)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          {/* Stylized Han River */}
          <path
            d="M 50,300 Q 150,280 250,280 T 450,320 T 650,270 T 750,290"
            fill="none"
            stroke="#eff6ff"
            strokeWidth="38"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 50,300 Q 150,280 250,280 T 450,320 T 650,270 T 750,290"
            fill="none"
            stroke="#dbeafe"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.95"
          />
          <text
            x="350"
            y="305"
            fill="#2563eb"
            opacity="0.25"
            className="text-[10px] font-bold tracking-widest italic"
          >
            Han River
          </text>

          {/* District: Mapo (Hongdae) */}
          <g
            onClick={() => handleSelectDistrict(districtsData[1])}
            className="group cursor-pointer"
          >
            <polygon
              points="145,155 255,135 235,235 125,215"
              fill={
                selectedDistrict?.id === "mapo"
                  ? "#1e293b"
                  : filteredDistricts.some((d) => d.id === "mapo")
                    ? "#ffffff"
                    : "#f4f4f5"
              }
              stroke={selectedDistrict?.id === "mapo" ? "#2563eb" : "#e4e4e7"}
              strokeWidth={selectedDistrict?.id === "mapo" ? 2.5 : 1}
              className="transition-all duration-300 group-hover:fill-zinc-50"
            />
            {userPersona &&
              personaResults[userPersona]?.recommendedDistricts.includes(
                "mapo"
              ) && (
                <circle
                  cx="180"
                  cy="170"
                  r="4"
                  fill="#2563eb"
                  className="animate-pulse"
                />
              )}
            <text
              x="175"
              y="185"
              fill={selectedDistrict?.id === "mapo" ? "#ffffff" : "#1f2937"}
              className="pointer-events-none text-xs font-bold"
            >
              홍대·합정 상권
            </text>
            <text
              x="175"
              y="200"
              fill={selectedDistrict?.id === "mapo" ? "#94a3b8" : "#9ca3af"}
              className="pointer-events-none font-mono text-[9px]"
            >
              3,120만원
            </text>
          </g>

          {/* District: Jongno */}
          <g
            onClick={() => handleSelectDistrict(districtsData[3])}
            className="group cursor-pointer"
          >
            <polygon
              points="295,95 435,85 405,175 275,175"
              fill={
                selectedDistrict?.id === "jongno"
                  ? "#1e293b"
                  : filteredDistricts.some((d) => d.id === "jongno")
                    ? "#ffffff"
                    : "#f4f4f5"
              }
              stroke={selectedDistrict?.id === "jongno" ? "#2563eb" : "#e4e4e7"}
              strokeWidth={selectedDistrict?.id === "jongno" ? 2.5 : 1}
              className="transition-all duration-300 group-hover:fill-zinc-50"
            />
            {userPersona &&
              personaResults[userPersona]?.recommendedDistricts.includes(
                "jongno"
              ) && (
                <circle
                  cx="345"
                  cy="125"
                  r="4"
                  fill="#2563eb"
                  className="animate-pulse"
                />
              )}
            <text
              x="335"
              y="135"
              fill={selectedDistrict?.id === "jongno" ? "#ffffff" : "#1f2937"}
              className="pointer-events-none text-xs font-bold"
            >
              종로3가 상권
            </text>
            <text
              x="335"
              y="150"
              fill={selectedDistrict?.id === "jongno" ? "#94a3b8" : "#9ca3af"}
              className="pointer-events-none font-mono text-[9px]"
            >
              3,400만원
            </text>
          </g>

          {/* District: Seongdong (Seongsu) */}
          <g
            onClick={() => handleSelectDistrict(districtsData[2])}
            className="group cursor-pointer"
          >
            <polygon
              points="485,115 625,125 605,215 465,195"
              fill={
                selectedDistrict?.id === "seongdong"
                  ? "#1e293b"
                  : filteredDistricts.some((d) => d.id === "seongdong")
                    ? "#ffffff"
                    : "#f4f4f5"
              }
              stroke={
                selectedDistrict?.id === "seongdong" ? "#2563eb" : "#e4e4e7"
              }
              strokeWidth={selectedDistrict?.id === "seongdong" ? 2.5 : 1}
              className="transition-all duration-300 group-hover:fill-zinc-50"
            />
            {userPersona &&
              personaResults[userPersona]?.recommendedDistricts.includes(
                "seongdong"
              ) && (
                <circle
                  cx="535"
                  cy="150"
                  r="4"
                  fill="#2563eb"
                  className="animate-pulse"
                />
              )}
            <text
              x="525"
              y="155"
              fill={
                selectedDistrict?.id === "seongdong" ? "#ffffff" : "#1f2937"
              }
              className="pointer-events-none text-xs font-bold"
            >
              성수역 상권
            </text>
            <text
              x="525"
              y="170"
              fill={
                selectedDistrict?.id === "seongdong" ? "#94a3b8" : "#9ca3af"
              }
              className="pointer-events-none font-mono text-[9px]"
            >
              3,950만원
            </text>
          </g>

          {/* District: Itaewon */}
          <g
            onClick={() => handleSelectDistrict(districtsData[4])}
            className="group cursor-pointer"
          >
            <polygon
              points="305,205 415,205 435,285 315,295"
              fill={
                selectedDistrict?.id === "itaewon"
                  ? "#1e293b"
                  : filteredDistricts.some((d) => d.id === "itaewon")
                    ? "#ffffff"
                    : "#f4f4f5"
              }
              stroke={
                selectedDistrict?.id === "itaewon" ? "#2563eb" : "#e4e4e7"
              }
              strokeWidth={selectedDistrict?.id === "itaewon" ? 2.5 : 1}
              className="transition-all duration-300 group-hover:fill-zinc-50"
            />
            {userPersona &&
              personaResults[userPersona]?.recommendedDistricts.includes(
                "itaewon"
              ) && (
                <circle
                  cx="365"
                  cy="240"
                  r="4"
                  fill="#2563eb"
                  className="animate-pulse"
                />
              )}
            <text
              x="355"
              y="245"
              fill={selectedDistrict?.id === "itaewon" ? "#ffffff" : "#1f2937"}
              className="pointer-events-none text-xs font-bold"
            >
              이태원 상권
            </text>
            <text
              x="355"
              y="260"
              fill={selectedDistrict?.id === "itaewon" ? "#94a3b8" : "#9ca3af"}
              className="pointer-events-none font-mono text-[9px]"
            >
              2,750만원
            </text>
          </g>

          {/* District: Gangnam */}
          <g
            onClick={() => handleSelectDistrict(districtsData[0])}
            className="group cursor-pointer"
          >
            <polygon
              points="485,325 635,315 615,425 465,415"
              fill={
                selectedDistrict?.id === "gangnam"
                  ? "#1e293b"
                  : filteredDistricts.some((d) => d.id === "gangnam")
                    ? "#ffffff"
                    : "#f4f4f5"
              }
              stroke={
                selectedDistrict?.id === "gangnam" ? "#2563eb" : "#e4e4e7"
              }
              strokeWidth={selectedDistrict?.id === "gangnam" ? 2.5 : 1}
              className="transition-all duration-300 group-hover:fill-zinc-50"
            />
            {userPersona &&
              personaResults[userPersona]?.recommendedDistricts.includes(
                "gangnam"
              ) && (
                <circle
                  cx="545"
                  cy="360"
                  r="4"
                  fill="#2563eb"
                  className="animate-pulse"
                />
              )}
            <text
              x="535"
              y="365"
              fill={selectedDistrict?.id === "gangnam" ? "#ffffff" : "#1f2937"}
              className="pointer-events-none text-xs font-bold"
            >
              강남역 상권
            </text>
            <text
              x="535"
              y="380"
              fill={selectedDistrict?.id === "gangnam" ? "#94a3b8" : "#9ca3af"}
              className="pointer-events-none font-mono text-[9px]"
            >
              4,850만원
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2.5 rounded-xl border border-zinc-200/80 bg-white/95 p-4 text-xs text-zinc-500 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-4 rounded border border-[#2563eb] bg-[#1e293b]"></span>
            <span>선택된 상권</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border-zinc-250 h-2.5 w-4 rounded border bg-white"></span>
            <span>필터 조건 충족</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-4 rounded border border-zinc-200 bg-zinc-100"></span>
            <span>기타 상권</span>
          </div>
          {userPersona && (
            <div className="flex items-center gap-2 border-t border-zinc-100 pt-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600"></span>
              <span className="text-[10px] font-bold text-blue-600">
                내 성향 추천 상권
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. FLOATING DETAILS CARD (BOTTOM CENTER) */}
      {selectedDistrict && (
        <div className="absolute right-0 bottom-4 left-80 z-10 px-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg md:flex-row">
            {/* Left summary */}
            <div className="flex flex-col justify-between border-r border-zinc-100/80 pr-6 md:w-1/3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900">
                    {selectedDistrict.nameKo}
                  </h3>
                  <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-400">
                    {selectedDistrict.nameEn}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {selectedDistrict.desc}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3.5 font-mono text-xs">
                <div>
                  <span className="block font-sans text-[9px] font-medium text-zinc-400">
                    월평균 매출
                  </span>
                  <span className="text-base font-bold text-zinc-900">
                    {selectedDistrict.avgSales.toLocaleString()}만원
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-600">
                    +{selectedDistrict.yoySalesChange}% YoY
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-[9px] font-medium text-zinc-400">
                    3년 생존률
                  </span>
                  <span className="text-base font-bold text-zinc-900">
                    {selectedDistrict.survivalRate3Year}%
                  </span>
                  <span className="block text-[10px] text-zinc-400">
                    밀집도: {selectedDistrict.densityScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Right Tab charts */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="mb-3.5 flex gap-4 border-b border-zinc-100 pb-2 text-xs font-semibold">
                {[
                  { id: "traffic", label: "시간대 유동인구" },
                  { id: "demographics", label: "연령분포" },
                  { id: "sectors", label: "밀집 업종/생존율" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as "traffic" | "demographics" | "sectors"
                      )
                    }
                    className={`cursor-pointer pb-1 transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-blue-600 font-bold text-blue-600"
                        : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="h-32 w-full text-xs">
                {activeTab === "traffic" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedDistrict.footTrafficHourly}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f4f4f5"
                      />
                      <XAxis
                        dataKey="hour"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#888", fontSize: 10 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#888", fontSize: 10 }}
                        width={25}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="traffic"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="유동인구 (천명)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "demographics" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedDistrict.footTrafficAge}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f4f4f5"
                      />
                      <XAxis
                        dataKey="ageGroup"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#888", fontSize: 10 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#888", fontSize: 10 }}
                        width={25}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="percentage"
                        fill="#2563eb"
                        radius={4}
                        name="비중 (%)"
                      >
                        {selectedDistrict.footTrafficAge.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.percentage > 35 ? "#2563eb" : "#e4e4e7"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "sectors" && (
                  <div className="grid h-full grid-cols-2 gap-3 overflow-y-auto">
                    {selectedDistrict.topSectors.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2.5"
                      >
                        <div>
                          <span className="block font-bold text-zinc-900">
                            {s.sector}
                          </span>
                          <span className="block text-[10px] text-zinc-400">
                            경쟁강도: {s.density}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-emerald-600">
                            {s.survivalRate}%
                          </span>
                          <span className="block text-[9px] font-medium text-zinc-400">
                            3년 생존율
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  AI 컨설턴트와의 면담 내용을 기반으로 상세 리포트를 설계합니다.
                </span>

                <Button
                  onClick={handleGenerateReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                >
                  <FileText className="h-4 w-4" /> AI 상권 리포트 생성
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RIGHT SIDEBAR: AI Chat Panel (Collapsible) */}
      <div
        className={`absolute top-4 right-4 bottom-4 z-20 flex w-80 flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-[calc(100%+16px)]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 p-4">
          <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>AI 상권 분석 상담원</span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="cursor-pointer p-1 text-zinc-400 transition-colors hover:text-zinc-950"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 text-xs">
          {chatHistory.map((chat, idx) => (
            <div
              key={idx}
              className={`flex max-w-[85%] flex-col ${
                chat.sender === "user"
                  ? "items-end self-end"
                  : "items-start self-start"
              }`}
            >
              <span className="mb-1 text-[9px] font-medium text-zinc-400">
                {chat.sender === "user" ? "나" : "AI 비서"}
              </span>
              <div
                className={`rounded-2xl border p-3 leading-relaxed ${
                  chat.sender === "user"
                    ? "rounded-tr-none border-blue-600 bg-blue-600 text-white"
                    : "rounded-tl-none border-zinc-200/80 bg-zinc-50 text-zinc-800"
                }`}
              >
                {chat.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-zinc-450 animate-pulse self-start text-[10px] font-medium">
              AI가 상권 통계 정보를 매칭 중입니다...
            </div>
          )}
        </div>

        {/* Input panel */}
        <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/50 p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-450 text-[10px] font-bold">
              자주 묻는 질문
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={p.action}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-left text-[10px] text-zinc-600 transition-colors hover:border-blue-600 hover:text-blue-600"
                >
                  {p.text}
                </button>
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
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="상권이나 창업에 대해 질문해 보세요..."
              className="flex-1 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 focus:border-blue-600 focus:outline-none"
            />
            <Button
              type="submit"
              className="shrink-0 rounded-lg bg-blue-600 p-2.5 text-white hover:bg-blue-700"
            >
              전송
            </Button>
          </form>

          <button
            onClick={handleGenerateReport}
            className="text-zinc-850 mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs font-bold transition-colors hover:bg-zinc-50"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>상담 내용으로 리포트 작성</span>
          </button>
        </div>
      </div>

      {/* CHAT TOGGLE BUTTON */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute top-4 right-4 z-20 flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-md transition-colors hover:bg-zinc-50"
        >
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span>AI 상담 비서</span>
        </button>
      )}
    </div>
  )
}

export function DistrictMapScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-zinc-50 font-mono text-xs text-zinc-400">
          지도 분석 모듈 로드 중...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  )
}
