"use client"

import type { ToolPermissionPreset } from "@/features/chat/lib/tool-policy/tool-permission-presets"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

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
    <Select
      disabled={disabled}
      value={selectedPreset ?? "allow-default"}
      onValueChange={(value) => onSelectPreset(value as ToolPermissionPreset)}
    >
      <SelectTrigger
        size="default"
        aria-label="권한 변경"
        className="h-7 shrink-0 gap-1 rounded-lg border-transparent bg-transparent px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
      >
        <SelectValue placeholder="권한 변경" />
      </SelectTrigger>
      <SelectContent align="end">
        {permissionPresetItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
