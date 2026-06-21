"use client"

import { useRouter } from "next/navigation"
import { FileText, X } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { getDongByCode } from "@/features/map/lib/map-renderer/polygon-runtime"
import { getSelectedTradeArea } from "@/features/map/lib/map-selectors"
import { useMapStore } from "@/features/map/store/map-store"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"

// DetailWidget은 선택된 상권 상세 패널과 리포트 CTA를 렌더링한다.
// 이 패널의 도킹 위치는 MapView가 결정한다.
export function DetailWidget() {
  const router = useRouter()
  const activeResultTab = useMapStore((state) => state.activeResultTab)
  const selectedDongCode = useMapStore((state) => state.selectedDongCode)
  const selectDong = useMapStore((state) => state.selectDong)
  const setActiveResultTab = useMapStore((state) => state.setActiveResultTab)

  const selectedTradeArea = getSelectedTradeArea(selectedDongCode)

  // 선택된 동이 없으면 패널을 비움
  if (!selectedDongCode) {
    return null
  }

  if (!selectedTradeArea) {
    const dong = getDongByCode(selectedDongCode)

    return (
      <Card className="h-full gap-0 overflow-hidden py-0">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <div className="flex flex-col gap-3 border-b border-border pb-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {dong?.name ?? "선택한 동"}
                </h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline">데이터 준비중</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => selectDong(null)}
                    aria-label="상세 패널 닫기"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                이 행정동의 상권 상세 데이터는 아직 준비 중입니다.
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs">
                <div>
                  <span className="block text-xs text-muted-foreground">
                    월평균 매출
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">
                    —
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">
                    3년 생존률
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">
                    —
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              데이터 준비 중
            </div>
          </div>

          <div className="shrink-0 border-t border-border p-4">
            <Button type="button" size="lg" disabled className="w-full gap-1.5">
              <FileText className="h-4 w-4" />
              상권 상세 보기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleViewTradeAreaDetails = () => {
    router.push(`/report?district=${selectedTradeArea.id}`)
  }

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="flex flex-col gap-3 border-b border-border pb-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {selectedTradeArea.nameKo}
                </h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline">{selectedTradeArea.nameEn}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => selectDong(null)}
                    aria-label="상세 패널 닫기"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {selectedTradeArea.desc}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs">
              <div>
                <span className="block text-xs text-muted-foreground">
                  월평균 매출
                </span>
                <span className="text-base font-semibold text-foreground">
                  {selectedTradeArea.avgSales.toLocaleString()}만원
                </span>
                <span className="block text-xs font-medium text-primary">
                  +{selectedTradeArea.yoySalesChange}% YoY
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">
                  3년 생존률
                </span>
                <span className="text-base font-semibold text-foreground">
                  {selectedTradeArea.survivalRate3Year}%
                </span>
                <span className="block text-xs text-muted-foreground">
                  밀집도: {selectedTradeArea.densityScore}/100
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Tabs
              value={activeResultTab}
              onValueChange={(value) =>
                setActiveResultTab(value as typeof activeResultTab)
              }
            >
              <TabsList
                variant="line"
                className="mb-3.5 border-b border-border pb-2"
              >
                <TabsTrigger value="traffic">시간대 유동인구</TabsTrigger>
                <TabsTrigger value="demographics">연령분포</TabsTrigger>
                <TabsTrigger value="sectors">밀집 업종/생존율</TabsTrigger>
              </TabsList>

              <TabsContent value="traffic" className="mt-0 h-32">
                <ChartContainer
                  config={{
                    traffic: {
                      label: "유동인구 (천명)",
                      color: "var(--chart-1)",
                    },
                  }}
                  className="h-32 w-full"
                >
                  <LineChart data={selectedTradeArea.footTrafficHourly}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={25} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="traffic"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="유동인구 (천명)"
                    />
                  </LineChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="demographics" className="mt-0 h-32">
                <ChartContainer
                  config={{
                    percentage: {
                      label: "비중 (%)",
                      color: "var(--chart-1)",
                    },
                  }}
                  className="h-32 w-full"
                >
                  <BarChart data={selectedTradeArea.footTrafficAge}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="ageGroup"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} width={25} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${value}%`}
                        />
                      }
                    />
                    <Bar dataKey="percentage" radius={4} name="비중 (%)">
                      {selectedTradeArea.footTrafficAge.map((entry, index) => (
                        <Cell
                          key={`age-${index}`}
                          fill={
                            entry.percentage > 35
                              ? "var(--chart-1)"
                              : "var(--chart-2)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="sectors" className="mt-0">
                <div className="grid max-h-32 grid-cols-2 gap-3 overflow-y-auto">
                  {selectedTradeArea.topSectors.map((sector, index) => (
                    <Card key={index} size="sm" className="bg-muted/20">
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <span className="block font-medium text-foreground">
                            {sector.sector}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            경쟁강도: {sector.density}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block font-medium text-primary">
                            {sector.survivalRate}%
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            3년 생존율
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <Button
            type="button"
            size="lg"
            onClick={handleViewTradeAreaDetails}
            className="w-full gap-1.5"
          >
            <FileText className="h-4 w-4" />
            상권 상세 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
