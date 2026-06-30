"use client"

import { useEffect, useState } from "react"
import { Flame, Sparkles, TrendingUp } from "lucide-react"
import type {
  TrendForecastBannerOutput,
  TrendForecastThemeOutput,
} from "@/shared/api/generated/trend/schemas"
import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel"
import { cn } from "@/shared/lib/utils"

// 자동 슬라이드 간격(ms)
const AUTOPLAY_MS = 4000

// 상단 토글 2개. predicted=곧 뜰(예측), popular=요즘 뜨는(실측).
type Kind = "predicted" | "popular"
const KIND_TABS: { key: Kind; label: string }[] = [
  { key: "predicted", label: "상승 후보" },
  { key: "popular", label: "현재 인기" },
]

const metricsOf = (theme: TrendForecastThemeOutput, kind: Kind) =>
  kind === "predicted" ? theme.predicted : theme.popular

const descriptionOf = (
  kind: Kind,
  metric: TrendForecastThemeOutput["predicted"][number],
  index: number
) => {
  if (metric.description) return metric.description

  if (kind === "popular") {
    return (
      [
        "상업시간대 유입이 가장 두드러진 상권입니다.",
        "상업시간대 유입이 꾸준히 높은 상권입니다.",
        "생활인구 흐름이 상위권에 머무는 상권입니다.",
      ][index] ?? "상업시간대 유입이 많은 상권입니다."
    )
  }

  switch (metric.value) {
    case "반등 시작":
      return "유입 흐름이 전보다 빠르게 좋아지는 상권입니다."
    case "저점 회복 흐름":
      return "잠잠했던 유입이 다시 살아나는 구간입니다."
    case "안정적 상승 전망":
      return "흔들림이 작아 흐름이 안정적인 상권입니다."
    default:
      return "유입 증가 가능성을 높게 본 상권입니다."
  }
}

// 단일 배너 블록: 상단 2-탭 토글(예측/인기) + 세그먼트 탭 + 카드 캐러셀(양옆 화살표·하단 도트).
// 카드 슬라이드는 세그먼트(전체·남성·여성·20·30대)를 넘기고, 토글이 예측/인기를 바꾼다.
export function TrendBannerBlock({
  banner,
}: {
  banner: TrendForecastBannerOutput
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [kind, setKind] = useState<Kind>("predicted")

  const themes = banner.themes

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api) return
    if (isPaused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [api, isPaused])

  if (themes.length === 0) return null

  const FooterIcon = kind === "predicted" ? TrendingUp : Flame

  // 헤더는 전체 기준 1위로 고정하고, 세그먼트 선택은 카드 영역에만 반영한다.
  const overallTheme =
    themes.find((theme) => theme.key === "combined") ?? themes[0]
  const topLabel = metricsOf(overallTheme, kind)[0]?.label
  const HeaderIcon = kind === "predicted" ? Sparkles : Flame
  const headerEyebrow = kind === "predicted" ? "AI 트렌드 예측" : "현재 인기"
  const headerTitle =
    kind === "predicted"
      ? topLabel
        ? `앞으로 주목할 상권, ${topLabel}`
        : "앞으로 주목할 상권"
      : topLabel
        ? `현재 유입이 많은 상권, ${topLabel}`
        : "현재 유입이 많은 상권"

  return (
    <div
      className="py-2"
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
    >
      {/* 헤더: eyebrow + 제목 / 상단 2-탭 토글 */}
      <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl space-y-2">
          <Badge className="gap-1.5 border-transparent bg-white/10 text-white">
            <HeaderIcon className="size-3.5" />
            {headerEyebrow}
          </Badge>
          <h2 className="text-3xl leading-tight font-bold tracking-tight break-keep text-white sm:text-4xl">
            {headerTitle}
          </h2>
        </div>

        <div className="inline-flex w-fit shrink-0 rounded-full bg-white/10 p-1">
          {KIND_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={kind === tab.key}
              onClick={() => setKind(tab.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                kind === tab.key
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-white/65 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 세그먼트 탭 */}
      <div className="relative mb-5 flex flex-wrap gap-2">
        {themes.map((theme, index) => (
          <button
            key={theme.key}
            type="button"
            aria-pressed={index === current}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              index === current
                ? "bg-muted text-foreground"
                : "bg-white/10 text-white/65 hover:bg-white/15 hover:text-white"
            )}
          >
            {theme.label}
          </button>
        ))}
      </div>

      {/* 카드 캐러셀: 양옆 화살표 */}
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="relative px-10"
      >
        <CarouselContent className="py-5">
          {themes.map((theme) => (
            <CarouselItem key={theme.key}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
                {metricsOf(theme, kind).map((metric, index) => {
                  const cardLabel =
                    kind === "popular" ? `${index + 1}위` : metric.value
                  const description = descriptionOf(kind, metric, index)

                  return (
                    <Card
                      key={metric.label}
                      className="min-h-40 justify-between border-white/20 bg-white text-neutral-950 shadow-[0_24px_54px_rgb(15_23_42/0.30)] transition-[border-color,box-shadow] ring-inset hover:border-border"
                    >
                      <CardHeader className="gap-2 p-0">
                        <CardTitle className="pr-8 text-lg leading-snug font-semibold tracking-tight break-keep sm:text-xl">
                          {metric.label}
                        </CardTitle>
                        {cardLabel && (
                          <CardDescription>
                            <Badge className="mt-1.5 w-fit border-transparent bg-muted px-4 py-2 text-sm font-semibold break-keep text-muted-foreground">
                              {cardLabel}
                            </Badge>
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="min-w-0 items-start gap-1.5 text-xs leading-relaxed text-neutral-600">
                        <FooterIcon className="mt-0.5 size-3.5 shrink-0" />
                        <span className="break-keep">{description}</span>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-1" />
        <CarouselNext className="right-1" />
      </Carousel>

      {/* 하단 도트(세그먼트 위치) */}
      <div className="relative mt-5 flex justify-center gap-2">
        {themes.map((theme, index) => (
          <button
            key={theme.key}
            type="button"
            aria-label={`${theme.label} 보기`}
            aria-pressed={index === current}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "size-2 rounded-full transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              index === current
                ? "w-5 bg-muted"
                : "bg-white/30 hover:bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  )
}
