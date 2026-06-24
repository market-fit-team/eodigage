"use client"

import { useMemo } from "react"
import { mapOnboardingSummary } from "@/features/llm-chat/lib/workspace/map-onboarding-summary"
import { useGetOnboardingContextApiV1AgentThreadsThreadIdOnboardingContextGet } from "@/shared/api/generated/agent/endpoints/agent-onboarding-context/agent-onboarding-context"

export function useChatWorkspaceOnboarding(threadId: string | null) {
  const query =
    useGetOnboardingContextApiV1AgentThreadsThreadIdOnboardingContextGet(
      threadId ?? "",
      {
        query: {
          enabled: Boolean(threadId),
        },
      }
    )

  const onboarding = useMemo(
    () => (query.data ? mapOnboardingSummary(query.data) : null),
    [query.data]
  )

  return {
    ...query,
    onboarding,
  }
}
