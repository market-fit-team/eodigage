"use client"

import { ArrowRight, BookOpen, Sparkles } from "lucide-react"
import type { PostSourceType } from "@/features/post/types/post"
import { Skeleton } from "@/shared/components/ui/skeleton"

export type MainPostCarouselItem = {
  id: string
  title: string
  summary: string
  thumbnailUrl: string | null
  sourceType: PostSourceType
  createdAt: string
}

type MainPostCarouselWidgetProps = {
  posts?: MainPostCarouselItem[]
  isLoading?: boolean
  error?: string | null
  onPostClick?: (postId: string) => void
  showGenerator?: boolean
  isGenerating?: boolean
  generationError?: string | null
  onGenerate?: () => void
}

const sourceLabels: Record<PostSourceType, string> = {
  LLM_REPORT: "AI 칼럼",
  CRAWLING: "크롤링",
  MANUAL: "일반",
}

const isMockPost = (post: MainPostCarouselItem) =>
  post.id.startsWith("00000000")

const getBadgeLabel = (post: MainPostCarouselItem) => {
  if (isMockPost(post)) return "예시"
  if (post.sourceType === "LLM_REPORT") return "AI 칼럼"
  return sourceLabels[post.sourceType]
}

function LoadingState() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="게시글을 불러오는 중"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[220px] flex-col rounded-xl border border-neutral-200 bg-white p-5"
        >
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-5 h-6 w-5/6" />
          <Skeleton className="mt-2 h-6 w-3/4" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="mt-auto h-4 w-24" />
        </div>
      ))}
      <span className="sr-only">게시글을 불러오는 중입니다.</span>
    </div>
  )
}

export function MainPostCarouselWidget({
  posts = [],
  isLoading = false,
  error = null,
  onPostClick,
  showGenerator = false,
  isGenerating = false,
  generationError = null,
  onGenerate,
}: MainPostCarouselWidgetProps = {}) {
  const visiblePosts = posts.slice(0, 4)
  const shouldShowLoadingCards = isLoading || (isGenerating && posts.length === 0)

  return (
    <section className="space-y-4" aria-labelledby="main-post-carousel-title">
      <div className="flex items-end justify-between border-b border-neutral-200 pb-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Market intelligence
          </p>
          <h2
            id="main-post-carousel-title"
            className="flex items-center gap-2 text-xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-2xl"
          >
            <BookOpen className="size-5" aria-hidden="true" />
            뉴스 기반 창업 상권 AI 칼럼
          </h2>
        </div>
        {showGenerator ? (
          <div className="flex max-w-full flex-col items-end gap-2">
            <div className="flex w-full justify-end">
              <button
                type="button"
                disabled={isGenerating}
                className="h-9 shrink-0 rounded-lg bg-neutral-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                onClick={onGenerate}
              >
                {isGenerating
                  ? "AI 칼럼 생성 중..."
                  : "최신 뉴스로 AI 칼럼 생성"}
              </button>
            </div>
            {generationError ? (
              <p role="alert" className="text-xs text-red-600">
                {generationError}
              </p>
            ) : null}
          </div>
        ) : (
          <span className="hidden text-xs text-neutral-400 sm:block">
            최신 칼럼
          </span>
        )}
      </div>

      {shouldShowLoadingCards ? (
        <LoadingState />
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-14 text-center text-sm text-red-700"
        >
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 text-center">
          <Sparkles
            className="mb-3 size-6 text-neutral-400"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-neutral-700">
            아직 표시할 AI 칼럼이 없습니다.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            새로운 AI 칼럼이 발행되면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className="flex min-h-[240px] flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  {getBadgeLabel(post)}
                </span>
                <time
                  dateTime={post.createdAt}
                  className="shrink-0 text-xs text-neutral-500"
                >
                  {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </time>
              </div>
              <h3 className="mt-5 line-clamp-2 text-base leading-6 font-bold text-neutral-950">
                {post.title}
              </h3>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-neutral-600">
                {post.summary}
              </p>
              {onPostClick ? (
                <button
                  type="button"
                  aria-label={`${post.title} 게시글 보기`}
                  className="mt-auto flex h-9 w-fit items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() => onPostClick(post.id)}
                >
                  칼럼 보기
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
