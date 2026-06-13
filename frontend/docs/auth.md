# Authentication

인증 설정은 `src/features/auth/lib/auth.ts`에 있다.  
클라이언트는 세션 쿠키를 쓰고, 백엔드 서비스 호출용 JWT는 별도로 발급한다.

## `betterAuth()`

```ts
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: env.JWT_ALGORITHM,
          modulusLength: 2048,
        },
      },
      jwt: {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        expirationTime: env.JWT_EXPIRATION,
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
        }),
      },
    }),
    nextCookies(),
  ],
})
```

- `baseURL`: OAuth callback URL 구성에 직접 쓰인다.
- `jwt()`: `/api/auth/token`, `/api/auth/jwks`를 만든다.
- `nextCookies()`: server action이나 route handler에서 쿠키 반영을 맡는다.

`JWT_ALGORITHM`은 현재 `RS256`만 허용한다.

## `/api/auth/[...all]`

```ts
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/features/auth/lib/auth"

const handler = toNextJsHandler(auth)

export const GET = (req: NextRequest) => handler.GET(req)
export const POST = (req: NextRequest) => handler.POST(req)
```

```text
/api/auth/callback/google
/api/auth/token
/api/auth/jwks
```

## Google 로그인

```ts
await authClient.signIn.social({
  provider: "google",
  callbackURL,
  errorCallbackURL: "/sign-in?error=oauth",
})
```

```text
http://localhost:3000/api/auth/callback/google
```

## `authClient`

```ts
export const authClient = createAuthClient({
  plugins: [jwtClient()],
})

export const { signIn, signOut, useSession, getSession, token } = authClient
```

- `useSession()`: 클라이언트 세션 상태
- `jwtClient()`: `authClient.token()` 사용 가능

## 서버에서 세션 읽는 곳

```ts
export const getServerSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}
```

- `src/features/auth/lib/server-session.ts`
- `src/app/api/session/route.ts`
- `src/app/api/proxy/[...path]/route.ts`
- `src/proxy.ts`

```ts
export const config = {
  matcher: ["/dashboard/:path*"],
}
```

## JWT

세션은 브라우저 쿠키로 유지하고, JWT는 backend service가 읽을 토큰으로 따로 발급한다.

```text
Browser cookie
  -> auth.api.getSession(...)
  -> /api/auth/token
  -> Bearer JWT
  -> /api/proxy/[...path]
  -> nginx
  -> backend service
```

```ts
{
  id: user.id,
  email: user.email,
  name: user.name,
}
```

JWKS는 `/api/auth/jwks`에서 공개된다.

## `.env`

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRATION
JWT_ALGORITHM
```

```ts
const EnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  JWT_EXPIRATION: z.string().min(1),
  JWT_ALGORITHM: z.enum(["RS256"]).default("RS256"),
})
```

## Drizzle 테이블

```ts
export const user = pgTable("user", { ... })
export const account = pgTable("account", { ... })
export const session = pgTable("session", { ... })
export const verification = pgTable("verification", { ... })
export const jwks = pgTable("jwks", { ... })
```

```text
user / account / session / verification
  -> Better Auth core schema

jwks
  -> JWT plugin schema
```

## `/api/session`

```ts
export const GET = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return Response.json({ session }, { status: 200 })
}
```

## 주요 파일

- `src/features/auth/lib/auth.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/features/auth/lib/auth-client.ts`
- `src/features/auth/lib/server-session.ts`
- `src/app/api/session/route.ts`
- `src/features/auth/components/sign-in-client.tsx`
- `src/features/auth/components/user-nav.tsx`
- `src/shared/config/env.ts`
- `src/shared/db/schema.ts`
- `src/proxy.ts`

## 참고 문서

- Better Auth Next.js integration: https://www.better-auth.com/docs/integrations/next
- Better Auth JWT plugin: https://better-auth.com/docs/plugins/jwt
- Better Auth Google provider: https://www.better-auth.com/docs/authentication/google
- Better Auth Drizzle adapter: https://better-auth.com/docs/adapters/drizzle
- Better Auth database concepts: https://www.better-auth.com/docs/concepts/database
- Better Auth basic usage: https://better-auth.com/docs/basic-usage
- Next.js `proxy.ts` file convention: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
