// src/app/sign-in/page.tsx
import SignInClient from "@/features/auth/components/sign-in-client"

export default function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackURL?: string; error?: string }>
}) {
  return (
    <main>
      <h1>Sign in</h1>
      <SignInClientWrapper searchParams={searchParams} />
    </main>
  )
}

async function SignInClientWrapper({ searchParams }: { searchParams?: Promise<{ callbackURL?: string; error?: string }> }) {
  const params = await searchParams
  return (
    <SignInClient
      callbackURL={params?.callbackURL ?? "/dashboard"}
      error={params?.error}
    />
  )
}
