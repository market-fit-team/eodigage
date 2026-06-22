"use client"

import { useState } from "react"
import { EstimatedSalesRanking } from "@/features/map/components/detail/estimated-sales-ranking"
import { FranchiseRecommendations } from "@/features/map/components/detail/franchise-recommendations"
import type { MapTab } from "@/features/map/types/map"
import type { DistrictData } from "@/features/startup/lib/data"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"

type DetailPreviewTabsProps = {
  tradeArea: DistrictData
}

export function DetailPreviewTabs({ tradeArea }: DetailPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<MapTab>("sales")

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as MapTab)}
    >
      <TabsList variant="line" className="mb-3.5 border-b border-border pb-2">
        <TabsTrigger value="sales">업종별 추정매출</TabsTrigger>
        <TabsTrigger value="franchises">프랜차이즈 추천</TabsTrigger>
      </TabsList>
      <TabsContent value="sales" className="mt-0">
        <EstimatedSalesRanking tradeArea={tradeArea} />
      </TabsContent>
      <TabsContent value="franchises" className="mt-0">
        <FranchiseRecommendations tradeArea={tradeArea} />
      </TabsContent>
    </Tabs>
  )
}
