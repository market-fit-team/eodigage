import { WalletCards } from "lucide-react"
import type { MarketFranchiseRecommendation } from "@/features/map/types/map"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

type FranchiseStartupCostCardProps = {
  franchises: MarketFranchiseRecommendation[]
}

export function FranchiseStartupCostCard({
  franchises,
}: FranchiseStartupCostCardProps) {
  return (
    <Card className="overflow-hidden border-border shadow-sm lg:col-span-2">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <WalletCards className="h-4 w-4" />
          </span>
          <span>
            <span className="block">프랜차이즈 예상 창업 비용</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              추천 브랜드의 초기 비용 규모를 비교합니다.
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {franchises.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            표시할 프랜차이즈 예상 창업 비용 데이터가 없습니다.
          </p>
        ) : (
          <Table className="w-full min-w-0 overflow-hidden rounded-xl">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>브랜드</TableHead>
                <TableHead>운영사</TableHead>
                <TableHead className="text-right">예상 창업 비용</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((franchise, index) => (
                <TableRow
                  key={`${franchise.brandCode}-${index}`}
                  className="hover:bg-muted"
                >
                  <TableCell className="font-medium text-foreground">
                    {franchise.brandName}
                  </TableCell>
                  <TableCell>{franchise.companyName ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-foreground">
                    {franchise.startupCostTotal == null
                      ? "-"
                      : `${franchise.startupCostTotal.toLocaleString()}만원`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
