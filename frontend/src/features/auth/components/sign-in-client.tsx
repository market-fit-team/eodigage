"use client"

import { ArrowRight, MessageCircle } from "lucide-react"
import { authClient } from "@/features/auth/lib/auth-client"
import { AUTHENTIK_PROVIDER_ID } from "@/features/auth/lib/auth-constants"

const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Google로 계속하기",
    icon: GoogleIcon,
    className:
      "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
    enabled: true,
  },
  {
    id: "kakao",
    label: "카카오로 계속하기",
    icon: KakaoIcon,
    className:
      "border-[#fee500] bg-[#fee500] text-[#191919] hover:bg-[#f5dc00]",
    enabled: false,
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    icon: NaverIcon,
    className: "border-[#03c75a] bg-[#03c75a] text-white hover:bg-[#02b351]",
    enabled: false,
  },
] as const

export default function SignInClient({
  callbackURL,
  error,
}: {
  callbackURL: string
  error?: string
}) {
  const signInWithAuthentik = async () => {
    await authClient.signIn.oauth2({
      providerId: AUTHENTIK_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: "/sign-in?error=oauth",
      scopes: ["openid", "profile", "email"],
    })
  }

  return (
    <div className="mt-8 space-y-3">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      {SOCIAL_PROVIDERS.map(({ id, label, icon: Icon, className, enabled }) => (
        <button
          key={id}
          type="button"
          disabled={!enabled}
          onClick={enabled ? signInWithAuthentik : undefined}
          className={`flex h-12 w-full items-center gap-3 rounded-lg border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
        >
          <Icon />
          <span className="flex-1 text-center">{label}</span>
          {enabled ? (
            <ArrowRight className="size-4" aria-hidden="true" />
          ) : (
            <span className="text-[10px] font-semibold">준비 중</span>
          )}
        </button>
      ))}

      <p className="pt-3 text-center text-xs leading-5 text-neutral-400">
        계속 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return <MessageCircle className="size-5 shrink-0 fill-current" aria-hidden />
}

function NaverIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center text-base font-black"
    >
      N
    </span>
  )
}
