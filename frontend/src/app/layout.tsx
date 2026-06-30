// src/app/layout.tsx
import type { Metadata } from "next"
import { AppShell } from "@/shared/components/layout/app-shell"
import { Toaster } from "@/shared/components/ui/sonner"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "어디가게",
    template: "%s | 어디가게",
  },
  description: "창업 성향과 상권 데이터를 함께 탐색하는 AI 창업 분석 서비스",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
