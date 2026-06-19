import Link from "next/link"
import {
  ArrowRight,
  Bot,
  Building2,
  ChartNoAxesCombined,
  CircleHelp,
  Map,
  Newspaper,
  Sparkles,
  Store,
} from "lucide-react"
import { TrendRecommendationCarousel } from "@/features/home/components/trend-recommendation-carousel"

const TREND_ARTICLES = [
  {
    category: "시장 트렌드",
    title:
      "2026 서울시 신규 자영업 트렌드: 소규모 배달 전문 vs 초대형 쇼룸 카페",
    description:
      "금리 하락기에 맞물린 서울 주요 상권의 상반된 트렌드를 정리합니다.",
    date: "2026-06-10",
    readTime: "5분 분량",
  },
  {
    category: "창업 실무가이드",
    title:
      "상가 임대차 보호법 개정안 핵심 가이드: 환산보증금과 권리금 보장 범위",
    description:
      "초보 창업자가 계약서 날인 전에 반드시 확인해야 할 체크포인트입니다.",
    date: "2026-06-05",
    readTime: "7분 분량",
  },
  {
    category: "정책·법률 가이드",
    title:
      "성수동 팝업스토어 성황, 배후 상권 식음료 매출에 미치는 경제 효과는?",
    description:
      "유동 인구 변화와 인근 업종 매출 데이터를 바탕으로 파급 효과를 살펴봅니다.",
    date: "2026-05-28",
    readTime: "4분 분량",
  },
  {
    category: "상권 실무가이드",
    title: "동네 상권에서 1등 하기: 인근 오피스 거주민 타깃 로컬 브랜딩 방법론",
    description:
      "재방문율을 높이는 메뉴, 메시지, 채널 운영의 기본 원칙을 소개합니다.",
    date: "2026-05-15",
    readTime: "6분 분량",
  },
] as const

const BENEFITS = [
  {
    icon: ChartNoAxesCombined,
    title: "빅데이터 매칭 추천",
    description:
      "서울시 유동인구 지수와 실제 매출 통계 데이터를 연결해 유저 타깃 기반 매장을 추천합니다.",
  },
  {
    icon: Bot,
    title: "AI 실시간 대화식 컨설팅",
    description:
      "상권을 탐색하며 수치·대화창을 통해 창업 아이디어의 타당성과 기회 요인을 점검합니다.",
  },
  {
    icon: CircleHelp,
    title: "프랜차이즈 맞춤 추천",
    description:
      "예산과 희망 상권, 관심 업종을 분석해 나에게 맞는 프랜차이즈 브랜드를 추천합니다.",
  },
] as const

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <TrendRecommendationCarousel />

      <section className="mb-14 grid gap-5 lg:grid-cols-2">
        <article className="flex min-h-[155px] flex-col rounded-xl border border-t-4 border-neutral-200 border-t-neutral-950 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-[-0.03em]">
                AI가 찾은 상권·창업 추천
              </h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">
                내 상황에 맞는 상권과 업종을 빠르게 추천받아 보세요.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className="mt-5 flex h-10 items-center justify-between rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            AI 추천 시작하기
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="flex min-h-[155px] flex-col rounded-xl border border-t-4 border-neutral-200 border-t-neutral-950 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Map className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-[-0.03em]">
                몰입형 상권 지도 탐색
              </h2>
              <p className="mt-1 text-sm leading-5 text-neutral-500">
                서울 핵심 상권의 매출과 유동인구를 한눈에 비교하세요.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-5 flex h-10 items-center justify-between rounded-lg bg-neutral-100 px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            상권 데이터 살펴보기
            <Map className="size-4" aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section aria-labelledby="trend-heading">
        <div className="mb-5 flex items-end justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">
              Weekly insight
            </p>
            <h2
              id="trend-heading"
              className="flex items-center gap-2 text-xl font-bold tracking-[-0.03em]"
            >
              <Newspaper className="size-5" aria-hidden="true" />
              창업 정보 및 최신 동향 큐레이션
            </h2>
          </div>
          <span className="hidden text-xs text-neutral-400 sm:block">
            실시간 업데이트
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TREND_ARTICLES.map((article) => (
            <article
              key={article.title}
              className="group flex min-h-[270px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-4 w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold">
                  {article.category}
                </span>
                <h3 className="text-base leading-6 font-bold tracking-[-0.02em]">
                  {article.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  {article.description}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-xs text-neutral-500">
                <time>{article.date}</time>
                <span>{article.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-label="서비스 특징"
        className="mt-12 grid gap-8 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-3 md:p-8"
      >
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {description}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-xl bg-neutral-950 p-7 text-white sm:flex-row sm:items-center sm:p-9">
        <div>
          <p className="text-sm font-medium text-neutral-400">오늘의 추천</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
            나에게 맞는 프랜차이즈 상권을 찾아보세요.
          </h2>
        </div>
        <Link
          href="/chat"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-200"
        >
          추천 시작하기
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-200 py-6 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
          <Store className="size-4" aria-hidden="true" />
          Pickle
        </span>
        <span>상권 분석과 창업 의사결정을 더 단순하게.</span>
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <Building2 className="size-4" aria-hidden="true" />
          Seoul, Korea
        </span>
      </footer>
    </main>
  )
}
