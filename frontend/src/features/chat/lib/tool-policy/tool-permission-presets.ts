import { buildToolPolicy } from "@/features/chat/lib/tool-policy/build-tool-policy"
import type { InterruptOnConfig } from "@/features/chat/types/interrupt-on-config"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"

export type ToolPermissionPreset = "allow-all" | "allow-default" | "review-all"

const hasToolName = (
  toolsByName: Map<string, LlmToolDefinition>,
  toolName: string
) => {
  return toolsByName.has(toolName)
}

const hasSameStrings = (left: string[], right: string[]) => {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

const getAllowedDecisions = (value: unknown, fallback: string[]): string[] => {
  if (value === null || typeof value !== "object") {
    return fallback
  }

  if (
    "allowedDecisions" in value &&
    Array.isArray(value.allowedDecisions) &&
    value.allowedDecisions.every((item) => typeof item === "string")
  ) {
    return value.allowedDecisions
  }

  if (
    "allowed_decisions" in value &&
    Array.isArray(value.allowed_decisions) &&
    value.allowed_decisions.every((item) => typeof item === "string")
  ) {
    return value.allowed_decisions
  }

  return fallback
}

const requiresApproval = ({
  allowedToolNames,
  interruptOn,
  toolName,
}: {
  allowedToolNames: Set<string>
  interruptOn: InterruptOnConfig
  toolName: string
}) => {
  const policy = interruptOn[toolName]

  if (policy === false) {
    return false
  }

  if (policy === undefined) {
    return !allowedToolNames.has(toolName)
  }

  return true
}

export const buildAllowedToolNamesForPreset = (
  tools: LlmToolDefinition[],
  preset: ToolPermissionPreset
) => {
  switch (preset) {
    case "allow-all":
      return new Set(tools.map((tool) => tool.name))
    case "review-all":
      return new Set<string>()
    case "allow-default":
      return new Set(
        tools.filter((tool) => tool.defaultAllowed).map((tool) => tool.name)
      )
  }
}

export const resolveToolPermissionPreset = ({
  tools,
  allowedTools,
  interruptOn,
}: {
  tools: LlmToolDefinition[]
  allowedTools: string[]
  interruptOn: InterruptOnConfig
}): ToolPermissionPreset | null => {
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]))
  const currentAllowedToolNames = new Set(allowedTools)

  if (
    allowedTools.length !== currentAllowedToolNames.size ||
    allowedTools.some((toolName) => !hasToolName(toolsByName, toolName))
  ) {
    return null
  }

  const presets: ToolPermissionPreset[] = [
    "allow-default",
    "allow-all",
    "review-all",
  ]

  for (const preset of presets) {
    const presetAllowedToolNames = buildAllowedToolNamesForPreset(tools, preset)

    if (
      presetAllowedToolNames.size !== currentAllowedToolNames.size ||
      [...presetAllowedToolNames].some(
        (toolName) => !currentAllowedToolNames.has(toolName)
      )
    ) {
      continue
    }

    const presetPolicy = buildToolPolicy(tools, presetAllowedToolNames)
    const matchesPreset = tools.every((tool) => {
      const currentNeedsApproval = requiresApproval({
        allowedToolNames: currentAllowedToolNames,
        interruptOn,
        toolName: tool.name,
      })
      const presetNeedsApproval = presetPolicy.interruptOn[tool.name] !== false

      if (currentNeedsApproval !== presetNeedsApproval) {
        return false
      }

      if (!currentNeedsApproval) {
        return true
      }

      return hasSameStrings(
        getAllowedDecisions(interruptOn[tool.name], tool.allowedDecisions),
        tool.allowedDecisions
      )
    })

    if (matchesPreset) {
      return preset
    }
  }

  return null
}
