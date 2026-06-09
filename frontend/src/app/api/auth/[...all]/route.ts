// src/app/api/auth/[...all]/route.ts
// Better Auth를 Next App Router에 붙이는 공식 방식: toNextJsHandler(auth)
// 경로도 /api/auth/[...all] 유지 권장.
// https://better-auth.com/docs/integrations/next :contentReference[oaicite:31]{index=31}

import { auth } from "@/features/auth/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
