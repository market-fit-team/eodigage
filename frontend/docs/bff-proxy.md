# BFF Proxy

브라우저가 `/api/proxy/...`로 보낸 요청은 쿠키를 들고 들어온다.  
Next.js route handler는 그 쿠키로 세션을 확인한 뒤, 서비스 쪽으로는 쿠키 대신 JWT를 보낸다.

```text
Browser
  -> /api/proxy/...
  -> Next.js route handler
  -> http://localhost:8080/api/...
  -> nginx
  -> backend service
```

`http://localhost:8080/api/`는 `UPSTREAM_API_BASE_URL` 기본값이다.

## 경로

```ts
type Ctx = { params: Promise<{ path?: string[] }> }

const handler = async (req: NextRequest, ctx: Ctx) => {
  // ...
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
```

```ts
const resolvedParams = await ctx.params
const path = (resolvedParams.path ?? []).join("/")
const upstream = new URL(path, env.UPSTREAM_API_BASE_URL)
upstream.search = req.nextUrl.search
```

```text
/api/proxy/community/api/v1/posts?cursor=abc
-> community/api/v1/posts?cursor=abc
-> http://localhost:8080/api/community/api/v1/posts?cursor=abc
-> nginx location /api/community/
-> community-service:8080
```

## 세션과 JWT

세션이 있으면 Next.js 서버가 `/api/auth/token`을 다시 호출해서 JWT를 만들고, 서비스 쪽에는 그 토큰만 전달한다.

```ts
const session = await auth.api.getSession({
  headers: req.headers,
})

let accessToken: string | undefined

if (session) {
  const tokenRes = await fetch(new URL("/api/auth/token", req.nextUrl.origin), {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  })

  const tokenJson = (await tokenRes.json()) as { token?: string }
  accessToken = tokenJson.token
}
```
서비스는 브라우저 쿠키를 직접 읽지 않고, 프론트엔드가 다시 발급한 JWT를 읽는다.

## 헤더

`cookie`와 브라우저 `authorization`은 지워진다.

```ts
const upstreamHeaders = new Headers(req.headers)

upstreamHeaders.delete("cookie")
upstreamHeaders.delete("host")
upstreamHeaders.delete("content-length")
upstreamHeaders.delete("connection")
upstreamHeaders.delete("authorization")
```

세션이 있으면 서버가 만든 JWT가 들어간다.

```ts
if (accessToken) {
  upstreamHeaders.set("authorization", `Bearer ${accessToken}`)
}

if (session) {
  upstreamHeaders.set("x-user-id", session.user.id)
  upstreamHeaders.set("x-user-email", session.user.email)
}
```

```text
Browser request
  cookie: session=...
  authorization: whatever

Service request
  cookie: 없음
  authorization: Bearer <token from /api/auth/token>
  x-user-id: <session.user.id>
  x-user-email: <session.user.email>
```

## body

`GET`, `HEAD`를 제외하면 body를 `ArrayBuffer`로 읽어서 다시 보낸다.

```ts
const method = req.method.toUpperCase()

const requestBody =
  method === "GET" || method === "HEAD"
    ? undefined
    : await req.arrayBuffer()

const upstreamCtx: RequestInit = {
  method,
  headers: upstreamHeaders,
  redirect: "manual",
}

if (requestBody && requestBody.byteLength > 0) {
  upstreamCtx.body = requestBody
}
```

이 경로로 JSON과 `multipart/form-data` 둘 다 중계한다.

## prefix

```text
/api/proxy/profile
/api/proxy/community
/api/proxy/echo
/api/proxy/agent
```

- `orval.config.ts`
- `src/features/llm-chat/lib/agent-catalog/use-agent-catalog.ts`
- `src/app/playground/page.tsx`

## 주요 파일

- `src/app/api/proxy/[...path]/route.ts`
- `src/features/auth/lib/auth.ts`
- `src/shared/config/env.ts`
- `orval.config.ts`
- `src/app/playground/page.tsx`
- `src/features/llm-chat/lib/agent-catalog/use-agent-catalog.ts`

## 참고 문서

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js `route.ts` file convention: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Better Auth Next.js integration: https://better-auth.com/docs/integrations/next
- Better Auth JWT plugin: https://better-auth.com/docs/plugins/jwt
