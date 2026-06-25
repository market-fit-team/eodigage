import { buildResumeDecisions } from "@/features/chat/lib/hitl-decisions/build-resume-decisions"
import type { HitlDecisionDraftMap } from "@/features/chat/types/hitl-decision-draft"
import type { HitlActionRequest } from "@/features/chat/types/hitl-interrupt-payload"

export type HitlDecisionFormValues = {
  drafts: HitlDecisionDraftMap
}

export const buildResumeDecisionsFromForm = (
  actionRequests: HitlActionRequest[],
  values: HitlDecisionFormValues
) => buildResumeDecisions(actionRequests, values.drafts)
