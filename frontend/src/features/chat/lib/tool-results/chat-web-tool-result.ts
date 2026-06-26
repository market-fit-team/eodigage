import { z } from "zod"

const webSearchResultItemSchema = z.object({
  rank: z.number().int().positive(),
  title: z.string().min(1),
  url: z.string().min(1),
  snippet: z.string(),
  engine: z.string().nullable(),
  engines: z.array(z.string()),
  published_date: z.string().nullable(),
})

export const chatWebSearchToolResultSchema = z.object({
  query: z.string().min(1),
  page: z.number().int().positive(),
  results_count: z.number().int().nonnegative().nullable(),
  results: z.array(webSearchResultItemSchema),
})

export const chatWebFetchToolResultSchema = z.object({
  requested_url: z.string().min(1),
  final_url: z.string().min(1),
  status_code: z.number().int().nonnegative(),
  content_type: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  truncated: z.boolean(),
})

export type ChatWebSearchToolResult = z.infer<
  typeof chatWebSearchToolResultSchema
>
export type ChatWebFetchToolResult = z.infer<
  typeof chatWebFetchToolResultSchema
>

const parseToolPayload = (value: unknown) => {
  if (typeof value !== "string") {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export const parseChatWebSearchToolResult = (
  value: unknown
): ChatWebSearchToolResult | null => {
  const result = chatWebSearchToolResultSchema.safeParse(
    parseToolPayload(value)
  )
  return result.success ? result.data : null
}

export const parseChatWebFetchToolResult = (
  value: unknown
): ChatWebFetchToolResult | null => {
  const result = chatWebFetchToolResultSchema.safeParse(parseToolPayload(value))
  return result.success ? result.data : null
}
