"use client"

import { useEffect, useState } from "react"
import { Bookmark } from "lucide-react"
import { toast } from "sonner"
import { createCrawlSummaryPost } from "@/features/post/api/create-crawl-summary-post"
import { getPost } from "@/features/post/api/post-api"
import { MainPostCarouselWidget } from "@/features/post/components/main-post-carousel-widget/main-post-carousel-widget"
import { useMainPosts } from "@/features/post/hooks/use-main-posts"
import { usePublicPostReportNotification } from "@/features/post/hooks/use-public-post-report-notification"
import { announcePublicPostReportCreated } from "@/features/post/lib/public-post-report-events"
import type { PostDetail } from "@/features/post/types/post"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Skeleton } from "@/shared/components/ui/skeleton"

type MainPostCarouselWidgetContainerProps = {
  limit?: number
  onPostClick?: (postId: string) => void
}

const isAiColumnGeneratorEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_AI_COLUMN_GENERATOR === "true" ||
  process.env.VITE_ENABLE_AI_COLUMN_GENERATOR === "true"

const getReportBody = (detail: PostDetail) => {
  const lines = detail.content.split(/\r?\n/)
  const firstContentLineIndex = lines.findIndex((line) => line.trim() !== "")
  if (firstContentLineIndex < 0) return detail.content

  const firstLine = lines[firstContentLineIndex].trim()
  const headingTitle = firstLine.replace(/^#\s*/, "").trim()
  if (firstLine.startsWith("# ") && headingTitle === detail.title.trim()) {
    return lines
      .slice(firstContentLineIndex + 1)
      .join("\n")
      .trim()
  }

  return detail.content.trim()
}

export function MainPostCarouselWidgetContainer({
  limit = 4,
  onPostClick,
}: MainPostCarouselWidgetContainerProps) {
  usePublicPostReportNotification()
  const { posts, isLoading, error } = useMainPosts(limit)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedPostId) {
      setDetail(null)
      setDetailError(null)
      setIsDetailLoading(false)
      return
    }

    let ignore = false
    setDetail(null)
    setDetailError(null)
    setIsDetailLoading(true)

    getPost(selectedPostId)
      .then((post) => {
        if (ignore) return
        setDetail(post)
      })
      .catch((cause: unknown) => {
        if (ignore) return
        setDetailError(
          cause instanceof Error && cause.message
            ? cause.message
            : "리포트 전문을 불러오지 못했습니다."
        )
      })
      .finally(() => {
        if (ignore) return
        setIsDetailLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedPostId])

  const handlePostClick = (postId: string) => {
    if (onPostClick) {
      onPostClick(postId)
      return
    }
    setSelectedPostId(postId)
  }

  const handleSaveColumn = (postId: string) => {
    // TODO: 마이페이지 칼럼 저장 API 연결 예정
    // POST /api/my/saved-posts/{postId}
    // GET /api/my/saved-posts
    // DELETE /api/my/saved-posts/{postId}
    void postId
    toast.info("저장 기능은 준비 중입니다.")
  }

  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const result = await createCrawlSummaryPost({
        url: null,
        keyword: "프랜차이즈 창업",
        rawContent: null,
        visibility: "PUBLIC",
      })
      announcePublicPostReportCreated({
        postIds: result.postIds,
        createdCount: result.createdCount,
        representativePostId: result.postId ?? result.id,
        representativeTitle: result.title,
      })
    } catch (cause: unknown) {
      setGenerationError(
        cause instanceof Error && cause.message
          ? cause.message
          : "AI 칼럼을 생성하지 못했습니다."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <MainPostCarouselWidget
        posts={posts}
        isLoading={isLoading}
        error={error}
        onPostClick={handlePostClick}
        showGenerator={isAiColumnGeneratorEnabled()}
        isGenerating={isGenerating}
        generationError={generationError}
        onGenerate={handleGenerate}
      />
      <Dialog
        open={selectedPostId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPostId(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <DialogTitle className="text-lg font-bold text-neutral-950">
                {detail?.title ?? "칼럼 전문"}
              </DialogTitle>
              <div aria-label="칼럼 상세 액션" className="shrink-0">
                {detail ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="gap-1.5"
                    onClick={() => handleSaveColumn(detail.id)}
                  >
                    <Bookmark aria-hidden="true" className="size-4" />
                    칼럼 저장
                  </Button>
                ) : null}
              </div>
            </div>
            <DialogDescription>
              {detail
                ? `${new Date(detail.createdAt).toLocaleDateString("ko-KR")} · ${detail.readTimeMinutes}분 읽기`
                : "AI 칼럼 상세 내용을 불러오는 중입니다."}
            </DialogDescription>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailError ? (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
            >
              {detailError}
            </div>
          ) : detail ? (
            <article>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-7 whitespace-pre-wrap text-neutral-800">
                {getReportBody(detail)}
              </div>
            </article>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
