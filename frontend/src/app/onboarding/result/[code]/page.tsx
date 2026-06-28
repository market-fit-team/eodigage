import { notFound } from "next/navigation"
import { OnboardingResultScreen } from "@/features/onboarding/components/result/onboarding-result-screen"
import { getOnboardingErrorStatus } from "@/features/onboarding/lib/onboarding-error"
import { getOnboardingResultByCode } from "@/features/onboarding/lib/onboarding-server-api"

export const dynamic = "force-dynamic"

const getSurveyResultOrNotFound = async (code: string) => {
  try {
    return await getOnboardingResultByCode(code)
  } catch (error) {
    if (getOnboardingErrorStatus(error) === 404) {
      notFound()
    }

    throw error
  }
}

export default async function OnboardingResultPage(
  props: PageProps<"/onboarding/result/[code]">
) {
  const { code } = await props.params
  const surveyResult = await getSurveyResultOrNotFound(code)

  return <OnboardingResultScreen surveyResult={surveyResult} />
}
