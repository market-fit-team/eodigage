// src/app/page.tsx
import Link from "next/link"
import { getServerSession } from "@/features/auth/lib/server-session"
import { Button } from "@/shared/components/ui/button"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await getServerSession()

  return (
    <main>
      <h1>Home</h1>

      <ul>
        {HOME_LINKS.map((link) => (
          <li key={link.href}>
            <Button asChild variant="link">
              <Link href={link.href}>{link.label}</Link>
            </Button>
            <p>{link.description}</p>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(session ?? null, null, 2)}</pre>
    </main>
  )
}

const HOME_LINKS = [
  {
    href: "/sign-in",
    label: "/sign-in",
    description: "Better Auth 로그인 진입 페이지",
  },
  {
    href: "/dashboard",
    label: "/dashboard",
    description: "로그인하지 않은 사용자는 접근할 수 없는 보호 페이지",
  },
  {
    href: "/playground",
    label: "/playground",
    description: "세션, JWT, SSR 프리패치, hydration을 확인하는 실험 페이지",
  },
  {
    href: "/chat",
    label: "/chat",
    description: "LLM 채팅 화면 진입 페이지",
  },
  {
    href: "/community/posts",
    label: "/community/posts",
    description: "커뮤니티 게시글 목록 페이지",
  },
  {
    href: "/community/scheduled-posts",
    label: "/community/scheduled-posts",
    description: "예약 게시글 작성 흐름 페이지",
  },
  {
    href: "/animals",
    label: "/animals",
    description: "인터셉트 라우트와 패러렐 라우트를 실험하는 페이지",
  },
] as const
