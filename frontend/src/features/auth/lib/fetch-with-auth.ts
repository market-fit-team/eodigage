// src/features/auth/lib/fetch-with-auth.ts
// JWT plugin: authClient.token()으로 JWT 받고, 외부 서비스에 Bearer로 전달하는 게 권장.
// https://better-auth.com/docs/plugins/jwt :contentReference[oaicite:30]{index=30}

import { authClient } from "./auth-client"

export const fetchWithAuth = async (input: string, init?: RequestInit) => {
  const { data, error } = await authClient.token()
  if (error || !data?.token) {
    throw new Error("Failed to issue JWT token from Better Auth")
  }

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${data.token}`,
    },
  })
}
