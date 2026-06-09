"use client"

// Client Component 예시:
// 1) authClient.token()으로 JWT 발급
// 2) 그 JWT로 nginx gateway 호출
//
// Better Auth JWT client plugin: authClient.token()
// https://better-auth.com/docs/plugins/jwt

import { useState } from "react"
import { authClient } from "@/features/auth/lib/auth-client"

type JsonObject = Record<string, unknown>
type GatewayResult = { ok: boolean; status: number; data: unknown }
type Result = GatewayResult | null

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text } satisfies JsonObject
  }
}

function getTokenFromUnknown(input: unknown): string | null {
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

async function callGateway(url: string, jwt: string): Promise<GatewayResult> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, data: parseJsonSafe(text) }
}

export default function PlaygroundClient({ gatewayBase }: { gatewayBase: string }) {
  const { data: session, isPending } = authClient.useSession()

  const [jwtPreview, setJwtPreview] = useState<string>("")
  const [profile, setProfile] = useState<Result>(null)
  const [echo, setEcho] = useState<Result>(null)
  const [error, setError] = useState<string>("")

  async function issueJwtClient(): Promise<string | null> {
    const tokenResult = await authClient.token()
    // tokenResult.data 타입이 라이브러리 버전에 따라 달라져서 안전하게 unknown로 처리
    const token = getTokenFromUnknown((tokenResult as unknown as { data?: unknown }).data)
    return token
  }

  return (
    <section style={{ padding: 12, border: "1px solid #eee" }}>
      <h2>Client</h2>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Calling: <code>{gatewayBase}</code> (CORS handled by nginx)
      </div>

      <h3>Session (client)</h3>
      <pre style={{ padding: 12, background: "#f7f7f7", overflow: "auto" }}>
        {isPending ? "Loading..." : JSON.stringify(session ?? null, null, 2)}
      </pre>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={async () => {
            setError("")
            setProfile(null)
            setEcho(null)

            const token = await issueJwtClient()
            if (!token) {
              setJwtPreview("")
              setError("FAILED_TO_ISSUE_JWT (login first)")
              return
            }
            setJwtPreview(`${token.slice(0, 32)}…`)
          }}
        >
          1) Issue JWT (client)
        </button>

        <button
          onClick={async () => {
            setError("")
            const token = await issueJwtClient()
            if (!token) return setError("NO_JWT (login first)")

            setProfile(await callGateway(`${gatewayBase}/api/profile/me`, token))
          }}
        >
          2) Call /api/profile/me
        </button>

        <button
          onClick={async () => {
            setError("")
            const token = await issueJwtClient()
            if (!token) return setError("NO_JWT (login first)")

            setEcho(await callGateway(`${gatewayBase}/api/echo/echo`, token))
          }}
        >
          3) Call /api/echo/echo
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, background: "#ffecec" }}>
          {error}
        </div>
      ) : null}

      <h3>JWT preview</h3>
      <pre style={{ padding: 12, background: "#f7f7f7", overflow: "auto" }}>
        {jwtPreview || "—"}
      </pre>

      <h3>profile response</h3>
      <pre style={{ padding: 12, background: "#f7f7f7", overflow: "auto" }}>
        {JSON.stringify(profile, null, 2)}
      </pre>

      <h3>echo response</h3>
      <pre style={{ padding: 12, background: "#f7f7f7", overflow: "auto" }}>
        {JSON.stringify(echo, null, 2)}
      </pre>
    </section>
  )
}
