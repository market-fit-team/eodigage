"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  clampReasoningEffort,
  getDefaultReasoningEffort,
} from "@/features/chat/lib/model-selection/clamp-reasoning-effort"
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
import type { InterruptOnConfig } from "@/features/chat/types/interrupt-on-config"
import type { LlmToolDefinition } from "@/features/chat/types/llm-tool-definition"
import {
  getGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGetQueryKey,
  useGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGet,
  useUpdateThreadSettingsApiV1AgentThreadsThreadIdSettingsPut,
} from "@/shared/api/generated/agent/endpoints/agent-threads/agent-threads"
import type {
  ThreadSettingsResponse,
  UpdateThreadSettingsRequest,
} from "@/shared/api/generated/agent/schemas"

type UseWorkspaceRuntimeSettingsParams = {
  threadId: string | null
  tools: LlmToolDefinition[]
  models: ChatModelOption[]
}

type OptimisticContext = {
  previous?: ThreadSettingsResponse
  threadId: string
}

const toApiReasoningEffort = (
  reasoningEffort: ChatReasoningEffort
): UpdateThreadSettingsRequest["reasoning_effort"] => {
  return reasoningEffort
}

export function useWorkspaceRuntimeSettings({
  threadId,
  tools,
  models,
}: UseWorkspaceRuntimeSettingsParams) {
  const queryClient = useQueryClient()
  const effectiveThreadId = threadId ?? ""
  const settingsQuery =
    useGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGet(
      effectiveThreadId,
      {
        query: {
          enabled: Boolean(threadId),
        },
      }
    )
  const updateSettings =
    useUpdateThreadSettingsApiV1AgentThreadsThreadIdSettingsPut<
      Error,
      OptimisticContext
    >({
      mutation: {
        onMutate: async ({ threadId: targetThreadId, data }) => {
          const queryKey =
            getGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGetQueryKey(
              targetThreadId
            )
          await queryClient.cancelQueries({ queryKey })
          const previous =
            queryClient.getQueryData<ThreadSettingsResponse>(queryKey)
          if (previous) {
            queryClient.setQueryData<ThreadSettingsResponse>(queryKey, {
              ...previous,
              ...data,
            })
          }
          return { previous, threadId: targetThreadId }
        },
        onError: (_error, _variables, context) => {
          if (context?.previous) {
            queryClient.setQueryData(
              getGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGetQueryKey(
                context.threadId
              ),
              context.previous
            )
          }
        },
        onSuccess: (data, variables) => {
          queryClient.setQueryData(
            getGetThreadSettingsApiV1AgentThreadsThreadIdSettingsGetQueryKey(
              variables.threadId
            ),
            data
          )
        },
      },
    })

  const settings = settingsQuery.data ?? null

  const controls = useMemo(() => {
    if (!threadId || !settings) {
      return null
    }

    const modelId = settings.model ?? models[0]?.id
    if (!modelId) {
      throw new Error("사용 가능한 스레드 모델이 없습니다.")
    }

    const selectedModel = models.find((model) => model.id === modelId)
    if (!selectedModel) {
      throw new Error(`알 수 없는 스레드 모델입니다: ${modelId}`)
    }

    const fallbackReasoningEffort = getDefaultReasoningEffort(
      selectedModel.supportedReasoningEfforts
    )
    const requestedReasoningEffort =
      (settings.reasoning_effort as ChatReasoningEffort | null) ??
      fallbackReasoningEffort
    const reasoningEffort = selectedModel.supportedReasoningEfforts.includes(
      requestedReasoningEffort
    )
      ? requestedReasoningEffort
      : fallbackReasoningEffort

    const commit = (data: UpdateThreadSettingsRequest) => {
      updateSettings.mutate({ threadId, data })
    }
    const commitPolicy = (allowedToolNames: Set<string>) => {
      const nextPolicy = buildToolPolicy(tools, allowedToolNames)
      commit({
        model: modelId,
        reasoning_effort: toApiReasoningEffort(reasoningEffort),
        allowed_tools: nextPolicy.allowedTools,
        interrupt_on: nextPolicy.interruptOn,
      })
    }

    const allowedToolNames = new Set(settings.allowed_tools)
    const interruptOn = settings.interrupt_on as InterruptOnConfig
    const selectedPreset = resolveToolPermissionPreset({
      tools,
      allowedTools: settings.allowed_tools,
      interruptOn,
    })

    return {
      modelSelection: {
        model: modelId,
        reasoningEffort,
        selectedModel,
        selectModel: (modelId: string) => {
          const nextModel = models.find((model) => model.id === modelId)
          if (!nextModel) {
            return
          }
          commit({
            model: nextModel.id,
            reasoning_effort: toApiReasoningEffort(
              clampReasoningEffort(
                reasoningEffort,
                nextModel.supportedReasoningEfforts
              )
            ),
            allowed_tools: settings.allowed_tools,
            interrupt_on: settings.interrupt_on,
          })
        },
        selectReasoningEffort: (reasoningEffort: ChatReasoningEffort) => {
          if (
            !selectedModel.supportedReasoningEfforts.includes(reasoningEffort)
          ) {
            return
          }
          commit({
            model: modelId,
            reasoning_effort: toApiReasoningEffort(reasoningEffort),
            allowed_tools: settings.allowed_tools,
            interrupt_on: settings.interrupt_on,
          })
        },
      },
      toolPolicy: {
        allowedToolNames,
        allowedTools: settings.allowed_tools,
        interruptOn,
        summary: buildToolPolicySummary(
          tools.length,
          settings.allowed_tools.length
        ),
        selectedPreset,
        selectPreset: (preset: ToolPermissionPreset) => {
          commitPolicy(buildAllowedToolNamesForPreset(tools, preset))
        },
        toggleTool: (toolName: string) => {
          if (!tools.some((tool) => tool.name === toolName)) {
            return
          }
          const nextAllowedToolNames = new Set(allowedToolNames)
          if (nextAllowedToolNames.has(toolName)) {
            nextAllowedToolNames.delete(toolName)
          } else {
            nextAllowedToolNames.add(toolName)
          }
          commitPolicy(nextAllowedToolNames)
        },
        resetToDefault: () => {
          commitPolicy(buildAllowedToolNamesForPreset(tools, "allow-default"))
        },
      },
    }
  }, [models, settings, threadId, tools, updateSettings])

  return {
    ...settingsQuery,
    controls,
    isUpdating: updateSettings.isPending,
  }
}
