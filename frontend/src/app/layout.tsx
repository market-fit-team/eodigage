// src/app/layout.tsx
import UserNav from "@/features/auth/components/user-nav"
import "./globals.css"

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <div>
          <UserNav />
        </div>
        <div>{children}</div>
      </body>
    </html>
  )
}
