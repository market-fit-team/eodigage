"use client"

import { ChevronDown } from "lucide-react"
import type { ToolPermissionPreset } from "@/features/chat/lib/tool-policy/tool-permission-presets"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"

type ChatToolPermissionMenuProps = {
  disabled?: boolean
  selectedPreset: ToolPermissionPreset | null
  onSelectPreset: (preset: ToolPermissionPreset) => void
}

const permissionPresetItems: {
  value: ToolPermissionPreset
  label: string
}[] = [
  { value: "allow-all", label: "전체 허용" },
  { value: "allow-default", label: "읽기만 허용" },
  { value: "review-all", label: "승인 필요" },
]

export function ChatToolPermissionMenu({
  disabled,
  selectedPreset,
  onSelectPreset,
}: ChatToolPermissionMenuProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="h-7 shrink-0 gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">권한 변경</span>
                  <ChevronDown className="size-3.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuRadioGroup
                  value={selectedPreset ?? ""}
                  onValueChange={(value) =>
                    onSelectPreset(value as ToolPermissionPreset)
                  }
                >
                  {permissionPresetItems.map((item) => (
                    <DropdownMenuRadioItem
                      key={item.value}
                      value={item.value}
                      className="py-2"
                    >
                      {item.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent>권한 변경</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
