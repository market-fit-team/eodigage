"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bot,
  Home,
  LogOut,
  Map,
  Menu,
  Sparkles,
  User,
  UserRound,
} from "lucide-react"
import { authClient } from "@/features/auth/lib/auth-client"
import { Button } from "@/shared/components/ui/button"

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "AI 컨설팅", icon: Bot },
  { href: "/dashboard", label: "상권 지도", icon: Map },
  { href: "/mypage", label: "마이페이지", icon: UserRound },
] as const

export function UserNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-black tracking-[-0.04em]"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-neutral-950 text-white">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Pickle
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold tracking-normal text-neutral-600">
            Minimal
          </span>
        </Link>

        <nav className="absolute top-0 left-1/2 hidden h-full -translate-x-1/2 items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === href : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-neutral-200 bg-white"
          >
            <Link href={session ? "/dashboard" : "/sign-in"}>
              <User className="size-3.5" aria-hidden="true" />
              <span className="max-w-24 truncate">
                {isPending
                  ? "확인 중"
                  : session?.user.name || session?.user.email || "로그인"}
              </span>
            </Link>
          </Button>

          {session ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="로그아웃"
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/"),
                  },
                })
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="메뉴"
            asChild
          >
            <Link href="/community/posts">
              <Menu className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
