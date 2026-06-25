import type { InterruptOnConfig } from "@/features/chat/types/interrupt-on-config"

export interface ToolPolicyState {
  allowedToolNames: Set<string>
  allowedTools: string[]
  interruptOn: InterruptOnConfig
  summary: string
}
