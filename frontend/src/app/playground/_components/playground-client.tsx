"use client"

// Client Component 예시:
// 1) authClient.token()으로 JWT 발급
// 2) 그 JWT로 nginx gateway 호출
//
// Better Auth JWT client plugin: authClient.token()
// https://better-auth.com/docs/plugins/jwt
import { useState } from "react"
import { authClient } from "@/features/auth/lib/auth-client"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type JsonObject = Record<string, unknown>
type GatewayResult = { ok: boolean; status: number; data: unknown }
type Result = GatewayResult | null

const parseJsonSafe = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text } satisfies JsonObject
  }
}

const callGateway = async (url: string, jwt: string): Promise<GatewayResult> => {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, data: parseJsonSafe(text) }
}

export default function PlaygroundClient({
  gatewayBase,
}: {
  gatewayBase: string
}) {
  const { data: session, isPending } = authClient.useSession()

  const [jwtPreview, setJwtPreview] = useState<string>("")
  const [profile, setProfile] = useState<Result>(null)
  const [echo, setEcho] = useState<Result>(null)
  const [error, setError] = useState<string>("")

  const issueJwtClient = async (): Promise<string | null> => {
    const tokenResult = await authClient.token()
    return tokenResult.data?.token || null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client</CardTitle>
        <CardDescription>
          Calling: <code>{gatewayBase}</code> (CORS handled by nginx)
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div>
          <h3>Session (client)</h3>
          <pre>
            {isPending
              ? "Loading..."
              : JSON.stringify(session ?? null, null, 2)}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
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
          </Button>

          <Button
            onClick={async () => {
              setError("")
              const token = await issueJwtClient()
              if (!token) return setError("NO_JWT (login first)")

              setProfile(
                await callGateway(`${gatewayBase}/api/profile/me`, token)
              )
            }}
          >
            2) Call /api/profile/me
          </Button>

          <Button
            onClick={async () => {
              setError("")
              const token = await issueJwtClient()
              if (!token) return setError("NO_JWT (login first)")

              setEcho(await callGateway(`${gatewayBase}/api/echo/echo`, token))
            }}
          >
            3) Call /api/echo/echo
          </Button>
        </div>

        {error ? <div>{error}</div> : null}

        <div>
          <h3>JWT preview</h3>
          <pre>{jwtPreview || "—"}</pre>
        </div>

        <div>
          <h3>profile response</h3>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>

        <div>
          <h3>echo response</h3>
          <pre>{JSON.stringify(echo, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
