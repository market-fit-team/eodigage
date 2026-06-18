"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calculator,
  Calendar,
  CheckSquare,
  Coins,
  FileCode,
  FileText,
  Flame,
  Trash2,
} from "lucide-react"
import { Button } from "@/features/startup/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/startup/components/ui/card"
import { personaResults } from "@/features/startup/lib/data"

interface SavedReport {
  id: string
  title: string
  date: string
  avgSales: number
  survivalRate: number
  desc: string
}

export function MypageScreen() {
  const [userPersona, setUserPersona] = useState<string | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  // Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  })

  // Calculators state
  const [creditScore, setCreditScore] = useState<number>(750)
  const [desiredLoan, setDesiredLoan] = useState<number>(5000) // 만 원
  const [shopArea, setShopArea] = useState<number>(15) // 평
  const [sectorType, setSectorType] = useState<string>("cafe")

  useEffect(() => {
    // Load persona
    const savedPersona = localStorage.getItem("g15_persona")
    if (savedPersona && personaResults[savedPersona]) {
      setUserPersona(savedPersona)
    }

    // Load reports
    const existingRaw = localStorage.getItem("g15_saved_reports")
    if (existingRaw) {
      setSavedReports(JSON.parse(existingRaw))
    }
  }, [])

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = savedReports.filter((r) => r.id !== id)
    setSavedReports(updated)
    localStorage.setItem("g15_saved_reports", JSON.stringify(updated))
  }

  const handleToggleChecklist = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const calcLoanLimit = () => {
    let factor = 10
    if (creditScore > 900) factor = 18
    else if (creditScore > 800) factor = 14
    else if (creditScore > 700) factor = 10
    else factor = 5

    const limit = creditScore * factor
    const rate = Math.max(3.2, 8.5 - (creditScore - 500) * 0.01).toFixed(2)

    return {
      limit: Math.min(desiredLoan, Math.round(limit)),
      rate,
    }
  }

  const calcInsurance = () => {
    let baseRate = 1200
    if (sectorType === "pub") baseRate = 2200
    else if (sectorType === "restaurant") baseRate = 1800

    const monthlyPremium = Math.round(shopArea * baseRate)
    const liabilityCoverage = 15000

    return {
      premium: monthlyPremium.toLocaleString(),
      coverage: liabilityCoverage.toLocaleString(),
    }
  }

  const personaInfo = userPersona ? personaResults[userPersona] : null
  const loanResult = calcLoanLimit()
  const insuranceResult = calcInsurance()

  return (
    <div className="flex-1 bg-zinc-50 px-4 py-12 text-zinc-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              마이 대시보드
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              수집한 AI 상권 분석 보고서 목록과 개인 창업 단계를 체계적으로
              모니터링합니다.
            </p>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">
            Enterprise Station
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main sections */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Saved Reports */}
            <Card className="border border-zinc-200/80 shadow-sm">
              <CardHeader className="bg-zinc-50/50">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-zinc-950">
                    보관된 AI 보고서 폴더
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-zinc-400">
                  지도 분석 단계에서 보관한 상세 상권 보고서 목록입니다. 언제든
                  다시 열람할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {savedReports.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/30 py-12 text-center">
                    <FileCode className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-500">
                      보관된 상권 리포트가 존재하지 않습니다.
                    </p>
                    <Link href="/map" className="mt-4 inline-block">
                      <Button className="rounded-lg px-4 py-2 text-xs font-semibold">
                        지도에서 상권 분석하기
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {savedReports.map((report) => (
                      <Link
                        key={report.id}
                        href={`/report?district=${report.id}`}
                        className="group relative block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-150 hover:border-blue-600"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600">
                            <FileText className="h-6 w-6" />
                          </div>

                          <div className="min-w-0 flex-1 pr-6">
                            <span className="block truncate text-sm font-bold text-zinc-900 transition-colors group-hover:text-blue-600">
                              {report.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-medium text-zinc-400">
                              발행일: {report.date}
                            </span>

                            <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-2 font-mono text-[10px]">
                              <div>
                                <span className="block font-sans text-[8px] font-medium text-zinc-400">
                                  월평균 매출
                                </span>
                                <span className="font-bold text-zinc-800">
                                  {report.avgSales.toLocaleString()}만원
                                </span>
                              </div>
                              <div>
                                <span className="block font-sans text-[8px] font-medium text-zinc-400">
                                  3년 생존율
                                </span>
                                <span className="font-bold text-emerald-600">
                                  {report.survivalRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteReport(report.id, e)}
                          className="absolute top-4.5 right-4.5 cursor-pointer rounded border border-transparent p-1 text-zinc-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checklist & Timelines */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Checklist */}
              <Card className="border border-zinc-200/80 shadow-sm">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 p-5">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-zinc-950">
                      개업 실무 체크리스트
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5 p-5">
                  {[
                    {
                      key: "step1",
                      text: "상권 빅데이터 비교 및 업종 적합도 결정",
                    },
                    {
                      key: "step2",
                      text: "점포 임대차 환산보증금 요율 보호선 확인",
                    },
                    {
                      key: "step3",
                      text: "서민 소상공인 정책 대출 금리 심사 신청",
                    },
                    {
                      key: "step4",
                      text: "사업자등록 신고 및 점포 전용 통장 발급",
                    },
                    { key: "step5", text: "화재 안전 보험 설계 요율 산출" },
                    {
                      key: "step6",
                      text: "위생 교육 수료증 및 영업 허가증 접수",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-100/50 p-2 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key]}
                        onChange={() => handleToggleChecklist(item.key)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={`text-xs leading-relaxed font-semibold ${
                          checklist[item.key]
                            ? "text-zinc-400 line-through"
                            : "text-zinc-700"
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Schedule Timeline */}
              <Card className="border border-zinc-200/80 shadow-sm">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 p-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-zinc-950">
                      창업 단계별 마일스톤 일정
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-5 text-xs">
                  <div className="border-l-2 border-blue-600 py-0.5 pl-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-400">
                      D-30: 예산 설계
                    </span>
                    <p className="font-bold text-zinc-800">
                      창업 기금 한도 산정 및 보증서 발급 상담 완료
                    </p>
                  </div>
                  <div className="border-l-2 border-blue-600 py-0.5 pl-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-400">
                      D-20: 점포 계약
                    </span>
                    <p className="font-bold text-zinc-800">
                      핵심 상권 권리금 보호선 협상 및 부동산 임대 서명
                    </p>
                  </div>
                  <div className="border-l-2 border-zinc-200 py-0.5 pl-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-400">
                      D-15: 도면 실측
                    </span>
                    <p className="font-bold text-zinc-500">
                      인테리어 소방 시설물 규격 도면 배치 실측
                    </p>
                  </div>
                  <div className="border-l-2 border-zinc-200 py-0.5 pl-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-400">
                      D-5: 가맹사 발주
                    </span>
                    <p className="font-bold text-zinc-500">
                      가맹사 원자재 발주 및 위생설비 점검 입고
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-8">
            {/* User Profile Summary */}
            <Card className="overflow-hidden border border-zinc-200 shadow-sm">
              <CardHeader className="bg-blue-600 p-5 text-white">
                <span className="text-[9px] font-bold tracking-wider text-blue-100 uppercase">
                  나의 창업 성향 타워
                </span>
                <CardTitle className="mt-1 text-base font-extrabold">
                  {personaInfo ? personaInfo.title : "등록된 성향이 없습니다"}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 text-xs leading-relaxed text-zinc-600">
                {personaInfo ? (
                  <>
                    <p className="mb-4 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5">
                      {personaInfo.desc}
                    </p>

                    <h4 className="mb-1.5 font-bold text-zinc-900">
                      추천 매칭 업종
                    </h4>
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {personaInfo.recommendedSectors.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <Link href="/onboarding" className="mt-2 block text-center">
                      <Button
                        variant="outline"
                        className="w-full rounded-lg py-2 text-xs font-bold"
                      >
                        성향 분석 다시하기
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <p className="mb-4 leading-normal text-zinc-500">
                      성향 테스트를 이수하시면 가맹 브랜드 및 상권 후보군 추천이
                      자동으로 갱신됩니다.
                    </p>
                    <Link href="/onboarding" className="block">
                      <Button className="w-full rounded-lg py-2.5 text-xs font-bold">
                        테스트 시작하기
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Simulator */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardHeader className="bg-zinc-50/50">
                <div className="flex items-center gap-1.5">
                  <Calculator className="h-4.5 w-4.5 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-zinc-950">
                    창업 실무 시뮬레이터
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-6 p-5 text-xs">
                {/* Loan Estimator */}
                <div className="border-b border-zinc-100 pb-5 font-medium">
                  <h4 className="mb-3 flex items-center gap-1 font-bold text-zinc-900">
                    <Coins className="h-4 w-4 text-blue-600" />
                    1. 정책 보증 한도 계산
                  </h4>

                  <div className="flex flex-col gap-3 font-mono">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>희망 융자액:</span>
                        <span className="text-zinc-850 font-bold">
                          {desiredLoan.toLocaleString()}만 원
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="20000"
                        step="1000"
                        value={desiredLoan}
                        onChange={(e) => setDesiredLoan(Number(e.target.value))}
                        className="w-full cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>신용점수 평점:</span>
                        <span className="text-zinc-850 font-bold">
                          {creditScore}점
                        </span>
                      </div>
                      <input
                        type="range"
                        min="400"
                        max="1000"
                        step="10"
                        value={creditScore}
                        onChange={(e) => setCreditScore(Number(e.target.value))}
                        className="w-full cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-sans text-[11px]">
                      <div>
                        <span className="block text-[8px] font-medium text-zinc-400">
                          예상 한도
                        </span>
                        <span className="font-extrabold text-zinc-900">
                          {loanResult.limit.toLocaleString()}만 원
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-medium text-zinc-400">
                          우대 금리
                        </span>
                        <span className="font-extrabold text-blue-600">
                          연 {loanResult.rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Estimator */}
                <div className="font-medium">
                  <h4 className="mb-3 flex items-center gap-1 font-bold text-zinc-900">
                    <Flame className="h-4 w-4 text-red-500" />
                    2. 화재 안심 공제료 계산
                  </h4>

                  <div className="flex flex-col gap-3 font-mono">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-450 mb-1 block font-sans text-[9px] font-bold">
                          실평수 (평)
                        </label>
                        <input
                          type="number"
                          value={shopArea}
                          onChange={(e) =>
                            setShopArea(Math.max(1, Number(e.target.value)))
                          }
                          className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-800 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-450 mb-1 block font-sans text-[9px] font-bold">
                          점포 세부 업종
                        </label>
                        <select
                          value={sectorType}
                          onChange={(e) => setSectorType(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-800 focus:border-blue-600 focus:outline-none"
                        >
                          <option value="cafe">일반 카페 / 커피숍</option>
                          <option value="restaurant">가스 사용 요식업</option>
                          <option value="pub">주점 / 요리대폿집</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-sans text-[11px]">
                      <div>
                        <span className="block text-[8px] font-medium text-zinc-400">
                          예상 공제료
                        </span>
                        <span className="font-extrabold text-zinc-900">
                          월 {insuranceResult.premium} 원
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-medium text-zinc-400">
                          최대 보장액
                        </span>
                        <span className="font-extrabold text-emerald-600">
                          {insuranceResult.coverage}만 원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
