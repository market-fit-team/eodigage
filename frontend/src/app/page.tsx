// src/app/page.tsx
import { getServerSession } from "@/features/auth/lib/server-session"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await getServerSession()

  return (
    <main>
      <h1>Home</h1>
      <pre style={{ padding: 12, background: "#f7f7f7" }}>
        {JSON.stringify(session ?? null, null, 2)}
      </pre>

      <ul>
        <li>
          <a href="/sign-in">/sign-in</a>
        </li>
        <li>
          <a href="/dashboard">/dashboard</a>
        </li>
        <li>
          <a href="/playground">/playground</a>
        </li>
        <li>
          <a href="/api/session">/api/session</a>
        </li>
        <li>
          <a href="/api/auth/jwks">/api/auth/jwks (JWKS)</a>
        </li>
        <li>
          <a href="/api/auth/token">/api/auth/token (JWT)</a>
        </li>
      </ul>
    </main>
  )
}
