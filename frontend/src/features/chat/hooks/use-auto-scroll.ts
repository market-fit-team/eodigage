import { useCallback, useRef } from "react"

export function useAutoScroll() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)

  const scrollToBottom = useCallback((force = false) => {
    const viewport = viewportRef.current?.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']"
    )

    if (!viewport) {
      return
    }
    if (!force && !shouldStickToBottomRef.current) {
      return
    }

    viewport.scrollTop = viewport.scrollHeight
  }, [])

  const onScroll = useCallback(() => {
    const viewport = viewportRef.current?.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']"
    )

    if (!viewport) {
      return
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 120
  }, [])

  return {
    viewportRef,
    onScroll,
    scrollToBottom,
  }
}
