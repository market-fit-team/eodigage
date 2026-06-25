import { X } from "lucide-react"
import { ScrapButton } from "@/features/map/components/preview/scrap-button"
import { Button } from "@/shared/components/ui/button"

type PreviewSummaryProps = {
  dongCode: string
  dongName: string
  onClose: () => void
  sigunguName: string
}

export function PreviewSummary({
  dongCode,
  dongName,
  onClose,
  sigunguName,
}: PreviewSummaryProps) {
  return (
    <div className="border-b border-border pb-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-foreground">{dongName}</h3>
        <div className="flex items-center gap-1.5">
          <ScrapButton target={{ id: dongCode, type: "dong" }} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="상세 패널 닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {sigunguName} · 행정동 코드 {dongCode}
      </p>
    </div>
  )
}
