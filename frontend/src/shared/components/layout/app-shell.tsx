"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileSpreadsheet,
  LayoutDashboard,
  Map,
  MessageCircleQuestion,
  User2,
} from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    {
      label: "홈",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      label: "성향분석",
      href: "/onboarding",
      icon: MessageCircleQuestion,
      active: pathname === "/onboarding",
    },
    {
      label: "상권지도",
      href: "/map",
      icon: Map,
      active: pathname === "/map",
    },
    {
      label: "AI 리포트",
      href: "/report",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/report"),
    },
    {
      label: "마이페이지",
      href: "/mypage",
      icon: User2,
      active: pathname === "/mypage",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  Gemini <span className="text-primary">15</span>
                </span>
                <Badge variant="secondary">Minimal</Badge>
              </Link>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({
                        variant: item.active ? "secondary" : "ghost",
                        size: "lg",
                      }),
                      "px-3"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center">
              <Link
                href="/mypage"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full px-3.5"
                )}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
                <span>User Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="w-full border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Gemini 15. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/onboarding"
              className="transition-colors hover:text-foreground"
            >
              성향 분석
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/map"
              className="transition-colors hover:text-foreground"
            >
              상권 지도
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
