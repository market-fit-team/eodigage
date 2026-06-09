// src/features/auth/components/sign-in-client.tsx
"use client"

// Google OAuth는 socialProviders.google 설정 + signIn.social({ provider:"google" })로 동작.
// callback URL은 /api/auth/callback/google 형태로 Google Console에 등록해야 함.
// https://better-auth.com/docs/authentication/google :contentReference[oaicite:41]{index=41}
//
// signIn.social의 callbackURL / errorCallbackURL 옵션은 Basic Usage 문서에 명시.
// https://better-auth.com/docs/basic-usage :contentReference[oaicite:42]{index=42}

import { authClient } from "@/features/auth/lib/auth-client"

export default function SignInClient({
  callbackURL,
  error,
}: {
  callbackURL: string
  error?: string
}) {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      {error ? (
        <div style={{ padding: 12, background: "#ffecec" }}>
          Error: {error}
        </div>
      ) : null}

      <button
        onClick={async () => {
          await authClient.signIn.social({
            provider: "google",
            callbackURL,
            errorCallbackURL: "/sign-in?error=oauth",
          })
          // disableRedirect 기본값은 false라서(문서) 보통 여기서 provider로 자동 이동합니다.
          // https://better-auth.com/docs/basic-usage :contentReference[oaicite:43]{index=43}
        }}
      >
        Continue with Google
      </button>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        callbackURL: <code>{callbackURL}</code>
      </div>
    </div>
  )
}
