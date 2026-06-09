// src/features/auth/components/user-nav.tsx
"use client"

// useSession: reactive 훅 공식 제공
// https://better-auth.com/docs/basic-usage :contentReference[oaicite:38]{index=38}
// signOut: 클라이언트 signOut 공식 제공
// https://better-auth.com/docs/basic-usage :contentReference[oaicite:39]{index=39}

import { useRouter } from "next/navigation"
import { authClient } from "@/features/auth/lib/auth-client"

export default function UserNav() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <div>Loading session...</div>

  if (!session) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <a href="/sign-in">Sign in</a>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div>
        Signed in as <b>{session.user.name}</b> ({session.user.email})
      </div>
      <button
        onClick={async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => router.push("/"),
            },
          })
        }}
      >
        Sign out
      </button>
    </div>
  )
}
