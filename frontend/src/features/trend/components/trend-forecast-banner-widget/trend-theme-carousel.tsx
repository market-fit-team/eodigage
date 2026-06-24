"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import type { TrendForecastTheme } from "@/features/trend/types/trend-forecast"
import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardAction,
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
} from "@/shared/components/ui/carousel"
import { cn } from "@/shared/lib/utils"

// 자동 슬라이드 간격(ms)
const AUTOPLAY_MS = 4500

// '편집장의 선택'처럼 주제(전체·주말·남성·여성·청년)를 탭으로 나누고
// 각 주제당 상위 3개를 카드로 보여준다. 일정 간격으로 다음 주제로 자동 슬라이드한다.
export function TrendThemeCarousel({
  themes,
}: {
  themes: TrendForecastTheme[]
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

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
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [api])

  if (themes.length === 0) return null

  return (
    <div>
      {/* 주제 탭 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {themes.map((theme, index) => (
          <button
            key={theme.key}
            type="button"
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              index === current
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }}>
        <CarouselContent>
          {themes.map((theme) => (
            <CarouselItem key={theme.key}>
              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                {theme.metrics.map((metric, index) => (
                  <Card key={metric.label}>
                    <CardHeader>
                      <CardDescription>{metric.label}</CardDescription>
                      <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl">
                        {metric.value}
                      </CardTitle>
                      <CardAction>
                        <Badge variant="outline" className="tabular-nums">
                          {index + 1}위
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="size-3.5" />
                      {metric.description}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
