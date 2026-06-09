// src/app/layout.tsx
import type { ReactNode } from "react"
import UserNav from "@/features/auth/components/user-nav"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <UserNav />
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </body>
    </html>
  )
}
