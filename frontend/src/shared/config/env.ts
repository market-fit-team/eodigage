// src/shared/config/env.ts
// 런타임에서 env 누락으로 터지는 걸 방지 (특히 OAuth redirect_uri_mismatch 방지용 baseURL 중요)
// baseURL을 BETTER_AUTH_URL로 반드시 설정하라고 Google provider 문서에 명시되어 있습니다.
// https://better-auth.com/docs/authentication/google :contentReference[oaicite:7]{index=7}
// BETTER_AUTH_SECRET 최소 32자 요구도 Installation 문서에 명시.
// https://better-auth.com/docs/installation :contentReference[oaicite:8]{index=8}

const req = (name: string): string => {
  const v = process.env[name]
  if (!v) throw new Error(`[env] Missing ${name}`)
  return v
}

const opt = (name: string): string | undefined => {
  const v = process.env[name]
  return v && v.length > 0 ? v : undefined
}

const secret = req("BETTER_AUTH_SECRET")
if (secret.length < 32) {
  throw new Error("[env] BETTER_AUTH_SECRET must be at least 32 characters.")
}

export const env = {
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: req("BETTER_AUTH_URL"),

  DATABASE_URL: req("DATABASE_URL"),

  GOOGLE_CLIENT_ID: req("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: req("GOOGLE_CLIENT_SECRET"),

  JWT_ISSUER: req("JWT_ISSUER"),
  JWT_AUDIENCE: req("JWT_AUDIENCE"),
  JWT_EXPIRATION: req("JWT_EXPIRATION"),

  UPSTREAM_API_BASE_URL: opt("UPSTREAM_API_BASE_URL"),
} as const
