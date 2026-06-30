import Link from "next/link"
import { ArrowRight, Map, Sparkles } from "lucide-react"

// 홈 전용 CTA 영역이다. 온보딩과 지도 탐색으로 진입시키는 링크만 가진다.
export function HomeCtaWidget() {
  return (
    <section
      aria-label="창업 추천 서비스 바로가기"
      className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="text-lg leading-tight font-bold break-keep sm:text-xl">
            창업 후보를 바로 좁혀보세요
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 break-keep text-primary-foreground/65">
            성향 분석으로 추천 후보를 만들거나, 상권 지도에서 직접 데이터를
            확인할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[400px]">
          <Link
            href="/onboarding"
            className="group flex min-h-12 items-center justify-between gap-3 rounded-lg bg-primary-foreground px-4 py-3 text-primary shadow-sm transition-colors hover:bg-primary-foreground/90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold break-keep">
                성향 분석 시작
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/map"
            className="group flex min-h-12 items-center justify-between gap-3 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 text-primary-foreground transition-colors hover:bg-primary-foreground/15 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground">
                <Map className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold break-keep">
                상권 지도 보기
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
