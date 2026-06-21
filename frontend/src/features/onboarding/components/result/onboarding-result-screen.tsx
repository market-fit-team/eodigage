import type { OnboardingSurveyResult } from "@/features/onboarding/types/onboarding"
import { OnboardingResultActions } from "./onboarding-result-actions"
import { OnboardingResultContent } from "./onboarding-result-content"

type OnboardingResultScreenProps = {
  result: OnboardingSurveyResult
}

export function OnboardingResultScreen({
  result,
}: OnboardingResultScreenProps) {
  return (
    <OnboardingResultContent
      result={result}
      actions={<OnboardingResultActions result={result} />}
    />
  )
}
