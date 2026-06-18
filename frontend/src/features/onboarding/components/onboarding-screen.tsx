"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, Compass, RotateCcw } from "lucide-react"
import { Button } from "@/features/startup/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/startup/components/ui/card"
import {
  type DistrictData,
  districtsData,
  onboardingQuestions,
  personaResults,
} from "@/features/startup/lib/data"

export function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [calculatedPersona, setCalculatedPersona] = useState<string | null>(
    null
  )

  // Load saved state on mount
  useEffect(() => {
    const savedPersona = localStorage.getItem("g15_persona")
    if (savedPersona && personaResults[savedPersona]) {
      setCalculatedPersona(savedPersona)
      setIsCompleted(true)
    }
  }, [])

  const handleSelectOption = (persona: string) => {
    const nextAnswers = [...answers, persona]
    setAnswers(nextAnswers)

    if (currentStep < onboardingQuestions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Calculate majority persona
      const tallies: Record<string, number> = {}
      nextAnswers.forEach((p) => {
        tallies[p] = (tallies[p] || 0) + 1
      })

      let maxCount = 0
      let winningPersona = "BALANCED" // default fallback
      Object.entries(tallies).forEach(([personaName, count]) => {
        if (count > maxCount) {
          maxCount = count
          winningPersona = personaName
        }
      })

      // Save to localStorage
      localStorage.setItem("g15_persona", winningPersona)
      setCalculatedPersona(winningPersona)
      setIsCompleted(true)
    }
  }

  const handleReset = () => {
    localStorage.removeItem("g15_persona")
    setAnswers([])
    setCurrentStep(0)
    setIsCompleted(false)
    setCalculatedPersona(null)
  }

  const questionData = onboardingQuestions[currentStep]
  const personaInfo = calculatedPersona
    ? personaResults[calculatedPersona]
    : null
  const recommendedDistricts: DistrictData[] = personaInfo
    ? districtsData.filter((d) =>
        personaInfo.recommendedDistricts.includes(d.id)
      )
    : []

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {!isCompleted ? (
          /* QUIZ INTERFACE */
          <div>
            {/* Progress bar */}
            <div className="mb-6 flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>
                질문 {currentStep + 1} / {onboardingQuestions.length}
              </span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / onboardingQuestions.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <Card className="overflow-hidden border border-zinc-200 bg-white shadow-sm">
              <CardHeader className="border-b-0 p-8 pb-6">
                <CardTitle className="text-xl leading-snug font-extrabold text-zinc-900 sm:text-2xl">
                  {questionData.question}
                </CardTitle>
                <CardDescription className="mt-1 text-zinc-500">
                  본인의 창업 준비 상황 및 가치관에 맞는 선택지를 선택하세요.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3.5 px-8 pt-0 pb-8">
                {questionData.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option.persona)}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 p-5 text-left transition-all duration-150 hover:border-blue-600 hover:bg-blue-50/10 focus:outline-none"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-zinc-850 block text-sm font-bold transition-colors group-hover:text-blue-600 sm:text-base">
                        {option.text}
                      </span>
                      <span className="mt-1.5 block text-xs leading-normal font-normal text-zinc-400">
                        {option.desc}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-blue-600" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* RESULTS SCREEN */
          <div>
            <Card className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md">
              {/* Result header */}
              <div className="flex flex-col items-start justify-between gap-4 bg-blue-600 p-8 text-white sm:flex-row sm:items-center">
                <div>
                  <span className="mb-2.5 inline-block rounded-full bg-blue-700/60 px-3 py-1 text-[10px] font-bold tracking-wider text-blue-100">
                    창업가 성향 분석 결과
                  </span>
                  <h2 className="text-xl leading-tight font-extrabold sm:text-2xl">
                    {personaInfo?.title}
                  </h2>
                </div>
                <CheckCircle2 className="hidden h-12 w-12 shrink-0 text-blue-100/90 sm:block" />
              </div>

              <CardContent className="p-8">
                {/* Persona description */}
                <div className="mb-8">
                  <h4 className="text-zinc-450 mb-2 text-xs font-bold tracking-wide uppercase">
                    성향 요약
                  </h4>
                  <p className="rounded-xl border border-zinc-200/60 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">
                    {personaInfo?.desc}
                  </p>
                </div>

                {/* Recommended Sectors / Franchises */}
                <div className="mb-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <h4 className="text-zinc-450 mb-3 text-xs font-bold tracking-wide uppercase">
                      추천 어울리는 업종
                    </h4>
                    <div className="flex flex-col gap-2">
                      {personaInfo?.recommendedSectors.map((sector, idx) => (
                        <div
                          key={idx}
                          className="border-zinc-250/70 flex items-center gap-2 rounded-lg border bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-800"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                          {sector}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-zinc-450 mb-3 text-xs font-bold tracking-wide uppercase">
                      추천 프랜차이즈 후보
                    </h4>
                    <div className="flex flex-col gap-2">
                      {personaInfo?.franchises.map((brand, idx) => (
                        <div
                          key={idx}
                          className="border-zinc-250/70 flex items-center gap-2 rounded-lg border bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-800"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                          {brand}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Matching Districts */}
                <div className="border-t border-zinc-100 pt-8">
                  <h4 className="text-zinc-450 mb-4 text-xs font-bold tracking-wide uppercase">
                    맞춤형 추천 행정동 상권
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recommendedDistricts.map((district) => (
                      <div
                        key={district.id}
                        className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4.5 transition-all hover:border-zinc-300"
                      >
                        <div>
                          <div className="mb-1.5 flex items-start justify-between">
                            <span className="text-sm font-bold text-zinc-900">
                              {district.nameKo}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">
                              {district.nameEn}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                            {district.desc}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 font-mono text-xs">
                          <div>
                            <span className="block text-[9px] text-zinc-400">
                              월평균 매출
                            </span>
                            <span className="font-bold text-zinc-800">
                              {district.avgSales.toLocaleString()}만원
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-zinc-400">
                              3년 생존율
                            </span>
                            <span className="font-bold text-emerald-600">
                              {district.survivalRate3Year}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Footer Controls */}
              <CardFooter className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200/60 bg-zinc-50 p-6 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" /> 다시 테스트하기
                </Button>

                <Link
                  href={`/map?persona=${calculatedPersona}`}
                  className="block w-full sm:w-auto"
                >
                  <Button className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold">
                    <Compass className="h-4 w-4" /> 상권 지도에서 상세 분석
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
