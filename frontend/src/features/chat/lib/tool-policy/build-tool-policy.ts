import type { InterruptOnConfig } from "@/features/chat/types/interrupt-on-config"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"
import type { ToolPolicyState } from "@/features/chat/types/tool-policy-state"

export const buildToolPolicy = (
  tools: LlmToolDefinition[],
  allowedToolNames: Set<string>
): ToolPolicyState => {
  const allowedTools = tools
    .filter((tool) => allowedToolNames.has(tool.name))
    .map((tool) => tool.name)
  const allowedToolNameSet = new Set(allowedTools)
  const interruptOn: InterruptOnConfig = {}

  for (const tool of tools) {
    interruptOn[tool.name] = allowedToolNameSet.has(tool.name)
      ? false
      : { allowedDecisions: tool.allowedDecisions }
  }

  return {
    allowedToolNames: allowedToolNameSet,
    allowedTools,
    interruptOn,
    summary: "",
  }
}
