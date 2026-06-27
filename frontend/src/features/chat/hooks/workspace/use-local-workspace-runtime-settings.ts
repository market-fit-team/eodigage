"use client"

import { useMemo, useState } from "react"
import type {
  ChatModelSelectionControls,
  ToolPolicyControls,
} from "@/features/chat/hooks/langgraph-chat-stream-context"
import { clampReasoningEffort } from "@/features/chat/lib/model-selection/clamp-reasoning-effort"
import { buildToolPolicy } from "@/features/chat/lib/tool-policy/build-tool-policy"
import { buildToolPolicySummary } from "@/features/chat/lib/tool-policy/build-tool-policy-summary"
import {
  buildAllowedToolNamesForPreset,
  resolveToolPermissionPreset,
} from "@/features/chat/lib/tool-policy/tool-permission-presets"
import type { ToolPermissionPreset } from "@/features/chat/lib/tool-policy/tool-permission-presets"
import type {
  ChatModelOption,
  ChatReasoningEffort,
} from "@/features/chat/types/chat-model-selection"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"

type UseLocalWorkspaceRuntimeSettingsParams = {
  tools: LlmToolDefinition[]
  models: ChatModelOption[]
}

type LocalWorkspaceRuntimeControls = {
  modelSelection: ChatModelSelectionControls
  toolPolicy: ToolPolicyControls
}

export function useLocalWorkspaceRuntimeSettings({
  tools,
  models,
}: UseLocalWorkspaceRuntimeSettingsParams) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [selectedReasoningEffort, setSelectedReasoningEffort] =
    useState<ChatReasoningEffort | null>(null)
  const [selectedPreset, setSelectedPreset] =
    useState<ToolPermissionPreset>("allow-default")
  const [allowedToolNamesOverride, setAllowedToolNamesOverride] =
    useState<Set<string> | null>(null)

  const controls = useMemo<LocalWorkspaceRuntimeControls | null>(() => {
    const selectedModel =
      models.find((model) => model.id === selectedModelId) ?? models[0]

    if (!selectedModel) {
      return null
    }

    const fallbackReasoningEffort =
      selectedModel.supportedReasoningEfforts[0] ?? "none"
    const reasoningEffort = clampReasoningEffort(
      selectedReasoningEffort ?? fallbackReasoningEffort,
      selectedModel.supportedReasoningEfforts
    )
    const allowedToolNames =
      allowedToolNamesOverride ??
      buildAllowedToolNamesForPreset(tools, selectedPreset)
    const policy = buildToolPolicy(tools, allowedToolNames)
    const resolvedPreset =
      resolveToolPermissionPreset({
        tools,
        allowedTools: policy.allowedTools,
        interruptOn: policy.interruptOn,
      }) ?? selectedPreset

    return {
      modelSelection: {
        model: selectedModel.id,
        reasoningEffort,
        selectedModel,
        selectModel: (modelId: string) => {
          const nextModel = models.find((model) => model.id === modelId)
          if (!nextModel) {
            return
          }

          setSelectedModelId(nextModel.id)
          setSelectedReasoningEffort((current) =>
            clampReasoningEffort(
              current ?? reasoningEffort,
              nextModel.supportedReasoningEfforts
            )
          )
        },
        selectReasoningEffort: (nextReasoningEffort: ChatReasoningEffort) => {
          if (
            !selectedModel.supportedReasoningEfforts.includes(
              nextReasoningEffort
            )
          ) {
            return
          }

          setSelectedReasoningEffort(nextReasoningEffort)
        },
      },
      toolPolicy: {
        ...policy,
        summary: buildToolPolicySummary(
          tools.length,
          policy.allowedTools.length
        ),
        selectedPreset: resolvedPreset,
        selectPreset: (preset: ToolPermissionPreset) => {
          setSelectedPreset(preset)
          setAllowedToolNamesOverride(null)
        },
        toggleTool: (toolName: string) => {
          if (!tools.some((tool) => tool.name === toolName)) {
            return
          }

          setAllowedToolNamesOverride((current) => {
            const base =
              current ?? buildAllowedToolNamesForPreset(tools, resolvedPreset)
            const next = new Set(base)
            if (next.has(toolName)) {
              next.delete(toolName)
            } else {
              next.add(toolName)
            }
            return next
          })
        },
        resetToDefault: () => {
          setSelectedPreset("allow-default")
          setAllowedToolNamesOverride(null)
        },
      },
    }
  }, [
    allowedToolNamesOverride,
    models,
    selectedModelId,
    selectedPreset,
    selectedReasoningEffort,
    tools,
  ])

  return {
    controls,
    isLoading: false,
  }
}
