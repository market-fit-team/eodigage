const DEFAULT_THREAD_TITLE = "새 대화"
const MAX_THREAD_TITLE_LENGTH = 10

export const buildThreadTitle = (message: string) => {
  const normalized = message.trim().replace(/\s+/g, " ")
  const title = Array.from(normalized)
    .slice(0, MAX_THREAD_TITLE_LENGTH)
    .join("")

  return title || DEFAULT_THREAD_TITLE
}
