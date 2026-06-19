"use client"

import React, { useState } from "react"
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
import { personaResults } from "@/features/startup/lib/data"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/components/ui/native-select"
import { Slider } from "@/shared/components/ui/slider"
import { cn } from "@/shared/lib/utils"

type SavedReport = {
  id: string
  title: string
  date: string
  avgSales: number
  survivalRate: number
  desc: string
}

const checklistItems = [
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
  {
    key: "step5",
    text: "화재 안전 보험 설계 요율 산출",
  },
  {
    key: "step6",
    text: "위생 교육 수료증 및 영업 허가증 접수",
  },
] as const

export function MypageScreen() {
  const [userPersona] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null
    }

    const savedPersona = localStorage.getItem("g15_persona")
    return savedPersona && personaResults[savedPersona] ? savedPersona : null
  })
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    if (typeof window === "undefined") {
      return []
    }

    const existingRaw = localStorage.getItem("g15_saved_reports")
    return existingRaw ? JSON.parse(existingRaw) : []
  })
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  })
  const [creditScore, setCreditScore] = useState(750)
  const [desiredLoan, setDesiredLoan] = useState(5000)
  const [shopArea, setShopArea] = useState(15)
  const [sectorType, setSectorType] = useState("cafe")

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = savedReports.filter((report) => report.id !== id)
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
    <div className="flex-1 bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              마이 대시보드
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              수집한 AI 상권 분석 보고서 목록과 개인 창업 단계를 체계적으로
              모니터링합니다.
            </p>
          </div>
          <Badge variant="secondary" className="px-3">
            Enterprise Station
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">
                    보관된 AI 보고서 폴더
                  </CardTitle>
                </div>
                <CardDescription>
                  지도 분석 단계에서 보관한 상세 상권 보고서 목록입니다. 언제든
                  다시 열람할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedReports.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
                    <FileCode className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      보관된 상권 리포트가 존재하지 않습니다.
                    </p>
                    <Button asChild size="lg" className="mt-4">
                      <Link href="/map">지도에서 상권 분석하기</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {savedReports.map((report) => (
                      <div key={report.id} className="relative">
                        <Link
                          href={`/report?district=${report.id}`}
                          className="block"
                        >
                          <Card
                            size="sm"
                            className="group h-full justify-between transition-colors hover:bg-muted/20"
                          >
                            <CardContent>
                              <div className="flex items-start gap-3.5">
                                <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">
                                  <FileText className="h-6 w-6" />
                                </div>

                                <div className="min-w-0 flex-1 pr-6">
                                  <span className="block truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                    {report.title}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    발행일: {report.date}
                                  </span>

                                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-2 text-xs">
                                    <div>
                                      <span className="block text-xs text-muted-foreground">
                                        월평균 매출
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {report.avgSales.toLocaleString()}만원
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-muted-foreground">
                                        3년 생존율
                                      </span>
                                      <span className="font-medium text-primary">
                                        {report.survivalRate}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => handleDeleteReport(report.id, e)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">
                      개업 실무 체크리스트
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  {checklistItems.map((item) => (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md bg-muted/30 p-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checklist[item.key]}
                        onCheckedChange={() => handleToggleChecklist(item.key)}
                        className="mt-0.5"
                      />
                      <span
                        className={cn(
                          "text-xs leading-relaxed font-medium",
                          checklist[item.key]
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">
                      창업 단계별 마일스톤 일정
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-xs">
                  <div className="border-l-2 border-primary py-0.5 pl-3.5">
                    <span className="block text-xs text-muted-foreground">
                      D-30: 예산 설계
                    </span>
                    <p className="font-medium text-foreground">
                      창업 기금 한도 산정 및 보증서 발급 상담 완료
                    </p>
                  </div>
                  <div className="border-l-2 border-primary py-0.5 pl-3.5">
                    <span className="block text-xs text-muted-foreground">
                      D-20: 점포 계약
                    </span>
                    <p className="font-medium text-foreground">
                      핵심 상권 권리금 보호선 협상 및 부동산 임대 서명
                    </p>
                  </div>
                  <div className="border-l-2 border-border py-0.5 pl-3.5">
                    <span className="block text-xs text-muted-foreground">
                      D-15: 도면 실측
                    </span>
                    <p className="font-medium text-muted-foreground">
                      인테리어 소방 시설물 규격 도면 배치 실측
                    </p>
                  </div>
                  <div className="border-l-2 border-border py-0.5 pl-3.5">
                    <span className="block text-xs text-muted-foreground">
                      D-5: 가맹사 발주
                    </span>
                    <p className="font-medium text-muted-foreground">
                      가맹사 원자재 발주 및 위생설비 점검 입고
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="bg-primary px-5 py-4 text-primary-foreground">
                <span className="text-xs font-medium text-primary-foreground/80">
                  나의 창업 성향 타워
                </span>
                <CardTitle className="mt-1 text-base text-primary-foreground">
                  {personaInfo ? personaInfo.title : "등록된 성향이 없습니다"}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 py-5 text-xs leading-relaxed text-muted-foreground">
                {personaInfo ? (
                  <>
                    <p className="mb-4 rounded-lg bg-muted/40 p-3.5">
                      {personaInfo.desc}
                    </p>

                    <h4 className="mb-2 font-medium text-foreground">
                      추천 매칭 업종
                    </h4>
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {personaInfo.recommendedSectors.map((sector, idx) => (
                        <Badge key={idx} variant="secondary">
                          {sector}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Link href="/onboarding">성향 분석 다시하기</Link>
                    </Button>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <p className="mb-4 leading-normal text-muted-foreground">
                      성향 테스트를 이수하시면 가맹 브랜드 및 상권 후보군 추천이
                      자동으로 갱신됩니다.
                    </p>
                    <Button asChild size="lg" className="w-full">
                      <Link href="/onboarding">테스트 시작하기</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">
                    창업 실무 시뮬레이터
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-6 text-xs">
                <div className="border-b border-border pb-5">
                  <h4 className="mb-3 flex items-center gap-1 font-medium text-foreground">
                    <Coins className="h-4 w-4 text-primary" />
                    1. 정책 보증 한도 계산
                  </h4>

                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>희망 융자액</span>
                        <span className="font-medium text-foreground">
                          {desiredLoan.toLocaleString()}만 원
                        </span>
                      </div>
                      <Slider
                        value={[desiredLoan]}
                        min={1000}
                        max={20000}
                        step={1000}
                        onValueChange={(value) => {
                          const nextValue = value[0]
                          if (typeof nextValue === "number") {
                            setDesiredLoan(nextValue)
                          }
                        }}
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>신용점수 평점</span>
                        <span className="font-medium text-foreground">
                          {creditScore}점
                        </span>
                      </div>
                      <Slider
                        value={[creditScore]}
                        min={400}
                        max={1000}
                        step={10}
                        onValueChange={(value) => {
                          const nextValue = value[0]
                          if (typeof nextValue === "number") {
                            setCreditScore(nextValue)
                          }
                        }}
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-xs">
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          예상 한도
                        </span>
                        <span className="font-semibold text-foreground">
                          {loanResult.limit.toLocaleString()}만 원
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-muted-foreground">
                          우대 금리
                        </span>
                        <span className="font-semibold text-primary">
                          연 {loanResult.rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 flex items-center gap-1 font-medium text-foreground">
                    <Flame className="h-4 w-4 text-destructive" />
                    2. 화재 안심 공제료 계산
                  </h4>

                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          실평수 (평)
                        </label>
                        <Input
                          type="number"
                          value={shopArea}
                          onChange={(e) =>
                            setShopArea(Math.max(1, Number(e.target.value)))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          점포 세부 업종
                        </label>
                        <NativeSelect
                          value={sectorType}
                          onChange={(e) => setSectorType(e.target.value)}
                          className="w-full"
                        >
                          <NativeSelectOption value="cafe">
                            일반 카페 / 커피숍
                          </NativeSelectOption>
                          <NativeSelectOption value="restaurant">
                            가스 사용 요식업
                          </NativeSelectOption>
                          <NativeSelectOption value="pub">
                            주점 / 요리대폿집
                          </NativeSelectOption>
                        </NativeSelect>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-xs">
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          예상 공제료
                        </span>
                        <span className="font-semibold text-foreground">
                          월 {insuranceResult.premium} 원
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-muted-foreground">
                          최대 보장액
                        </span>
                        <span className="font-semibold text-primary">
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
