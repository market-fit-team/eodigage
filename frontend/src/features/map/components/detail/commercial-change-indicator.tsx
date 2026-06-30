import { Activity } from "lucide-react"
import type { CommercialChangeIndicator } from "@/features/map/types/map"

type CommercialChangeIndicatorProps = {
  indicator: CommercialChangeIndicator
}

export function CommercialChangeIndicatorSection({
  indicator,
}: CommercialChangeIndicatorProps) {
  return (
    <section aria-labelledby="commercial-change-title">
      <h3
        id="commercial-change-title"
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Activity className="h-4 w-4" />
        </span>
        상권변화지표
      </h3>
      <div className="mt-4 flex items-start gap-4 rounded-xl border border-border bg-muted p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Activity className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-foreground">
              {indicator.label}
            </p>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
              {indicator.code}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {indicator.description}
          </p>
          <p className="mt-2.5 text-[10px] text-muted-foreground">
            서울시 생존·폐업 사업체의 평균 영업기간 비교 기준
          </p>
        </div>
      </div>
    </section>
  )
}
