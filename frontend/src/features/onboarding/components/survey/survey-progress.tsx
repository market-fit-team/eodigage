import { Progress } from "@/shared/components/ui/progress"

type SurveyProgressProps = {
  current: number
  total: number
}

export function SurveyProgress({ current, total }: SurveyProgressProps) {
  const percent = Math.round(((current + 1) / total) * 100)

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 52 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wider text-muted-foreground uppercase">
          질문 {current + 1} / {total}
        </span>
        <span className="text-xs font-semibold text-foreground tabular-nums">
          {percent}%
        </span>
      </div>

      <Progress value={percent} className="h-1.5" />

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
              index < current
                ? "w-1.5 bg-primary"
                : index === current
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
