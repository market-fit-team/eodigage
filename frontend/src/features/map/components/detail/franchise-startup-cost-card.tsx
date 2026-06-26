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
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <WalletCards className="h-4 w-4 text-primary" />
          프랜차이즈 예상 창업 비용
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {franchises.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            표시할 프랜차이즈 예상 창업 비용 데이터가 없습니다.
          </p>
        ) : (
          <Table className="min-w-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead>브랜드</TableHead>
                <TableHead>운영사</TableHead>
                <TableHead className="text-right">예상 창업 비용</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((franchise, index) => (
                <TableRow key={`${franchise.brandCode}-${index}`}>
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
