"use client"

import type {
  ChatModelOption,
  ChatReasoningEffort,
} from "@/features/chat/types/chat-model-selection"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

type ChatModelMenuProps = {
  models: ChatModelOption[]
  selectedModel: ChatModelOption
  selectedReasoningEffort: ChatReasoningEffort
  onSelectModel: (modelId: string) => void
  onSelectReasoningEffort: (reasoningEffort: ChatReasoningEffort) => void
  disabled?: boolean
}

const reasoningEffortLabel: Record<ChatReasoningEffort, string> = {
  none: "없음",
  low: "낮음",
  medium: "중간",
  high: "높음",
}

export function ChatModelMenu({
  models,
  selectedModel,
  selectedReasoningEffort,
  onSelectModel,
  onSelectReasoningEffort,
  disabled,
}: ChatModelMenuProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Select
        disabled={disabled}
        value={selectedModel.id}
        onValueChange={onSelectModel}
      >
        <SelectTrigger
          size="default"
          aria-label="모델 선택"
          className="h-7 max-w-[11rem] gap-1 rounded-lg border-transparent bg-transparent px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
        >
          <SelectValue placeholder="모델 선택" />
        </SelectTrigger>
        <SelectContent align="start">
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={selectedReasoningEffort}
        onValueChange={(value) =>
          onSelectReasoningEffort(value as ChatReasoningEffort)
        }
      >
        <SelectTrigger
          size="default"
          aria-label="추론 수준 선택"
          className="h-7 max-w-[9rem] gap-1 rounded-lg border-transparent bg-transparent px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
        >
          <SelectValue placeholder="추론 수준 선택" />
        </SelectTrigger>
        <SelectContent align="start">
          {selectedModel.supportedReasoningEfforts.map((effort) => (
            <SelectItem key={effort} value={effort}>
              {reasoningEffortLabel[effort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
