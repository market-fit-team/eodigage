// src/app/layout.tsx
import { UserNav } from "@/features/auth/components/user-nav"
import { ClientOnly } from "@/shared/components/client-only"
import { Toaster } from "@/shared/components/ui/sonner"
import "./globals.css"
import { Providers } from "./providers"

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div>
            <ClientOnly fallback={<div>Loading session...</div>}>
              <UserNav />
            </ClientOnly>
          </div>
          <div>{children}</div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
