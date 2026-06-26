import { fetchWithAuth } from "@/features/auth/lib/fetch-with-auth"
import type {
  CreateLlmReportInput,
  MainPostCarouselSection,
  MyPostSummary,
  PostComment,
  PostDetail,
  PostNotification,
  PostPage,
  PostWriteInput,
} from "@/features/post/types/post"

const postApiBaseUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/posts`
const mainPostApiUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/posts/main`
const postReportApiUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/v1/post-reports`

const parsePublicResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Post API request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const getMainPostCarousel = async () => {
  const response = await fetch(mainPostApiUrl, {
    next: { revalidate: 60 },
  })
  return parsePublicResponse<MainPostCarouselSection[]>(response)
}

export const getPosts = async (page = 0, size = 20) => {
  const response = await fetch(
    `${postApiBaseUrl}?page=${page.toString()}&size=${size.toString()}`,
    { cache: "no-store" }
  )
  return parsePublicResponse<PostPage>(response)
}

export const getPost = async (id: string) => {
  const response = await fetch(`${postApiBaseUrl}/${id}`, {
    cache: "no-store",
  })
  return parsePublicResponse<PostDetail>(response)
}

export const getPostComments = (postId: string) =>
  fetchWithAuth<PostComment[]>(`${postApiBaseUrl}/${postId}/comments`)

export const createPostComment = (postId: string, content: string) =>
  fetchWithAuth<PostComment>(`${postApiBaseUrl}/${postId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  })

export const updatePostComment = (
  postId: string,
  commentId: string,
  content: string
) =>
  fetchWithAuth<PostComment>(
    `${postApiBaseUrl}/${postId}/comments/${commentId}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    }
  )

export const deletePostComment = (postId: string, commentId: string) =>
  fetchWithAuth<void>(`${postApiBaseUrl}/${postId}/comments/${commentId}`, {
    method: "DELETE",
  })

export const getNotifications = () =>
  fetchWithAuth<PostNotification[]>(
    `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/notifications`
  )

export const markNotificationRead = (notificationId: string) =>
  fetchWithAuth<PostNotification>(
    `${process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"}/api/post/api/notifications/${notificationId}/read`,
    { method: "PATCH" }
  )

export const getMyPostSummary = () =>
  fetchWithAuth<MyPostSummary>(`${postApiBaseUrl}/me/summary`)

export const createPost = (input: PostWriteInput) =>
  fetchWithAuth<PostDetail>(postApiBaseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

export const updatePost = (id: string, input: PostWriteInput) =>
  fetchWithAuth<PostDetail>(`${postApiBaseUrl}/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

export const deletePost = (id: string) =>
  fetchWithAuth<void>(`${postApiBaseUrl}/${id}`, { method: "DELETE" })

export const createLlmReport = (input: CreateLlmReportInput) =>
  fetchWithAuth<PostDetail>(postReportApiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
