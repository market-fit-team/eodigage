// src/app/api/proxy/[...path]/route.ts
// 목적: 브라우저가 직접 JWT를 들고 다니지 않게 하거나,
// Next.js가 “gateway/BFF” 역할로 upstream(Kong 등)에 요청을 중계할 때 사용.
//
// JWT plugin은 /api/auth/token 으로 JWT를 발급해줍니다.
// https://better-auth.com/docs/plugins/jwt :contentReference[oaicite:33]{index=33}
//
// 세션 검증은 auth.api.getSession({ headers }) 패턴.
// https://better-auth.com/docs/integrations/next :contentReference[oaicite:34]{index=34}
import { type NextRequest } from "next/server"
import { auth } from "@/features/auth/lib/auth"
import { env } from "@/shared/config/env"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ path?: string[] }> }

const handler = async (req: NextRequest, ctx: Ctx) => {
  if (!env.UPSTREAM_API_BASE_URL) {
    return Response.json(
      { error: "UPSTREAM_API_BASE_URL is not set" },
      { status: 500 }
    )
  }

  // 1) 서버에서 세션 검증
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  if (!session) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  // 2) JWT 발급 (JWT plugin endpoint)
  // - 쿠키 기반 세션이므로 cookie를 그대로 전달하면 됨
  const cookie = req.headers.get("cookie") ?? ""
  const tokenRes = await fetch(new URL("/api/auth/token", req.nextUrl.origin), {
    method: "GET",
    headers: { cookie },
    cache: "no-store",
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "")
    return Response.json(
      { error: "FAILED_TO_ISSUE_JWT", detail: text },
      { status: 500 }
    )
  }

  const { token } = (await tokenRes.json()) as { token: string }
  if (!token) {
    return Response.json({ error: "EMPTY_JWT" }, { status: 500 })
  }

  // 3) upstream URL 구성
  const resolvedParams = await ctx.params
  const path = (resolvedParams.path ?? []).join("/")
  const upstream = new URL(path, env.UPSTREAM_API_BASE_URL)
  upstream.search = req.nextUrl.search // querystring 유지

  // 4) 헤더 정리 + 신뢰 가능한 user context 주입
  const upstreamHeaders = new Headers(req.headers)
  upstreamHeaders.delete("cookie")
  upstreamHeaders.delete("host")
  upstreamHeaders.delete("connection")
  upstreamHeaders.delete("content-length")

  // 기존 Authorization 제거 후, 검증된 JWT로 재주입 (spoofing 방지)
  upstreamHeaders.delete("authorization")
  upstreamHeaders.set("authorization", `Bearer ${token}`)

  // 내부 서비스가 편하게 쓰도록 user context를 헤더로도 넣어줌(선택)
  upstreamHeaders.set("x-user-id", session.user.id)
  upstreamHeaders.set("x-user-email", session.user.email)

  // 5) 바디 전달 (GET/HEAD는 body 금지)
  const method = req.method.toUpperCase()
  const body = method === "GET" || method === "HEAD" ? undefined : req.body

  const upstreamRes = await fetch(upstream, {
    method,
    headers: upstreamHeaders,
    body,
    redirect: "manual",
  })

  // 6) 응답 그대로 반환 (헤더는 최소한만 복사)
  const resHeaders = new Headers(upstreamRes.headers)
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
