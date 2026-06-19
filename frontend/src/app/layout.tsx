// src/app/layout.tsx
import type { ReactNode } from "react"
import { UserNav } from "@/features/auth/components/user-nav"
import { ClientOnly } from "@/shared/components/client-only"
import { Toaster } from "@/shared/components/ui/sonner"
import "./globals.css"
import { Providers } from "./providers"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <ClientOnly
            fallback={
              <div className="h-14 border-b border-neutral-200 bg-white" />
            }
          >
            <UserNav />
          </ClientOnly>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
