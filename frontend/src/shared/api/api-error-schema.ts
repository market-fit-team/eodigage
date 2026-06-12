import { z } from "zod"

export const apiErrorInfoSchema = z.object({
  message: z.string(),
  status: z.number(),
  error: z.string(),
  path: z.string(),
  timestamp: z.string(),
})

export const apiErrorSchema = z.instanceof(Error).and(
  z.object({
    info: apiErrorInfoSchema,
    status: z.number(),
  })
)
