// src/app/api/session/route.ts
// 프론트/백엔드 디버깅용 “현재 세션 JSON”.
// 서버에서 auth.api.getSession({ headers }) 패턴 사용.
// https://better-auth.com/docs/concepts/api :contentReference[oaicite:32]{index=32}

import { auth } from "@/features/auth/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export const GET = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return Response.json({ session }, { status: 200 })
}
