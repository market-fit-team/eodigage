import { z } from "zod"

/**
 * RFC 7807 Problem Details for HTTP APIs
 * 스프링 부트 등에서 표준으로 사용하는 에러 응답 규격입니다.
 */
export const problemDetailSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
})
