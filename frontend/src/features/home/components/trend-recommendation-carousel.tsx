"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const SLIDES = ["트렌드 추천", "트렌드 추천", "트렌드 추천"] as const
const AUTO_PLAY_DELAY = 4500

export function TrendRecommendationCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length)
    }, AUTO_PLAY_DELAY)

    return () => window.clearInterval(timer)
  }, [isPaused])

  const moveToPrevious = () => {
    setActiveIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length)
  }

  const moveToNext = () => {
    setActiveIndex((current) => (current + 1) % SLIDES.length)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="트렌드 추천"
      className="group relative mb-5 min-h-[300px] overflow-hidden rounded-xl border border-neutral-200 bg-white sm:min-h-[360px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="flex min-h-[300px] transition-transform duration-700 ease-in-out sm:min-h-[360px]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {SLIDES.map((title, index) => (
          <div
            key={index}
            aria-hidden={activeIndex !== index}
            className="flex min-w-full items-center justify-center px-16 py-12"
          >
            <h1 className="text-center text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="이전 추천"
        onClick={moveToPrevious}
        className="absolute top-1/2 left-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="다음 추천"
        onClick={moveToNext}
        className="absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1}번째 추천 보기`}
            aria-current={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === index
                ? "w-7 bg-neutral-950"
                : "w-1.5 bg-neutral-300 hover:bg-neutral-500"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
