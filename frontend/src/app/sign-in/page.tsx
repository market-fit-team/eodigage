import Link from "next/link"
import { Sparkles } from "lucide-react"
import SignInClient from "@/features/auth/components/sign-in-client"

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2 text-lg font-black tracking-[-0.04em]"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-950 text-white">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Pickle
        </Link>

        <div className="mt-7 text-center">
          <h1 className="text-2xl font-black tracking-[-0.04em]">
            Pickle에 로그인
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            원하는 계정으로 간편하게 시작하세요.
          </p>
        </div>

        <SignInClientWrapper searchParams={searchParams} />
      </section>
    </main>
  )
}

async function SignInClientWrapper({
  searchParams,
}: {
  searchParams: PageProps<"/sign-in">["searchParams"]
}) {
  const params = await searchParams

  return (
    <SignInClient
      callbackURL={String(params?.callbackURL || "/")}
      error={String(params?.error || "")}
    />
  )
}
