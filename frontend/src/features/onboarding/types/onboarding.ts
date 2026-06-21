import type {
  SurveyDefinitionResponseOutput,
  SurveyResultEnvelopeOutput,
} from "@/shared/api/generated/onboarding/schemas"

export type OnboardingSurvey = SurveyDefinitionResponseOutput
export type OnboardingSurveyQuestion = OnboardingSurvey["questions"][number]
export type OnboardingSurveyOption = OnboardingSurveyQuestion["options"][number]
export type OnboardingSurveyAnswerValue = string | string[]
export type OnboardingSurveyAnswers = Record<
  string,
  OnboardingSurveyAnswerValue
>
export type OnboardingSurveyResult = SurveyResultEnvelopeOutput
export type OnboardingProfile = OnboardingSurveyResult["profile"]
export type OnboardingUserProfile = OnboardingProfile["user_profile"]
export type OnboardingRecommendation =
  OnboardingSurveyResult["prediction"]["recommendations"][number]
