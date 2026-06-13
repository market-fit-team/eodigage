# React Query + SSR Dehydrate 패턴 가이드

이 프로젝트는 Next.js App Router 환경에서 `@tanstack/react-query`의 **SSR Prefetching (Dehydrate) 및 Suspense 패턴**을 사용합니다.

## 1. 초기화 (Providers)

클라이언트 사이드에서 전역으로 사용할 `QueryClient`를 초기화하고 주입합니다. 서버 간 상태 오염을 막기 위해 반드시 `useState` 내부에서 초기화해야 합니다.

```tsx
// src/app/providers.tsx
"use client"

import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MainErrorFallback } from "@/shared/components/errors/main-error-fallback"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 60 * 1000 },
        },
      })
  )

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  )
}
```

## 2. 에러 바운더리 (Error Boundary)

- **렌더링 & Suspense 에러**: 렌더링 중 발생하는 에러나 Query의 실패는 가장 가까운 `<ErrorBoundary>`가 자동으로 감지합니다.
- **이벤트 핸들러 에러**: `onClick` 같은 비동기 로직의 에러는 `react-error-boundary`의 `useErrorBoundary` 훅을 사용해 명시적으로 에러를 전달해야 합니다.

```tsx
"use client"

import { useErrorBoundary } from "react-error-boundary"
import { useSuspenseProfileQuery } from "@/features/playground/api/get-profile.client"

export default function ClientComponent() {
  const { showBoundary } = useErrorBoundary()

  const handleAction = async () => {
    try {
      const result = await someAsyncLogic()
    } catch (err) {
      showBoundary(err) // 강제로 에러 바운더리 발동
    }
  }

  return <button onClick={handleAction}>Action</button>
}
```

## 3. Suspense Query (클라이언트 훅)

데이터를 페칭할 때는 `useSuspenseQuery`를 사용하여, 로딩 상태를 `isPending` 변수가 아닌 React의 `<Suspense>`에게 위임합니다. 코드가 훨씬 간결해집니다.

```tsx
// src/features/[feature]/api/get-profile.client.ts
import { useSuspenseQuery } from "@tanstack/react-query"

export const profileQueryKey = (gatewayBase: string) =>
  ["profile", gatewayBase] as const

export const getProfileClient = async (gatewayBase: string, jwt: string) => {
  // ... fetch 로직
}

export function useSuspenseProfileQuery(gatewayBase: string, jwt: string) {
  return useSuspenseQuery({
    queryKey: profileQueryKey(gatewayBase),
    queryFn: () => getProfileClient(gatewayBase, jwt),
  })
}
```

## 4. SSR Prefetch 및 Dehydrate (서버 컴포넌트)

서스펜스 쿼리는 서버에서 쿼리 함수를 실행하는 특성이 있습니다. 디하이드레이트 패턴으로 프리페치를 할 수 있습니다.

```tsx
// src/app/playground/page.tsx
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { prefetchProfile } from "@/features/playground/api/get-profile.server"
import PlaygroundClient from "@/features/playground/components/playground-client"
import {
  PlaygroundErrorFallback,
  PlaygroundSuspenseFallback,
} from "@/features/playground/components/playground-fallback"

export default async function Page() {
  const queryClient = new QueryClient()

  // 1. 서버 사이드에서 데이터 미리 페칭 (Prefetch)
  await prefetchProfile(queryClient, "http://...", "jwt-token")

  return (
    <main>
      {/* 2. ErrorBoundary: 렌더링 및 페칭 에러 캐치 */}
      <ErrorBoundary FallbackComponent={PlaygroundErrorFallback}>
        {/* 3. Suspense: 데이터 로딩 시 Skeleton UI 제공 */}
        <Suspense fallback={<PlaygroundSuspenseFallback />}>
          {/* 4. HydrationBoundary: 서버 캐시를 클라이언트로 직렬화해서 전달 */}
          <HydrationBoundary state={dehydrate(queryClient)}>
            <PlaygroundClient />
          </HydrationBoundary>
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
```
