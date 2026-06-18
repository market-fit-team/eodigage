"use client"

import React, { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  Lock,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/features/startup/components/ui/button"
import { districtsData } from "@/features/startup/lib/data"

type SavedReport = {
  id: string
  title: string
  date: string
  avgSales: number
  survivalRate: number
  desc: string
}

function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const districtId = searchParams.get("district") || "gangnam"
  const district =
    districtsData.find((d) => d.id === districtId) || districtsData[0]
  const [chatNotes] = useState<string>(() => {
    if (typeof window === "undefined") {
      return ""
    }
    return localStorage.getItem("g15_temp_chat") || ""
  })
  const [isSaved, setIsSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const handleSaveReport = () => {
    const existingRaw = localStorage.getItem("g15_saved_reports")
    const reports: SavedReport[] = existingRaw ? JSON.parse(existingRaw) : []

    const isAlreadySaved = reports.some((report) => report.id === district.id)
    if (isAlreadySaved) {
      setSaveMessage("이미 마이페이지 보관함에 있습니다.")
      setTimeout(() => setSaveMessage(""), 2000)
      return
    }

    const newReport = {
      id: district.id,
      title: `${district.nameKo} 창업 분석 보고서`,
      date: new Date().toISOString().split("T")[0],
      avgSales: district.avgSales,
      survivalRate: district.survivalRate3Year,
      desc: district.desc,
    }

    reports.push(newReport)
    localStorage.setItem("g15_saved_reports", JSON.stringify(reports))
    setIsSaved(true)
    setSaveMessage("성공적으로 보관되었습니다!")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  const COLORS = ["#2563eb", "#bfdbfe"]

  return (
    <div className="flex-1 bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Controls */}
        <div className="mb-8 flex items-center justify-between text-xs font-semibold">
          <button
            onClick={() => router.back()}
            className="text-zinc-550 flex cursor-pointer items-center gap-1.5 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" /> 지도 탐색으로
          </button>

          <div className="relative flex items-center gap-2">
            {saveMessage && (
              <span className="absolute -top-8 right-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap text-white shadow-md">
                {saveMessage}
              </span>
            )}

            <Button
              variant="outline"
              onClick={handleSaveReport}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs"
            >
              <Bookmark
                className={`h-4 w-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`}
              />
              <span>리포트 저장</span>
            </Button>

            <Button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>PDF 출력 / 인쇄</span>
            </Button>
          </div>
        </div>

        {/* PRINTABLE SHEET CARD */}
        <div className="printable-sheet rounded-2xl border border-zinc-200/80 bg-white p-10 text-zinc-900 shadow-md sm:p-14">
          {/* Header */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b-2 border-zinc-900 pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2.5 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">
                종합 상권 보고서
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
                {district.nameKo} 상권 분석 결과서
              </h1>
            </div>
            <div className="text-right text-xs leading-relaxed font-medium text-zinc-400">
              <div className="flex items-center justify-end gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5" /> <span>2026-06-16</span>
              </div>
              <div className="font-mono">
                NO: G15-R-{district.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <section className="mb-10">
            <h2 className="text-zinc-450 border-zinc-150 mb-3.5 border-b pb-1.5 text-xs font-bold tracking-wider uppercase">
              1. 상권 기본 정보 (Executive Summary)
            </h2>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
              <p className="text-sm leading-relaxed text-zinc-600">
                본 정밀 분석 결과서는 서울특별시 주요 상업 지구인{" "}
                <strong>{district.nameKo}</strong>를 대상으로 집계되었습니다.
                {district.desc}이 지역의 평균 카드 결제 매출액 규모는{" "}
                <strong>{district.avgSales.toLocaleString()}만원</strong>이며,
                전년 동기 대비 <strong>{district.yoySalesChange}%</strong>{" "}
                수준으로 건강한 성장율을 지속하고 있습니다.
              </p>
            </div>
          </section>

          {/* Section 2: KPIs */}
          <section className="mb-10">
            <h2 className="text-zinc-450 border-zinc-150 mb-3.5 border-b pb-1.5 text-xs font-bold tracking-wider uppercase">
              2. 상권 재무 안전지표 (Financial Indicators)
            </h2>
            <div className="grid gap-4 text-xs sm:grid-cols-3 sm:text-sm">
              <div className="rounded-xl border border-zinc-200 bg-white p-4.5">
                <div className="text-zinc-450 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-bold">성장 추세</span>
                </div>
                <div className="text-lg font-bold text-zinc-900">
                  {district.yoySalesChange > 0
                    ? "성장형 (Positive)"
                    : "정체형 (Stable)"}
                </div>
                <p className="mt-1 text-[10px] leading-normal font-medium text-zinc-400">
                  평균 매출 증가치 {district.yoySalesChange}% 기록
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4.5">
                <div className="text-zinc-450 mb-1 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span className="font-bold">매출 규모 등급</span>
                </div>
                <div className="text-lg font-bold text-zinc-900">
                  {district.avgSales > 3500
                    ? "A 등급 (High Volume)"
                    : "B 등급 (Medium Volume)"}
                </div>
                <p className="mt-1 text-[10px] leading-normal font-medium text-zinc-400">
                  월평균 {district.avgSales.toLocaleString()}만원 수준
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4.5">
                <div className="text-zinc-450 mb-1 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="font-bold">F&B 3년 생존율</span>
                </div>
                <div className="text-lg font-bold text-zinc-900">
                  {district.survivalRate3Year}%
                </div>
                <p className="mt-1 text-[10px] leading-normal font-medium text-zinc-400">
                  일반 요식업 가맹점 기준
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Demographic Charts */}
          <section className="mb-10">
            <h2 className="text-zinc-450 border-zinc-150 mb-3.5 border-b pb-1.5 text-xs font-bold tracking-wider uppercase">
              3. 인구 통계 및 세대 비중 (Demographics)
            </h2>
            <div className="grid items-center gap-8 rounded-2xl border border-zinc-200 p-6 sm:grid-cols-2">
              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-xs font-bold text-zinc-700">
                  성별 유동 비율
                </h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={district.footTrafficGender}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {district.footTrafficGender.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex gap-4 font-mono text-xs font-bold">
                  {district.footTrafficGender.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded"
                        style={{ backgroundColor: COLORS[idx] }}
                      ></span>
                      <span>
                        {g.name}: {g.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-xs font-bold text-zinc-700">
                  세대별 분포 비중
                </h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={district.footTrafficAge}
                      margin={{ bottom: 5 }}
                    >
                      <XAxis
                        dataKey="ageGroup"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#666", fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Tooltip />
                      <Bar
                        dataKey="percentage"
                        fill="#2563eb"
                        radius={4}
                        name="비중 (%)"
                      >
                        {district.footTrafficAge.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.percentage > 35 ? "#2563eb" : "#e4e4e7"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Recommended Franchises */}
          <section className="mb-10">
            <h2 className="text-zinc-450 border-zinc-150 mb-3.5 border-b pb-1.5 text-xs font-bold tracking-wider uppercase">
              4. 추천 입점 가맹사 시뮬레이션 (Franchises)
            </h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="text-zinc-550 border-b border-zinc-200 bg-zinc-50 font-bold">
                  <tr>
                    <th className="p-3.5">가맹 브랜드명</th>
                    <th className="p-3.5">업종 대분류</th>
                    <th className="p-3.5">개설 자금 (만원)</th>
                    <th className="p-3.5">상권 평점</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {district.recommendedFranchises.map((brand, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/40">
                      <td className="p-3.5 font-bold text-zinc-900">
                        {brand.name}
                      </td>
                      <td className="p-3.5">{brand.sector}</td>
                      <td className="p-3.5 font-mono">
                        {brand.minCapital.toLocaleString()}만원
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        ★ {brand.rating} / 5.0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: AI Notes & RAG legal warnings */}
          <section className="mb-4">
            <h2 className="text-zinc-450 border-zinc-150 mb-3.5 border-b pb-1.5 text-xs font-bold tracking-wider uppercase">
              5. AI 정밀 피드백 및 법률 특이사항 (AI & Legal Checklist)
            </h2>
            <div className="flex flex-col gap-4">
              {chatNotes && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-4.5">
                  <h4 className="mb-2 flex items-center gap-1 text-xs font-bold text-zinc-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    컨설턴트 질의 요약 (Recent Chats)
                  </h4>
                  <pre className="text-zinc-650 font-sans text-xs leading-relaxed whitespace-pre-line">
                    {chatNotes}
                  </pre>
                </div>
              )}

              <div className="rounded-xl border border-blue-100 bg-blue-50/10 p-4.5 text-xs">
                <h4 className="mb-2 flex items-center gap-1.5 font-bold text-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  RAG 상가건물 임대차 계약 요율 안전선
                </h4>
                <ul className="list-inside list-disc space-y-2 text-zinc-600">
                  <li>
                    <strong>환산보증금 9억원 한도제한</strong>: 본 구역은
                    서울시에 소속되어 환산보증금 상한 한도액 9억원의 적용을
                    받습니다. 임대차 보증금 비율을 산정할 때 반드시 초과 여부를
                    계산하시어 계약 갱신 보호 권리에 차질이 없도록 조율하시기
                    바랍니다.
                  </li>
                  <li>
                    <strong>권리금 보호장치</strong>: 계약 완료 6개월 전부터
                    신규 임차인 주선을 방해받지 않는 권리금 조회가 유효합니다.
                  </li>
                  <li>
                    <strong>정책자금 융자 지원</strong>: 중소기업벤처부
                    소상공인진흥공단의 분기별 저금리 융자 자금은 신규 매장 개설
                    3개월 내 사업자등록 완료 시 승인율이 우수합니다.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export function ReportScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-zinc-50 font-mono text-xs text-zinc-400">
          보고서 작성 중...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  )
}
