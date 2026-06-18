import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  HelpCircle,
  Map,
  Sparkles,
} from "lucide-react"
import { Button } from "@/features/startup/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/startup/components/ui/card"
import { curationArticles } from "@/features/startup/lib/data"

export function HomeScreen() {
  return (
    <div className="flex-1 bg-zinc-50/60 pb-20">
      {/* Hero Banner Section */}
      <section className="border-b border-zinc-200/80 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI 기반 맞춤형 상권 분석 서비스</span>
            </div>

            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              성공적인 창업 준비,
              <br />
              <span className="text-blue-600">빅데이터 상권 분석</span>과 함께
              하세요.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
              어려운 법률 용어나 상권 데이터 분석은 AI 컨설턴트에게 맡기세요. 내
              투자 규모와 업종에 꼭 맞는 행정동 상권의 유동인구, 매출 트렌드,
              가맹점 정보를 상세히 제안해 드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Core Entry CTA Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          {/* Card 1: Onboarding Quiz */}
          <Card
            hoverable
            className="flex flex-col justify-between border-t-4 border-t-blue-600"
          >
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <HelpCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">1분 성향 분석 온보딩</CardTitle>
              <CardDescription className="mt-1 text-zinc-500">
                간단한 설문을 바탕으로 선호하는 경영 스타일과 자본 상황에 적합한
                가맹 브랜드 및 상권 후보군을 추천합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="mb-6 space-y-2.5 text-xs text-zinc-500 sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  자본규모 및 창업주의 리스크 성향 검증
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  대중성 가맹점 vs 힙한 프리미엄 F&B 매칭
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  유저 타워 생성 및 맞춤 행정동 상권 우선순위 핑
                </li>
              </ul>
              <Link href="/onboarding" className="block">
                <Button className="group w-full justify-between rounded-lg py-3">
                  성향 분석 테스트 시작
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Interactive Map */}
          <Card
            hoverable
            className="flex flex-col justify-between border-t-4 border-t-zinc-800"
          >
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <Map className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">몰입형 상권 지도 탐색</CardTitle>
              <CardDescription className="mt-1 text-zinc-500">
                서울 핵심 행정동 상권의 월평균 매출액, 시간대별 유동인구, 업종별
                점포 생존율을 대화형 지도상에서 직접 비교 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="mb-6 space-y-2.5 text-xs text-zinc-500 sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-800"></span>
                  지도 위 행정동 클릭을 통한 정밀 시각화 대시보드
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-800"></span>
                  업종분류별, 연령대별 Recharts 분석
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-800"></span>
                  우측 AI 창업비서 상담 및 PDF 리포트 파일 출력
                </li>
              </ul>
              <Link href="/map" className="block">
                <Button
                  variant="secondary"
                  className="group w-full justify-between rounded-lg py-3"
                >
                  상권 지도 바로가기
                  <Map className="h-4 w-4 transition-transform group-hover:rotate-12" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Curation / Articles Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between border-b border-zinc-200/80 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-zinc-950">
                창업 정보 및 최신 동향 큐레이션
              </h2>
            </div>
            <span className="text-xs font-medium text-zinc-400">
              실시간 업데이트
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {curationArticles.map((article) => (
              <Card
                key={article.id}
                hoverable
                className="flex h-full flex-col justify-between"
              >
                <div className="p-6">
                  {/* Styled simple category tags */}
                  <span
                    className={`mb-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      article.category === "Trend"
                        ? "bg-blue-50 text-blue-700"
                        : article.category === "Guide"
                          ? "bg-zinc-100 text-zinc-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {article.category === "Trend"
                      ? "시장 트렌드"
                      : article.category === "Guide"
                        ? "창업 실무가이드"
                        : "정책/법률 가이드"}
                  </span>
                  <h3 className="text-sm leading-snug font-bold text-zinc-900 transition-colors group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-zinc-500">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100/80 px-6 pt-3 pb-5 text-xs font-medium text-zinc-400">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Highlights Panel */}
        <section className="grid gap-8 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">
                빅데이터 매칭 추천
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                서울시 유동인구 지수와 실제 매출 통계 데이터를 연계하여 유저
                타워 기반 고효율 매칭 알고리즘을 수행합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">
                AI 실시간 대화식 컨설팅
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                상권을 탐색하면서 우측 대화창을 통해 창업 아이디어의 타당성 및
                기피고객 요소를 실시간 검증할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">
                창업 실무 밀착 케어
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                상가건물 임대차보호법 상의 환산보증금 요율 체크리스트, 평당 화재
                보험 산정 도구 등 법률과 금융 시뮬레이터를 일괄 제공합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
