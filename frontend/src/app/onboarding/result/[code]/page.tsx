import { notFound } from "next/navigation"
import { OnboardingResultScreen } from "@/features/onboarding/components/result/onboarding-result-screen"
import {
  getOnboardingErrorStatus,
  getOnboardingSurveyResultByCode,
} from "@/features/onboarding/lib/onboarding-server-api"

export const dynamic = "force-static"
export const revalidate = 3600

export default async function OnboardingResultPage(
  props: PageProps<"/onboarding/result/[code]">
) {
  const { code } = await props.params
  let result

  try {
    result = await getOnboardingSurveyResultByCode(code)
  } catch (error) {
    if (getOnboardingErrorStatus(error) === 404) {
      notFound()
    }

    throw error
  }

  return <OnboardingResultScreen result={result} />
}
