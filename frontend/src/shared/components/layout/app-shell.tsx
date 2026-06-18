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
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 hover:opacity-90"
              >
                <span className="text-lg font-bold text-zinc-900">
                  Gemini <span className="text-blue-600">15</span>
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  Minimal
                </span>
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="flex space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 sm:text-sm ${
                      item.active
                        ? "bg-blue-50 font-bold text-blue-600"
                        : "text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Active User Tower Badge */}
            <div className="flex items-center">
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                <span>User Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Contents */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* Modern Simple Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Gemini 15. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/onboarding"
              className="transition-colors hover:text-blue-600"
            >
              성향 분석
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/map" className="transition-colors hover:text-blue-600">
              상권 지도
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
