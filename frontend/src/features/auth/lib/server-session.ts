// src/features/auth/lib/server-session.ts
// 서버(RSC/Server Action)에서 세션 가져오는 공식 패턴: auth.api.getSession({ headers: await headers() })
// https://better-auth.com/docs/integrations/next :contentReference[oaicite:28]{index=28}
// auth.api 개념 문서도 동일 패턴을 안내합니다.
// https://better-auth.com/docs/concepts/api :contentReference[oaicite:29]{index=29}

import { headers } from "next/headers"
import { auth } from "./auth"

export const getServerSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}
