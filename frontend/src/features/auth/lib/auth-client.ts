// src/features/auth/lib/auth-client.ts
// Next.js에서 React 클라이언트는 better-auth/react에서 createAuthClient를 import 하라고 명시.
// https://better-auth.com/docs/integrations/next :contentReference[oaicite:25]{index=25}
//
// JWT client plugin을 붙이면 authClient.token()으로 JWT 발급 가능.
// https://better-auth.com/docs/plugins/jwt :contentReference[oaicite:26]{index=26}
//
// useSession은 reactive hook으로 공식 제공.
// https://better-auth.com/docs/basic-usage :contentReference[oaicite:27]{index=27}

import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [jwtClient()],
})

export const { signIn, signOut, useSession, getSession, token } = authClient
