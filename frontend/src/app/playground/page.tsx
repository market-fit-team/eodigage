// src/app/playground/page.tsx
// Server Component 예시:
// 1) 현재 요청의 cookie로 Better Auth token endpoint 호출 → JWT 발급
// 2) 그 JWT로 nginx gateway(/api/profile, /api/echo) 호출
//
// Better Auth JWT plugin: /api/auth/token, /api/auth/jwks
// https://better-auth.com/docs/plugins/jwt
import { headers } from "next/headers"
import { getServerSession } from "@/features/auth/lib/server-session"
import PlaygroundClient from "./_components/playground-client"

export const dynamic = "force-dynamic"

type JsonObject = Record<string, unknown>
type GatewayResult = { ok: boolean; status: number; data: unknown }

const GATEWAY_BASE =
  process.env.GATEWAY_BASE_URL ??
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ??
  "http://localhost:8080"

const AUTH_BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

const parseJsonSafe = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text } satisfies JsonObject
  }
}

const getTokenFromUnknown = (input: unknown): string | null => {
  if (!input || typeof input !== "object") return null
  const obj = input as JsonObject

  if (typeof obj.token === "string") return obj.token

  const data = obj.data
  if (data && typeof data === "object") {
    const dataObj = data as JsonObject
    if (typeof dataObj.token === "string") return dataObj.token
  }

  return null
}

const issueJwtFromCookie = async (): Promise<string | null> => {
  const h = await headers()
  const cookie = h.get("cookie") ?? ""
  if (!cookie) return null

  const res = await fetch(`${AUTH_BASE}/api/auth/token`, {
    method: "GET",
    headers: { cookie }, // ✅ 서버에서 세션 쿠키 전달
    cache: "no-store",
  })

  if (!res.ok) return null

  const text = await res.text()
  const json = parseJsonSafe(text)
  return getTokenFromUnknown(json)
}

const fetchGateway = async (path: string, jwt: string): Promise<GatewayResult> => {
  const res = await fetch(`${GATEWAY_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`, // ✅ nginx로 JWT 전달
    },
    cache: "no-store",
  })

  const text = await res.text()
  return { ok: res.ok, status: res.status, data: parseJsonSafe(text) }
}

export default async function PlaygroundPage() {
  const session = await getServerSession()
  const jwt = await issueJwtFromCookie()

  const serverProfile: GatewayResult | null = jwt
    ? await fetchGateway("/api/profile/me", jwt)
    : null

  const serverEcho: GatewayResult | null = jwt
    ? await fetchGateway("/api/echo/echo", jwt)
    : null

  return (
    <main>
      <h1>/playground</h1>

      <section>
        <h2>Server</h2>
        <div>
          GATEWAY_BASE: <code>{GATEWAY_BASE}</code>
        </div>
        <div>
          AUTH_BASE: <code>{AUTH_BASE}</code>
        </div>

        <h3>Session (server)</h3>
        <pre>{JSON.stringify(session ?? null, null, 2)}</pre>

        <h3>JWT issued on server</h3>
        <pre>{jwt ? `${jwt.slice(0, 32)}…` : "NO_JWT (login first)"}</pre>

        <h3>Call profile-service via nginx (server)</h3>
        <pre>{JSON.stringify(serverProfile, null, 2)}</pre>

        <h3>Call echo-service → profile-service via nginx (server)</h3>
        <pre>{JSON.stringify(serverEcho, null, 2)}</pre>
      </section>

      <PlaygroundClient gatewayBase={GATEWAY_BASE} />
    </main>
  )
}
