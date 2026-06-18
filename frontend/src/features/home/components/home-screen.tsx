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
import { curationArticles } from "@/features/startup/lib/data"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

const categoryLabels = {
  Trend: "시장 트렌드",
  Guide: "창업 실무가이드",
  Policy: "정책/법률 가이드",
} as const

const categoryVariants = {
  Trend: "default",
  Guide: "secondary",
  Policy: "outline",
} as const

export function HomeScreen() {
  return (
    <div className="flex-1 bg-muted/30 pb-20">
      <section className="border-b border-border bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI 기반 맞춤형 상권 분석 서비스</span>
            </Badge>

            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              성공적인 창업 준비,
              <br />
              <span className="text-primary">빅데이터 상권 분석</span>과 함께
              하세요.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              어려운 법률 용어나 상권 데이터 분석은 AI 컨설턴트에게 맡기세요. 내
              투자 규모와 업종에 꼭 맞는 행정동 상권의 유동인구, 매출 트렌드,
              가맹점 정보를 상세히 제안해 드립니다.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <Card className="flex flex-col justify-between overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-base sm:text-lg">
                1분 성향 분석 온보딩
              </CardTitle>
              <CardDescription className="mt-1">
                간단한 설문을 바탕으로 선호하는 경영 스타일과 자본 상황에 적합한
                가맹 브랜드 및 상권 후보군을 추천합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="mb-6 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  자본규모 및 창업주의 리스크 성향 검증
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  대중성 가맹점 vs 힙한 프리미엄 F&B 매칭
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  유저 타워 생성 및 맞춤 행정동 상권 우선순위 핑
                </li>
              </ul>
              <Button asChild size="lg" className="w-full justify-between">
                <Link href="/onboarding">
                  성향 분석 테스트 시작
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between overflow-hidden border-t-4 border-t-foreground">
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Map className="h-6 w-6" />
              </div>
              <CardTitle className="text-base sm:text-lg">
                몰입형 상권 지도 탐색
              </CardTitle>
              <CardDescription className="mt-1">
                서울 핵심 행정동 상권의 월평균 매출액, 시간대별 유동인구, 업종별
                점포 생존율을 대화형 지도상에서 직접 비교 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="mb-6 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                  지도 위 행정동 클릭을 통한 정밀 시각화 대시보드
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                  업종분류별, 연령대별 Recharts 분석
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                  우측 AI 창업비서 상담 및 PDF 리포트 파일 출력
                </li>
              </ul>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full justify-between"
              >
                <Link href="/map">
                  상권 지도 바로가기
                  <Map className="h-4 w-4 transition-transform group-hover/button:rotate-12" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                창업 정보 및 최신 동향 큐레이션
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              실시간 업데이트
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {curationArticles.map((article) => (
              <Card
                key={article.id}
                className="group flex h-full flex-col justify-between transition-colors hover:bg-muted/20"
              >
                <div className="p-6">
                  <Badge
                    variant={categoryVariants[article.category]}
                    className="mb-3"
                  >
                    {categoryLabels[article.category]}
                  </Badge>
                  <h3 className="text-sm leading-snug font-medium text-foreground transition-colors group-hover:text-primary">
                    {article.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border px-6 pt-3 pb-5 text-xs text-muted-foreground">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardContent className="grid gap-8 py-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  빅데이터 매칭 추천
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  서울시 유동인구 지수와 실제 매출 통계 데이터를 연계하여 유저
                  타워 기반 고효율 매칭 알고리즘을 수행합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  AI 실시간 대화식 컨설팅
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  상권을 탐색하면서 우측 대화창을 통해 창업 아이디어의 타당성 및
                  기피고객 요소를 실시간 검증할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  창업 실무 밀착 케어
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  상가건물 임대차보호법 상의 환산보증금 요율 체크리스트, 평당
                  화재 보험 산정 도구 등 법률과 금융 시뮬레이터를 일괄
                  제공합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
