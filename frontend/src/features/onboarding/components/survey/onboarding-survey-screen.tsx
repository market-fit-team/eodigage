import { OnboardingStoreProvider } from "@/features/onboarding/stores/onboarding-store"
import type { OnboardingSurvey } from "@/features/onboarding/types/onboarding"
import { OnboardingSurveyClient } from "./onboarding-survey-client"

type OnboardingSurveyScreenProps = {
  survey: OnboardingSurvey
}

export function OnboardingSurveyScreen({
  survey,
}: OnboardingSurveyScreenProps) {
  return (
    <OnboardingStoreProvider survey={survey}>
      <OnboardingSurveyClient />
    </OnboardingStoreProvider>
  )
}
