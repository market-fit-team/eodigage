"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/features/auth/lib/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"

const getLoginHref = (pathname: string | null) => {
  const searchParams = new URLSearchParams({
    callbackURL: pathname ?? "/",
  })

  return `/login?${searchParams.toString()}`
}

export function HeaderAuthButton() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (isPending) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled
        aria-busy="true"
        aria-label="로그인 상태 확인 중"
        className="min-w-20 px-0 py-0"
      >
        <Spinner className="size-3.5 mx-auto my-auto" />
        <span className="sr-only">로그인 상태 확인 중</span>
      </Button>
    )
  }

  if (!session) {
    return (
      <Button
        asChild
        variant="outline"
        size="lg"
        className="min-w-20 px-3.5"
      >
        <Link href={getLoginHref(pathname)}>로그인</Link>
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          disabled={isSigningOut}
          className="min-w-20 px-3.5"
        >
          로그아웃
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            현재 세션이 종료되며 홈 화면으로 이동합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async () => {
              if (isSigningOut) return

              setIsSigningOut(true)

              try {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/")
                    },
                  },
                })
              } finally {
                setIsSigningOut(false)
              }
            }}
          >
            로그아웃
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
