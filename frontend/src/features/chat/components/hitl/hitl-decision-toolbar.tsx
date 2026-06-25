"use client"

import type { HitlDecisionType } from "@/features/chat/types/hitl-interrupt-payload"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

type HitlDecisionToolbarProps = {
  activeDecision: HitlDecisionType
  allowedDecisions: HitlDecisionType[]
  onSelect: (decision: HitlDecisionType) => void
}

const LABELS: Record<HitlDecisionType, string> = {
  approve: "승인",
  edit: "수정",
  reject: "거절",
  respond: "응답",
}

export function HitlDecisionToolbar({
  activeDecision,
  allowedDecisions,
  onSelect,
}: HitlDecisionToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
      {allowedDecisions.map((decision) => (
        <Button
          key={decision}
          variant="ghost"
          size="sm"
          onClick={() => onSelect(decision)}
          className={cn(
            "h-7 cursor-pointer rounded-md px-2 text-xs",
            activeDecision === decision &&
              "bg-background text-foreground shadow-sm"
          )}
        >
          {LABELS[decision]}
        </Button>
      ))}
    </div>
  )
}
