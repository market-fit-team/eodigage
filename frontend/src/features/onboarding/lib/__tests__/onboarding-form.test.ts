import { describe, expect, it } from "vitest"
import { onboardingSurveyFixture } from "@/features/onboarding/testing/onboarding-fixtures"
import {
  DEFAULT_ONBOARDING_TOP_K,
  buildSaveSurveyResultRequest,
  buildSurveyPreviewRequest,
  hasAnsweredQuestion,
} from "../onboarding-form"

describe("onboarding-form", () => {
  it("단일 선택 문항 응답 여부를 판별한다", () => {
    const question = onboardingSurveyFixture.questions[0]

    expect(hasAnsweredQuestion(question, undefined)).toBe(false)
    expect(hasAnsweredQuestion(question, "")).toBe(false)
    expect(hasAnsweredQuestion(question, "A")).toBe(true)
  })

  it("다중 선택 문항 응답 여부를 판별한다", () => {
    const question = onboardingSurveyFixture.questions[9]

    expect(hasAnsweredQuestion(question, undefined)).toBe(false)
    expect(hasAnsweredQuestion(question, [])).toBe(false)
    expect(hasAnsweredQuestion(question, ["A"])).toBe(true)
  })

  it("설문 미리보기 요청 기본값을 채운다", () => {
    const request = buildSurveyPreviewRequest({
      answers: { q1: "A", q10: ["A", "D"] },
    })

    expect(request.top_k).toBe(DEFAULT_ONBOARDING_TOP_K)
    expect(request.profile_name).toBe("설문 결과 프로필")
    expect(request.preferred_category_code).toBe("CS100001")
  })

  it("설문 저장 요청 payload를 생성한다", () => {
    const request = buildSaveSurveyResultRequest({
      profileCode: "abc123",
      profileName: "내 결과",
      surveyResponseId: 42,
    })

    expect(request).toEqual({
      profile_code: "abc123",
      profile_name: "내 결과",
      survey_response_id: 42,
      top_k: DEFAULT_ONBOARDING_TOP_K,
    })
  })
})
