export const PUBLIC_POST_REPORT_SSE_EVENT = "post-report.created"
export const PUBLIC_POST_REPORT_BROWSER_EVENT = "public-post-report-created"

export const publicPostReportEventsUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/posts/events`

export type PublicPostReportBrowserEventDetail = {
  notificationCategory?: "FRANCHISE" | null
  message?: string | null
  postIds?: string[]
  createdCount?: number
  representativePostId?: string | null
  representativeTitle?: string | null
}

export const announcePublicPostReportCreated = (
  detail: PublicPostReportBrowserEventDetail = {}
) => {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(PUBLIC_POST_REPORT_BROWSER_EVENT, { detail })
  )
}
