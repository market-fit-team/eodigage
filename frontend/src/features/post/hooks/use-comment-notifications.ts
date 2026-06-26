"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { authClient, useSession } from "@/features/auth/lib/auth-client"
import { AUTHENTIK_PROVIDER_ID } from "@/features/auth/lib/auth-constants"
import type { PostNotification } from "@/features/post/types/post"

type UseCommentNotificationsOptions = {
  onOpenPost?: (postId: string) => void
}

const notificationEventsUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/notifications/events`

const parseNotification = (event: MessageEvent): PostNotification | null => {
  try {
    return JSON.parse(event.data) as PostNotification
  } catch {
    return null
  }
}

export function useCommentNotifications({
  onOpenPost,
}: UseCommentNotificationsOptions = {}) {
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (isPending || !session || typeof EventSource === "undefined") {
      return
    }

    let eventSource: EventSource | null = null
    let closed = false

    authClient
      .getAccessToken({ providerId: AUTHENTIK_PROVIDER_ID })
      .then(({ data }) => {
        if (closed || !data?.accessToken) return

        const url = new URL(notificationEventsUrl)
        url.searchParams.set("token", data.accessToken)
        eventSource = new EventSource(url.toString())
        eventSource.addEventListener("notification.created", (event) => {
          const notification = parseNotification(event as MessageEvent)
          if (!notification) return

          toast.info(notification.title, {
            description: notification.message,
            action: notification.targetPostId
              ? {
                  label: "보기",
                  onClick: () => onOpenPost?.(notification.targetPostId!),
                }
              : undefined,
          })
        })
      })
      .catch(() => {
        // Missing or expired client tokens should not break the page.
      })

    return () => {
      closed = true
      eventSource?.close()
    }
  }, [isPending, onOpenPost, session])
}
