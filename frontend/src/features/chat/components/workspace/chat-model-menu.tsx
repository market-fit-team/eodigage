"use client"

import { Check, ChevronDown } from "lucide-react"
import type {
  ChatModelOption,
  ChatReasoningEffort,
} from "@/features/chat/types/chat-model-selection"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 max-w-[11rem] gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="truncate">{selectedModel.id}</span>
            <ChevronDown className="size-3.5 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {models.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => onSelectModel(model.id)}
              className="gap-2 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {model.id}
              </span>
              <Check
                className={cn(
                  "size-4 text-foreground",
                  model.id === selectedModel.id ? "opacity-100" : "opacity-0"
                )}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 max-w-[9rem] gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="truncate">
              {reasoningEffortLabel[selectedReasoningEffort]}
            </span>
            <ChevronDown className="size-3.5 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {selectedModel.supportedReasoningEfforts.map((effort) => (
            <DropdownMenuItem
              key={effort}
              onSelect={() => onSelectReasoningEffort(effort)}
              className="gap-2 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {reasoningEffortLabel[effort]}
              </span>
              <Check
                className={cn(
                  "size-4 text-foreground",
                  effort === selectedReasoningEffort
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
