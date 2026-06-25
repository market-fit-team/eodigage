import { fetchWithAuth } from "@/features/auth/lib/fetch-with-auth"
import type {
  CrawlSummaryPost,
  CreateCrawlSummaryPostInput,
} from "@/features/post/types/post"

const crawlSummaryApiUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/posts/crawl-summary`

const createHeaders = () => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  }

  if (process.env.NODE_ENV !== "production") {
    headers["X-User-Id"] =
      process.env.NEXT_PUBLIC_LOCAL_USER_ID ?? "local-test-user"
  }

  return headers
}

export const createCrawlSummaryPost = (input: CreateCrawlSummaryPostInput) =>
  fetchWithAuth<CrawlSummaryPost>(crawlSummaryApiUrl, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(input),
  })
