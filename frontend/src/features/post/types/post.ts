export type PostCategory = "TREND" | "GUIDE" | "POLICY"
export type PostSourceType = "MANUAL" | "CRAWLING" | "LLM_REPORT"
export type PostVisibility = "PUBLIC" | "PRIVATE"
export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export type PostSummary = {
  id: string
  authorName: string
  title: string
  summary: string
  category: PostCategory
  readTimeMinutes: number
  sourceType: PostSourceType
  sourceUrl: string | null
  llmProvider: string | null
  publishedAt: string
}

export type PostDetail = PostSummary & {
  userId?: string
  authorId: string
  content: string
  thumbnailUrl?: string | null
  sourceId?: string | null
  status?: PostStatus
  visibility?: PostVisibility
  sourceTitle: string | null
  collectedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PostWriteInput = {
  title: string
  summary: string
  content: string
  category: PostCategory
  readTimeMinutes: number
  thumbnailUrl?: string | null
  status?: PostStatus
  visibility?: PostVisibility
}

export type MainPostCarouselSection = {
  id: string
  title: string
  description: string
  category: PostCategory
  posts: PostSummary[]
}

export type MyPostSummary = {
  totalCount: number
  publishedThisMonth: number
  llmReportCount: number
  recentPosts: PostSummary[]
}

export type CreateLlmReportInput = {
  url?: string
  rawContent?: string
  category?: PostCategory
}

export type CreateCrawlSummaryPostInput = {
  url: string | null
  keyword: string | null
  rawContent: string | null
  visibility: PostVisibility
}

export type CrawlPreview = {
  inputUrl: string | null
  inputUrlType: "SEARCH_RESULT" | "ARTICLE" | "RAW_CONTENT" | "UNKNOWN"
  discoveredArticleUrls: string[]
  crawledArticleCount: number
  skippedArticleCount: number
  usedSelector: string
  totalParagraphCount: number
  matchedParagraphCount: number
  matchedKeywords: string[]
  excludedKeywords: string[]
  relevanceScore: number
  extractedTextLength: number
  extractedTextPreview: string
}

export type CrawlSummaryPost = {
  status?: "SUMMARIZED" | "PARTIAL_SUMMARIZED"
  id: string
  postId?: string
  postIds?: string[]
  createdCount?: number
  failedCount?: number
  title: string
  summary: string
  thumbnailUrl: string | null
  sourceType: PostSourceType
  sourceId: string | null
  createdAt: string
  debug?: {
    llmProvider: string
    llmModel: string
    inputUrlType: "SEARCH_RESULT" | "ARTICLE" | "RAW_CONTENT" | "UNKNOWN"
    crawledArticleCount: number
    skippedArticleCount: number
    crawledTextLength: number
    matchedKeywords: string[]
    matchedParagraphCount: number
    relevanceScore: number
    llmStatus: "SUMMARIZED" | "FAILED"
    notificationEligible: boolean
    notificationCategory: "FRANCHISE" | null
  }
}

export type PostPage = {
  content: PostSummary[]
  totalElements: number
  totalPages: number
  number: number
  last: boolean
}
