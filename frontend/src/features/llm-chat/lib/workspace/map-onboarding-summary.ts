import type { ChatWorkspaceOnboardingSummary } from "@/features/llm-chat/types/workspace/chat-workspace"
import type { OnboardingContextResponse } from "@/shared/api/generated/agent/schemas"

export const mapOnboardingSummary = (
  onboarding: OnboardingContextResponse
): ChatWorkspaceOnboardingSummary => ({
  threadId: onboarding.thread_id,
  resultCode: onboarding.result_code,
  selectedCategoryCode: onboarding.selected_category_code,
  source: onboarding.source,
  updatedAt: onboarding.updated_at,
})
