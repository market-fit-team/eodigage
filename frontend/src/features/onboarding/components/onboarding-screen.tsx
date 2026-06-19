"use client"

import React, { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, Compass, RotateCcw } from "lucide-react"
import {
  type DistrictData,
  districtsData,
  onboardingQuestions,
  personaResults,
} from "@/features/startup/lib/data"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Progress } from "@/shared/components/ui/progress"

export function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [calculatedPersona, setCalculatedPersona] = useState<string | null>(
    () => {
      if (typeof window === "undefined") {
        return null
      }

      const savedPersona = localStorage.getItem("g15_persona")
      return savedPersona && personaResults[savedPersona] ? savedPersona : null
    }
  )
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    const savedPersona = localStorage.getItem("g15_persona")
    return Boolean(savedPersona && personaResults[savedPersona])
  })

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
  const progressValue = ((currentStep + 1) / onboardingQuestions.length) * 100

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {!isCompleted ? (
          <div>
            <div className="mb-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                질문 {currentStep + 1} / {onboardingQuestions.length}
              </span>
              <Progress value={progressValue} className="w-32" />
            </div>

            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="px-8 pt-8 pb-6">
                <CardTitle className="text-xl leading-snug font-semibold sm:text-2xl">
                  {questionData.question}
                </CardTitle>
                <CardDescription className="mt-1">
                  본인의 창업 준비 상황 및 가치관에 맞는 선택지를 선택하세요.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3.5 px-8 pb-8">
                {questionData.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option.persona)}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                  >
                    <div className="flex-1 pr-4">
                      <span className="block text-sm font-medium text-foreground transition-colors group-hover:text-primary sm:text-base">
                        {option.text}
                      </span>
                      <span className="mt-1.5 block text-xs leading-normal text-muted-foreground">
                        {option.desc}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <Card className="gap-0 overflow-hidden py-0">
              <div className="flex flex-col items-start justify-between gap-4 bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-3 border-primary-foreground/20 bg-primary-foreground/10 px-3 text-primary-foreground"
                  >
                    창업가 성향 분석 결과
                  </Badge>
                  <h2 className="text-xl leading-tight font-semibold sm:text-2xl">
                    {personaInfo?.title}
                  </h2>
                </div>
                <CheckCircle2 className="hidden h-12 w-12 shrink-0 text-primary-foreground/80 sm:block" />
              </div>

              <CardContent className="px-8 py-8">
                <div className="mb-8">
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                    성향 요약
                  </h4>
                  <p className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                    {personaInfo?.desc}
                  </p>
                </div>

                <div className="mb-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-xs font-medium text-muted-foreground">
                      추천 어울리는 업종
                    </h4>
                    <div className="flex flex-col gap-2">
                      {personaInfo?.recommendedSectors.map((sector, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs font-medium text-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          {sector}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-medium text-muted-foreground">
                      추천 프랜차이즈 후보
                    </h4>
                    <div className="flex flex-col gap-2">
                      {personaInfo?.franchises.map((brand, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs font-medium text-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          {brand}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-8">
                  <h4 className="mb-4 text-xs font-medium text-muted-foreground">
                    맞춤형 추천 행정동 상권
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recommendedDistricts.map((district) => (
                      <Card
                        key={district.id}
                        size="sm"
                        className="justify-between transition-colors hover:bg-muted/20"
                      >
                        <CardContent className="flex h-full flex-col justify-between gap-4">
                          <div>
                            <div className="mb-1.5 flex items-start justify-between gap-3">
                              <span className="text-sm font-medium text-foreground">
                                {district.nameKo}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {district.nameEn}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {district.desc}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                            <div>
                              <span className="block text-xs text-muted-foreground">
                                월평균 매출
                              </span>
                              <span className="font-medium text-foreground">
                                {district.avgSales.toLocaleString()}만원
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground">
                                3년 생존율
                              </span>
                              <span className="font-medium text-primary">
                                {district.survivalRate3Year}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/30 px-6 py-6 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="w-full gap-1.5 sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  다시 테스트하기
                </Button>

                <Button asChild size="lg" className="w-full gap-1.5 sm:w-auto">
                  <Link href={`/map?persona=${calculatedPersona}`}>
                    <Compass className="h-4 w-4" />
                    상권 지도에서 상세 분석
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
