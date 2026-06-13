# Project Architecture README
> 이 문서는 프로젝트 루트에 배치하기 위한 아키텍처 중심 `README.md`이다.
> 코드를 일일이 열어보지 않아도 인증/인가, JWT, 프록시, Nginx, 각 서버의 역할, 커뮤니티 서버의 사용자 매핑 로직을 이해할 수 있도록 작성했다.
---
## 1. 한 줄 요약
이 프로젝트는 **Next.js가 Better Auth 기반 인증 서버 역할을 맡고**, **Next.js Route Handler가 BFF 프록시 역할을 수행하며**, **Nginx가 CORS와 서비스 라우팅을 담당하고**, **각 백엔드 서버가 Better Auth JWKS로 RS256 JWT를 검증하는 구조**이다.
핵심 인증 흐름은 다음이다.
```text
Browser
  -> Next.js App / Better Auth session
  -> Next.js /api/proxy/** Route Handler
  -> Better Auth /api/auth/token 에서 RS256 JWT 발급
  -> Nginx /api/** Gateway
  -> profile-service / echo-service / community-service
  -> 각 서비스가 JWKS로 JWT 검증
```
가장 중요한 도메인 흐름은 community-service에 있다.
```text
JWT sub
  -> provider_subject
  -> app_users row
  -> app_users.id
  -> posts / likes / notifications / media / scheduled_posts FK
```
---
## 2. 프로젝트 구조
```text
project-root
├── Makefile
├── docker-compose.yml
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── orval.config.ts
│   ├── drizzle.config.ts
│   ├── src/app/api/auth/[...all]/route.ts
│   ├── src/app/api/proxy/[...path]/route.ts
│   ├── src/app/api/session/route.ts
│   ├── src/proxy.ts
│   ├── src/features/auth/lib/auth.ts
│   ├── src/features/auth/lib/auth-client.ts
│   ├── src/features/auth/lib/server-session.ts
│   ├── src/shared/config/env.ts
│   └── src/shared/db/schema.ts
└── backend/
    ├── nginx/nginx.conf
    └── services/
        ├── profile-service/
        │   ├── Dockerfile
        │   ├── package.json
        │   └── server.mjs
        ├── echo-service/
        │   ├── Dockerfile
        │   ├── package.json
        │   └── server.mjs
        └── community-service/
            ├── Dockerfile
            ├── build.gradle
            ├── src/main/resources/application.yaml
            ├── src/main/resources/db/migration/*.sql
            └── src/main/java/com/example/server/**
```
역할 기준으로 보면 다음과 같다.
| 영역 | 역할 |
|---|---|
| `frontend` | Next.js 앱, Better Auth 인증 서버, BFF proxy, Orval client 생성 |
| `backend/nginx` | Gateway, CORS, path routing, Authorization 전달 |
| `profile-service` | JWT 검증 예시, `/me` 프로필 반환 |
| `echo-service` | Authorization 헤더를 다른 서비스로 재전달하는 예시 |
| `community-service` | Spring Boot 도메인 서버, JWT 검증, 사용자 매핑, 게시글/미디어/알림/예약 글 처리 |
| `frontend-db` | Better Auth user/session/account/jwks 저장 |
| `community-db` | community 도메인 테이블 및 RLS 정책 저장 |
| `redis` | community-service cache 인프라 |
| `rabbitmq` | 알림/예약 발행용 메시징 인프라 |
| `minio` | 이미지 업로드용 S3 호환 object storage |
---
## 3. 전체 아키텍처 다이어그램
```text
                                     +----------------------+
                                     |       Browser        |
                                     | React / Next pages   |
                                     +----------+-----------+
                                                |
                                                | same-origin
                                                | /api/proxy/**
                                                v
+--------------------------------------------------------------------------------+
|                                  Next.js App                                    |
|                                                                                |
|  +----------------------------+        +-------------------------------------+  |
|  | Better Auth                |        | BFF Route Handler                   |  |
|  | /api/auth/[...all]         |        | /api/proxy/[...path]                |  |
|  |                            |        |                                     |  |
|  | - Google OAuth             |        | - auth.api.getSession()             |  |
|  | - session cookie           |        | - /api/auth/token 호출              |  |
|  | - /api/auth/token          +------->| - Authorization 교체                |  |
|  | - /api/auth/jwks           |        | - upstream으로 요청 전달            |  |
|  +----------------------------+        +------------------+------------------+  |
+-------------------------------------------------------------+------------------+
                                                              |
                                                              | Bearer RS256 JWT
                                                              v
+--------------------------------------------------------------------------------+
|                                  Nginx :8080                                    |
|                                                                                |
|  - CORS 응답 헤더                                                               |
|  - OPTIONS preflight 204                                                        |
|  - /api/profile/**   -> profile-service                                         |
|  - /api/echo/**      -> echo-service                                            |
|  - /api/community/** -> community-service                                       |
|  - Authorization 헤더 전달                                                       |
+---------------------+------------------------+---------------------------------+
                      |                        |
                      v                        v
        +---------------------------+   +---------------------------+
        | profile-service           |   | echo-service              |
        | Node / Express / jose     |   | Node / Express            |
        | JWKS로 JWT 검증           |   | Authorization 재전달      |
        +---------------------------+   +---------------------------+
                      |
                      v
        +----------------------------------------------------------------+
        | community-service                                               |
        | Spring Boot Resource Server                                     |
        | - JWKS로 JWT 검증                                               |
        | - issuer/audience 검증                                          |
        | - @AuthenticationPrincipal Jwt                                  |
        | - CurrentUserService에서 app_users 매핑                         |
        | - DbSessionContext로 app.current_user_id 설정                   |
        | - PostgreSQL RLS로 row-level 권한 보강                          |
        +----------------------------------------------------------------+
```
---
## 4. 서비스별 책임
```text
+-------------------+----------------------------------------------------------+
| 구성 요소          | 책임                                                     |
+-------------------+----------------------------------------------------------+
| Better Auth        | 로그인, 세션, JWT 발급, JWKS 공개                        |
| Next.js proxy      | 세션 확인, JWT 발급 요청, Authorization 재작성           |
| Nginx              | CORS, OPTIONS, path routing, Authorization 전달           |
| profile-service    | JWKS 기반 JWT 검증 예시, 현재 사용자 정보 반환            |
| echo-service       | 서버 간 Authorization 전달 예시                           |
| community-service  | JWT 검증, API 인가, 내부 사용자 생성/조회, 도메인 처리    |
| PostgreSQL RLS     | DB row 단위 최후 권한 방어선                              |
+-------------------+----------------------------------------------------------+
```
중요한 원칙은 다음이다.
- Nginx는 JWT를 검증하지 않는다.
- Nginx는 Authorization 헤더를 전달만 한다.
- Next.js proxy는 클라이언트가 보낸 Authorization을 신뢰하지 않는다.
- Next.js proxy는 세션이 있을 때만 Better Auth JWT를 발급받아 붙인다.
- 각 백엔드 서비스는 JWT를 직접 검증한다.
- community-service는 JWT의 `sub`를 내부 Long PK로 직접 쓰지 않는다.
- community-service는 `app_users` 매핑 테이블을 통해 내부 사용자를 만든다.
---
## 5. 로컬 포트와 컨테이너
`docker-compose.yml` 기준 구성은 다음과 같다.
| 서비스 | 컨테이너 | 외부 포트 | 내부 포트 | 역할 |
|---|---|---:|---:|---|
| Next.js | 로컬 프로세스 | 3000 | 3000 | 앱, Auth server, BFF proxy |
| db | `frontend-db` | 5662 | 5432 | Better Auth DB |
| nginx | `msa-nginx` | 8080 | 80 | Gateway |
| profile-service | `profile-service` | expose | 3001 | JWT 검증 예시 |
| echo-service | `echo-service` | expose | 3002 | Authorization relay |
| community-db | `community-db` | 5663 | 5432 | Community DB |
| redis | `community-redis` | 6379 | 6379 | Redis |
| rabbitmq | `community-rabbitmq` | 5672, 15672 | 5672, 15672 | MQ + management |
| minio | `community-minio` | 8900, 8901 | 8900, 8901 | S3 compatible storage |
| community-service | `community-service` | expose | 8080 | Spring Boot API |
---
## 6. 인증 서버: Next.js + Better Auth
핵심 파일은 다음이다.
```text
frontend/src/features/auth/lib/auth.ts
frontend/src/app/api/auth/[...all]/route.ts
frontend/src/shared/db/schema.ts
frontend/src/shared/config/env.ts
```
Better Auth 설정의 핵심은 `jwt` plugin이다.
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
Better Auth route mount는 catch-all route로 처리한다.
```ts
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/features/auth/lib/auth"

export const { GET, POST } = toNextJsHandler(auth)
```
이 설정으로 중요한 엔드포인트가 열린다.
```text
/api/auth/token
/api/auth/jwks
/api/auth/callback/google
/api/auth/session 계열
```
---
## 7. RS256 JWT 계약
이 프로젝트의 JWT 알고리즘은 `RS256`이다.
```env
JWT_ALGORITHM="RS256"
```
`frontend/src/shared/config/env.ts`에서도 이 값을 강제한다.
```ts
JWT_ALGORITHM: z.enum(["RS256"]).default("RS256")
```
중요한 구분은 다음이다.
```text
올바른 alg: RS256
잘못 쓰기 쉬운 값: RSA256
```
`RSA256`은 JWT header의 `alg` 값으로 쓰면 안 된다.
JWT 검증 실패가 발생하면 가장 먼저 header를 확인한다.
```bash
TOKEN="eyJ..."
node -e "const h=process.env.TOKEN.split('.')[0]; console.log(JSON.parse(Buffer.from(h,'base64url').toString()))" \
  TOKEN="$TOKEN"
```
기대 형태는 다음이다.
```json
{
  "alg": "RS256",
  "kid": "...",
  "typ": "JWT"
}
```
---
## 8. JWT claim 계약
Better Auth JWT는 다음 데이터를 포함하도록 설계되어 있다.
```ts
definePayload: ({ user }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
})
```
백엔드가 사용하는 핵심 claim은 다음이다.
| claim | 의미 | 사용처 |
|---|---|---|
| `sub` | Better Auth user id | community-service의 `provider_subject` |
| `email` | 사용자 이메일 | community-service의 `app_users.email` |
| `name` | 표시명 | community-service의 `app_users.name` |
| `iss` | 발급자 | Spring/Node JWT issuer 검증 |
| `aud` | 대상 | Spring/Node JWT audience 검증 |
community-service는 내부 사용자 매핑에 다음 키를 사용한다.
```text
provider = "better-auth"
provider_subject = jwt.sub
```
`email` claim이 없으면 community-service는 인증 실패로 처리한다.
`name` claim이 없으면 email을 표시명 fallback으로 사용할 수 있다.
---
## 9. Next.js BFF Proxy Route Handler
핵심 파일은 다음이다.
```text
frontend/src/app/api/proxy/[...path]/route.ts
```
이 Route Handler의 책임은 다음이다.
```text
1. auth.api.getSession({ headers })로 세션 확인
2. 세션이 있으면 /api/auth/token 호출
3. 클라이언트 Authorization 헤더 삭제
4. Better Auth가 발급한 JWT로 Authorization 재설정
5. cookie, host, content-length, connection 제거
6. body를 안정적으로 읽어 upstream으로 전달
7. Nginx gateway로 요청 전달
```
핵심 코드는 다음이다.
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
Authorization 헤더는 반드시 재작성한다.
```ts
const upstreamHeaders = new Headers(req.headers)

upstreamHeaders.delete("cookie")
upstreamHeaders.delete("host")
upstreamHeaders.delete("content-length")
upstreamHeaders.delete("connection")
upstreamHeaders.delete("authorization")

if (accessToken) {
  upstreamHeaders.set("authorization", `Bearer ${accessToken}`)
}
```
이 설계 때문에 브라우저가 임의로 Authorization 헤더를 보내도 upstream에 그대로 전달되지 않는다.
---
## 10. Proxy Route Handler와 인가 분리
`/api/proxy/[...path]`는 최종 인가를 판단하지 않는다.
```text
세션 있음 -> JWT를 붙여서 upstream 전달
세션 없음 -> Authorization 없이 upstream 전달
```
이유는 공개 API와 인증 API가 섞여 있기 때문이다.
예를 들어 community-service의 게시글 조회 API는 공개 접근이 가능하다.
```text
GET /api/v1/posts
GET /api/v1/posts/cursor
GET /api/v1/posts/{id}
GET /api/v1/posts/{postId}/replies
GET /api/v1/posts/{postId}/thread
```
따라서 proxy 단계에서 비로그인 요청을 무조건 막으면 공개 피드가 깨진다.
최종 판단은 백엔드 서비스가 수행한다.
```text
Next.js proxy: 토큰을 붙일 수 있으면 붙인다.
Backend service: 이 API가 인증을 요구하는지 판단한다.
```
---
## 11. Nginx Gateway
핵심 파일은 다음이다.
```text
backend/nginx/nginx.conf
```
Nginx의 책임은 다음이다.
```text
- 허용 Origin 기반 CORS 처리
- OPTIONS preflight 204 처리
- 서비스별 path routing
- upstream의 중복 CORS 헤더 제거
- Authorization 헤더 전달
- X-Forwarded-* 헤더 전달
```
route map은 다음이다.
```text
/api/profile/   -> profile-service:3001
/api/echo/      -> echo-service:3002
/api/community/ -> community-service:8080
```
ASCII route map은 다음과 같다.
```text
                 +------------------+
                 | Nginx :8080      |
                 +--------+---------+
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
 /api/profile/      /api/echo/       /api/community/
        |                 |                 |
        v                 v                 v
 profile-service    echo-service     community-service
```
CORS는 gateway 한 곳에서 처리한다.
```nginx
map $http_origin $cors_origin {
  default "";
  "http://localhost:3000" $http_origin;
}

add_header Access-Control-Allow-Origin $cors_origin always;
add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;
add_header Access-Control-Max-Age 86400 always;
add_header Vary "Origin" always;
```
Authorization 전달은 명시적으로 설정되어 있다.
```nginx
proxy_set_header Authorization $http_authorization;
```
---
## 12. 경로 변환 예시
프론트에서 community 게시글 목록을 호출한다고 가정한다.
Orval runtime base path는 다음이다.
```text
/api/proxy/community
```
API path는 다음이다.
```text
/api/v1/posts
```
브라우저가 호출하는 최종 URL은 다음이다.
```text
GET http://localhost:3000/api/proxy/community/api/v1/posts
```
Next.js proxy는 `UPSTREAM_API_BASE_URL`을 기준으로 Nginx에 전달한다.
```env
UPSTREAM_API_BASE_URL="http://localhost:8080/api/"
```
따라서 upstream URL은 다음처럼 된다.
```text
http://localhost:8080/api/community/api/v1/posts
```
Nginx는 `/api/community/` prefix를 제거하고 community-service로 보낸다.
```text
http://community-service:8080/api/v1/posts
```
---
## 13. profile-service
핵심 파일은 다음이다.
```text
backend/services/profile-service/server.mjs
```
이 서비스는 Node.js Express와 `jose`를 사용한다.
역할은 다음이다.
```text
- Authorization: Bearer <jwt> 추출
- JWKS_URL에서 공개키 세트 조회
- JWT issuer 검증
- JWT audience 검증
- JWT_ALGS allowlist 검증
- 검증 성공 시 email/sub/iss/aud/alg/kid 반환
```
핵심 검증 코드는 다음이다.
```js
const JWKS = createRemoteJWKSet(new URL(JWKS_URL))

const { payload, protectedHeader } = await jwtVerify(token, JWKS, {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  algorithms: JWT_ALGS,
})
```
환경 변수는 다음 계열이 필요하다.
```env
JWKS_URL=http://host.docker.internal:3000/api/auth/jwks
JWT_ISSUER=http://localhost:3000
JWT_AUDIENCE=frontend-api
JWT_ALGS=RS256
```
---
## 14. echo-service
핵심 파일은 다음이다.
```text
backend/services/echo-service/server.mjs
```
이 서비스는 JWT를 직접 검증하지 않는다.
대신 받은 Authorization 헤더를 profile-service로 그대로 전달한다.
```js
const r = await fetch(`${PROFILE_BASE_URL}/me`, {
  method: "GET",
  headers: {
    Authorization: auth,
  },
})
```
서버 간 Authorization 전달 흐름을 보여주는 예시 서비스다.
```text
Next.js proxy
  -> Nginx /api/echo/echo
  -> echo-service /echo
  -> profile-service /me
  -> JWKS 검증
```
---
## 15. community-service 개요
community-service는 Spring Boot 기반 도메인 서버다.
핵심 기능은 다음이다.
```text
- 게시글 생성/수정/삭제/조회
- 댓글/스레드 조회
- 좋아요 생성/취소
- 미디어 업로드/조회/수정/삭제
- 알림 목록/읽음/삭제/SSE 스트림
- 예약 게시글 생성/수정/취소/발행
- PostgreSQL RLS 기반 row-level 권한 보호
- Redis cache
- RabbitMQ 메시징
- MinIO/S3 이미지 저장
```
인증 관점에서 가장 중요한 파일은 다음이다.
```text
backend/services/community-service/src/main/java/com/example/server/infrastructure/security/SecurityConfig.java
backend/services/community-service/src/main/java/com/example/server/application/auth/CurrentUserService.java
backend/services/community-service/src/main/java/com/example/server/core/user/User.java
backend/services/community-service/src/main/java/com/example/server/infrastructure/persistence/user/UserRepository.java
backend/services/community-service/src/main/java/com/example/server/infrastructure/persistence/session/DbSessionContext.java
```
---
## 16. community-service 보안 설정
community-service는 Spring Security Resource Server로 동작한다.
```java
.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```
즉 community-service는 자체 서버 세션을 만들지 않는다.
요청마다 Bearer JWT를 검증한다.
공개/인증 API 경계는 다음이다.
```java
.requestMatchers(
    "/",
    "/error",
    "/v3/api-docs/**",
    "/swagger-ui/**",
    "/swagger-ui.html"
).permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll()
.requestMatchers(HttpMethod.POST, "/api/v1/posts/**").authenticated()
.requestMatchers(HttpMethod.PUT, "/api/v1/posts/**").authenticated()
.requestMatchers(HttpMethod.DELETE, "/api/v1/posts/**").authenticated()
.anyRequest().authenticated()
```
정리하면 다음과 같다.
| API | 인증 필요 여부 |
|---|---|
| `GET /api/v1/posts/**` | optional/public |
| `POST /api/v1/posts/**` | required |
| `PUT /api/v1/posts/**` | required |
| `DELETE /api/v1/posts/**` | required |
| `/api/v1/media/**` | required |
| `/api/v1/notifications/**` | required |
| `/api/v1/scheduled-posts/**` | required |
| `/v3/api-docs/**` | public |
---
## 17. community-service JWT 검증
`SecurityConfig`는 `JwtDecoder`를 직접 구성한다.
```java
NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

OAuth2TokenValidator<Jwt> issuerValidator = JwtValidators.createDefaultWithIssuer(issuer);
OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<Collection<String>>(
        JwtClaimNames.AUD,
        audiences -> audiences != null && audiences.contains(audience)
);

jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        issuerValidator,
        audienceValidator
));
```
이 검증은 다음을 보장한다.
```text
- JWKS 공개키 기반 서명 검증
- 토큰 만료 검증
- issuer 일치 여부 검증
- audience 포함 여부 검증
```
`application.yaml`의 핵심 설정은 다음이다.
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: ${JWKS_URL:http://host.docker.internal:3000/api/auth/jwks}

app:
  auth:
    jwt:
      issuer: ${JWT_ISSUER:http://localhost:3000}
      audience: ${JWT_AUDIENCE:frontend-api}
```
주의할 점은 `JWKS_URL`과 `JWT_ISSUER`의 의미가 다르다는 것이다.
```text
JWKS_URL
  - 백엔드가 실제로 공개키를 가져오는 URL
  - Docker에서는 host.docker.internal 사용 가능

JWT_ISSUER
  - JWT payload의 iss와 문자열 비교하는 값
  - frontend의 JWT_ISSUER와 반드시 같아야 함
```
---
## 18. CurrentUserService와 사용자 자동 생성
핵심 파일은 다음이다.
```text
backend/services/community-service/src/main/java/com/example/server/application/auth/CurrentUserService.java
```
이 서비스는 검증된 JWT를 community 내부 사용자로 바꾼다.
상수는 다음이다.
```java
private static final String BETTER_AUTH_PROVIDER = "better-auth";
```
조회 기준은 다음이다.
```java
findByProviderAndProviderSubject("better-auth", jwt.getSubject())
```
없으면 자동 생성한다.
```java
User.createExternalUser(
    BETTER_AUTH_PROVIDER,
    providerSubject,
    requireEmail(jwt),
    true,
    resolveName(jwt),
    resolvePictureUrl(jwt)
)
```
전체 흐름은 다음이다.
```text
1. Controller가 @AuthenticationPrincipal Jwt jwt를 받는다.
2. 인증 필수 API는 getRequiredUser(jwt)를 호출한다.
3. 공개 조회 API는 getOptionalUser(jwt)를 호출한다.
4. CurrentUserService가 jwt.sub를 requireSubject로 확인한다.
5. email claim을 requireEmail로 확인한다.
6. provider="better-auth", provider_subject=jwt.sub로 app_users 조회한다.
7. 기존 row가 있으면 email/name/picture를 최신화한다.
8. 없으면 app_users row를 생성한다.
9. 도메인 서비스는 app_users.id를 내부 사용자 ID로 사용한다.
```
`getRequiredUser`와 `getOptionalUser`의 차이는 다음이다.
| 메서드 | 사용 상황 | JWT 없음 |
|---|---|---|
| `getRequiredUser` | 작성/수정/삭제/미디어/알림/예약 글 | 401 |
| `getOptionalUser` | 공개 조회에서 로그인 개인화만 필요한 경우 | Optional.empty |
---
## 19. app_users와 Better Auth user의 차이
이 프로젝트에는 사용자 테이블이 두 종류 있다.
```text
frontend-db
  user
  session
  account
  verification
  jwks

community-db
  app_users
  posts
  post_likes
  notifications
  scheduled_posts
  post_media_attachments
```
두 테이블은 같은 의미가 아니다.
| 구분 | Better Auth `user` | Community `app_users` |
|---|---|---|
| 소유 서비스 | frontend / Better Auth | community-service |
| DB | frontend-db | community-db |
| PK 타입 | text | BIGSERIAL Long |
| 생성 시점 | OAuth 로그인 시 | community API 최초 사용 시 |
| 역할 | 인증 계정 | 커뮤니티 도메인 사용자 |
| 연결 키 | `user.id` | `provider_subject = jwt.sub` |
`app_users` 테이블은 다음 구조를 가진다.
```sql
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_subject VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(255),
    role VARCHAR(30) NOT NULL,
    CONSTRAINT uk_user_provider_subject UNIQUE (provider, provider_subject)
);
```
따라서 community-service 도메인 테이블은 Better Auth의 `user.id`를 직접 FK로 사용하지 않는다.
항상 `app_users.id`를 사용한다.
---
## 20. community-service 요청 시퀀스
게시글 작성 요청을 기준으로 전체 흐름은 다음이다.
```text
Browser
  |
  | POST /api/proxy/community/api/v1/posts
  v
Next.js Proxy
  |
  | getSession(cookie)
  | GET /api/auth/token
  | Authorization: Bearer <RS256 JWT>
  v
Nginx
  |
  | /api/community/* -> community-service
  v
Spring Security
  |
  | JWKS signature check
  | issuer check
  | audience check
  v
PostCommandController
  |
  | @AuthenticationPrincipal Jwt jwt
  v
CurrentUserService
  |
  | find or create app_users
  v
PostCommandService
  |
  | use app_users.id
  v
DbSessionContext
  |
  | set_config('app.current_user_id', userId, true)
  v
PostgreSQL
  |
  | RLS policy evaluation
  v
Response
```
Controller 코드는 다음처럼 얇게 유지된다.
```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public PostResponse create(
        @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreatePostRequest request
) {
    User currentUser = currentUserService.getRequiredUser(jwt);
    Post post = postCommandService.create(
            new PostDraft(request.getContent(), request.safeMediaAttachmentIds()),
            currentUser
    );
    return postQueryService.findById(post.getId(), currentUser);
}
```
---
## 21. PostgreSQL RLS와 DbSessionContext
community-service는 애플리케이션 코드 권한 체크에 더해 PostgreSQL RLS를 사용한다.
핵심 파일은 다음이다.
```text
backend/services/community-service/src/main/java/com/example/server/infrastructure/persistence/session/DbSessionContext.java
backend/services/community-service/src/main/resources/db/migration/V2__enable_posts_rls.sql
backend/services/community-service/src/main/resources/db/migration/V4__create_post_likes.sql
backend/services/community-service/src/main/resources/db/migration/V8__create_notifications.sql
backend/services/community-service/src/main/resources/db/migration/V12__create_scheduled_posts.sql
```
DB 함수는 현재 사용자 ID를 읽는다.
```sql
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::BIGINT
$$;
```
애플리케이션은 트랜잭션 범위에서 값을 설정한다.
```java
public void setCurrentUserId(Long userId) {
    entityManager
            .createNativeQuery("select set_config('app.current_user_id', :userId, true)")
            .setParameter("userId", userId.toString())
            .getSingleResult();
}
```
RLS 정책의 의미는 다음과 같다.
```text
posts
  SELECT: 전체 공개
  INSERT: user_id = app_current_user_id()
  UPDATE: 기존 row도 내 것, 변경 후 row도 내 것
  DELETE: 내 row만 삭제

post_likes
  SELECT: 집계 계산을 위해 공개
  INSERT: 내 user_id로만 생성
  DELETE: 내 user_id만 삭제

notifications
  SELECT: 수신자 또는 actor 관련 정책
  DELETE: 수신자 본인만 삭제

scheduled_posts
  SELECT/INSERT/UPDATE/DELETE: 내 예약 글만 허용
```
RLS는 애플리케이션 버그가 생겨도 DB 레벨에서 한 번 더 막는 방어선이다.
---
## 22. community-service API 요약
외부에서 Next.js proxy를 통해 호출할 때는 앞에 `/api/proxy/community`가 붙는다.
community-service 내부 경로는 다음과 같다.
```text
Posts
  GET    /api/v1/posts
  GET    /api/v1/posts/cursor
  GET    /api/v1/posts/{id}
  GET    /api/v1/posts/{postId}/replies
  GET    /api/v1/posts/{postId}/thread
  POST   /api/v1/posts
  POST   /api/v1/posts/{parentId}/replies
  PUT    /api/v1/posts/{id}
  DELETE /api/v1/posts/{id}

Post Likes
  POST   /api/v1/posts/{postId}/likes
  DELETE /api/v1/posts/{postId}/likes

Media
  POST   /api/v1/media
  GET    /api/v1/media/{id}
  PATCH  /api/v1/media/{id}
  DELETE /api/v1/media/{id}

Notifications
  GET    /api/v1/notifications
  GET    /api/v1/notifications/unread-count
  PATCH  /api/v1/notifications/{notificationId}/read
  PATCH  /api/v1/notifications/read-all
  DELETE /api/v1/notifications/{notificationId}
  GET    /api/v1/notifications/stream

Scheduled Posts
  GET    /api/v1/scheduled-posts
  POST   /api/v1/scheduled-posts
  PUT    /api/v1/scheduled-posts/{id}
  DELETE /api/v1/scheduled-posts/{id}
```
호출 예시는 다음이다.
```text
GET  /api/proxy/community/api/v1/posts
POST /api/proxy/community/api/v1/posts
GET  /api/proxy/community/api/v1/notifications
POST /api/proxy/community/api/v1/media
```
---
## 23. 미디어 업로드 경계
미디어 업로드는 `multipart/form-data`를 사용한다.
Next.js proxy는 JSON body만 다루는 것이 아니라 multipart body도 그대로 전달할 수 있게 구성되어 있다.
```ts
const requestBody =
  method === "GET" || method === "HEAD"
    ? undefined
    : await req.arrayBuffer()

if (requestBody && requestBody.byteLength > 0) {
  upstreamCtx.body = requestBody
}
```
이 방식은 다음 문제를 피하기 위한 구조다.
```text
- ReadableStream을 그대로 upstream fetch에 넘길 때 생기는 런타임 문제
- multipart/form-data boundary 손상
- 빈 body를 억지로 전달해서 생기는 fetch 오류
```
미디어 API는 owner 기반 도메인이므로 모두 인증이 필요하다.
---
## 24. 알림과 예약 게시글 경계
알림 API는 개인 데이터이므로 인증이 필요하다.
SSE 스트림도 인증된 사용자에게만 열린다.
```text
GET /api/v1/notifications/stream
```
예약 게시글도 사용자 소유 데이터다.
```text
scheduled_posts.user_id = app_users.id
```
예약 게시글 상태는 다음과 같다.
```text
SCHEDULED
PUBLISHING
PUBLISHED
CANCELED
FAILED
```
예약 발행은 RabbitMQ 기반으로 처리된다.
```text
scheduled_posts row
  -> scheduler
  -> RabbitMQ message
  -> consumer
  -> PostCommandService helper 재사용
  -> published_post_id 기록
```
---
## 25. OpenAPI와 Orval
핵심 파일은 다음이다.
```text
frontend/orval.config.ts
```
Orval은 OpenAPI 문서를 Nginx gateway를 통해 읽는다.
```ts
"profile-api": createProject({
  name: "profile",
  inputPath: "/api/profile/v3/api-docs",
  runtimeBasePath: "/api/proxy/profile",
})

"community-api": createProject({
  name: "community",
  inputPath: "/api/community/v3/api-docs",
  runtimeBasePath: "/api/proxy/community",
})

"echo-api": createProject({
  name: "echo",
  inputPath: "/api/echo/v3/api-docs",
  runtimeBasePath: "/api/proxy/echo",
})
```
빌드/코드 생성 경로와 런타임 호출 경로는 다르다.
```text
Codegen
  Orval -> http://localhost:8080/api/community/v3/api-docs
  Orval -> Nginx -> community-service /v3/api-docs

Runtime
  React Query hook -> /api/proxy/community/api/v1/**
  Next.js proxy -> Nginx -> community-service /api/v1/**
```
API client 생성 명령은 다음이다.
```bash
cd frontend
npm run api:gen
```
---
## 26. 필수 환경 변수
프론트 핵심 환경 변수는 다음이다.
```env
NEXT_PUBLIC_GATEWAY_BASE_URL="http://localhost:8080"
GATEWAY_BASE_URL="http://localhost:8080"
BETTER_AUTH_SECRET="CHANGE_ME_32+_CHARS_RANDOM"
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="postgres://postgres:postgres@localhost:5662/frontend_db"
GOOGLE_CLIENT_ID="CHANGE_ME"
GOOGLE_CLIENT_SECRET="CHANGE_ME"
JWT_ISSUER="http://localhost:3000"
JWT_AUDIENCE="frontend-api"
JWT_EXPIRATION="15m"
JWT_ALGORITHM="RS256"
OPENAPI_GATEWAY_ORIGIN="http://localhost:8080"
NEXT_PUBLIC_APP_ORIGIN="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="/api/proxy"
UPSTREAM_API_BASE_URL="http://localhost:8080/api/"
```
community-service 핵심 환경 변수는 다음이다.
```env
DB_HOST=community-db
REDIS_HOST=redis
RABBITMQ_HOST=rabbitmq
S3_ENDPOINT=http://minio:8900
JWKS_URL=http://host.docker.internal:3000/api/auth/jwks
JWT_ISSUER=http://localhost:3000
JWT_AUDIENCE=frontend-api
```
다음 값들은 반드시 서로 일치해야 한다.
```text
frontend JWT_ISSUER  == backend JWT_ISSUER
frontend JWT_AUDIENCE == backend JWT_AUDIENCE
frontend JWT_ALGORITHM == RS256
backend JWKS_URL은 Next.js /api/auth/jwks에 실제 접근 가능해야 함
```
---
## 27. 로컬 실행
루트 `Makefile`의 `dev` 타겟은 다음 순서로 동작한다.
```text
1. docker compose up -d --build
2. sleep 10
3. docker compose restart nginx
4. cd frontend && npm run db:migrate
5. cd frontend && npm run dev
```
실행 명령은 다음이다.
```bash
make dev
```
수동 실행은 다음 순서로 할 수 있다.
```bash
docker compose up -d --build
cd frontend
npm install
npm run db:migrate
npm run dev
```
---
## 28. 동작 확인 명령
JWKS 확인:
```bash
curl http://localhost:3000/api/auth/jwks
```
현재 세션 확인:
```bash
curl http://localhost:3000/api/session
```
profile-service OpenAPI 확인:
```bash
curl http://localhost:8080/api/profile/v3/api-docs
```
community-service OpenAPI 확인:
```bash
curl http://localhost:8080/api/community/v3/api-docs
```
로그인된 브라우저에서 profile 호출:
```text
GET http://localhost:3000/api/proxy/profile/me
```
로그인된 브라우저에서 community posts 호출:
```text
GET http://localhost:3000/api/proxy/community/api/v1/posts
```
---
## 29. JWT 문제 확인 순서
JWT 검증이 실패하면 다음 순서로 본다.
```text
1. /api/auth/token에서 토큰이 발급되는가?
2. JWT header alg가 RS256인가?
3. /api/auth/jwks가 정상 응답하는가?
4. JWT header kid와 JWKS의 kid가 맞는가?
5. JWT iss와 backend issuer 설정이 완전히 같은가?
6. JWT aud가 backend audience를 포함하는가?
7. Nginx가 Authorization 헤더를 전달하는가?
8. Next.js proxy가 Authorization을 삭제 후 재설정하는가?
9. community-service가 JWKS_URL에 접근 가능한가?
10. profile-service의 JWT_ALGS가 RS256인가?
```
`ERR_JOSE_NOT_SUPPORTED` 또는 알고리즘 관련 오류가 있으면 특히 다음을 본다.
```text
- JWT_ALGORITHM="RS256" 인가?
- JWT header alg가 "RS256"인가?
- "RSA256"처럼 잘못된 문자열을 쓰고 있지 않은가?
- 이전 알고리즘의 JWKS row가 개발 DB에 남아 있지 않은가?
```
개발 환경에서 알고리즘을 바꾼 뒤 계속 실패하면 Better Auth의 `jwks` 테이블 상태도 확인한다.
---
## 30. 새 백엔드 서비스 추가 기준
새 서비스를 추가할 때는 다음 경계를 맞춘다.
```text
1. docker-compose.yml에 service 추가
2. backend/nginx/nginx.conf에 upstream 추가
3. backend/nginx/nginx.conf에 location 추가
4. Authorization 헤더 전달 설정 추가
5. CORS는 Nginx에서 계속 처리
6. OpenAPI가 필요하면 /v3/api-docs 제공
7. frontend/orval.config.ts에 project 추가
8. runtimeBasePath를 /api/proxy/<service>로 설정
9. JWT 검증이 필요하면 JWKS_URL/JWT_ISSUER/JWT_AUDIENCE 설정
10. 서비스 내부에서 public/required API 경계 정의
```
Nginx location 예시는 다음이다.
```nginx
upstream new_service_upstream {
  server new-service:8080;
}

location /api/new-service/ {
  if ($request_method = OPTIONS) {
    return 204;
  }

  proxy_hide_header Access-Control-Allow-Origin;
  proxy_hide_header Access-Control-Allow-Methods;
  proxy_hide_header Access-Control-Allow-Headers;
  proxy_hide_header Access-Control-Allow-Credentials;

  proxy_pass http://new_service_upstream/;

  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Authorization $http_authorization;
}
```
---
## 31. 코드 레이어링 원칙
community-service의 레이어는 다음처럼 나뉜다.
```text
api/
  Controller
  HTTP request/response DTO
  validation
  @AuthenticationPrincipal Jwt 수신

application/
  use-case orchestration
  CurrentUserService
  query service
  response assembler
  SSE orchestration

core/
  Entity
  domain service
  business rule
  domain event

infrastructure/
  Spring Security config
  persistence repository
  DbSessionContext
  Redis config
  RabbitMQ config
  S3 storage implementation
```
Controller가 JWT claim을 직접 파싱하지 않는 것이 중요하다.
Controller가 repository를 직접 호출하지 않는 것도 중요하다.
JWT와 내부 User의 변환은 `CurrentUserService`에 둔다.
---
## 32. 운영 배포 시 바꿔야 하는 값
로컬에서는 `localhost`와 `host.docker.internal`이 섞여 있다.
운영에서는 다음을 실제 도메인과 보안 값으로 바꿔야 한다.
```text
BETTER_AUTH_URL
JWT_ISSUER
JWKS_URL
GOOGLE OAuth redirect URI
CORS 허용 Origin
NEXT_PUBLIC_APP_ORIGIN
UPSTREAM_API_BASE_URL
DATABASE_URL
BETTER_AUTH_SECRET
S3 credentials
RabbitMQ credentials
DB credentials
```
운영 예시는 다음 형태다.
```env
BETTER_AUTH_URL="https://app.example.com"
JWT_ISSUER="https://app.example.com"
JWKS_URL="https://app.example.com/api/auth/jwks"
NEXT_PUBLIC_APP_ORIGIN="https://app.example.com"
UPSTREAM_API_BASE_URL="https://gateway.example.com/api/"
```
`JWT_ISSUER`는 토큰 안의 `iss`와 비교되는 문자열이다.
운영 중 issuer를 바꾸면 기존 토큰 검증이 실패한다.
---
## 33. 최종 설계 정리
이 프로젝트의 인증/인가 구조는 다음 문장으로 정리할 수 있다.
```text
Next.js/Better Auth는 로그인과 RS256 JWT 발급의 기준점이다.
Next.js Route Handler는 브라우저 대신 JWT를 발급받아 upstream에 전달하는 BFF다.
Nginx는 CORS와 path routing의 기준점이다.
각 백엔드 서비스는 JWKS로 JWT를 직접 검증한다.
community-service는 JWT subject를 내부 app_users row로 변환한다.
도메인 로직은 app_users.id를 기준으로 처리한다.
PostgreSQL RLS는 app.current_user_id를 기준으로 row-level 권한을 보강한다.
```
새 서비스가 추가되어도 이 구조를 유지하면 된다.
```text
필요한 것 1: JWKS URL
필요한 것 2: JWT issuer
필요한 것 3: JWT audience
필요한 것 4: Authorization 헤더 전달 경로
필요한 것 5: 서비스 내부 public/required API 정책
```
community-service처럼 내부 사용자 테이블이 필요한 서비스는 다음 매핑을 유지한다.
```text
external identity = jwt.sub
internal identity = service-local user.id
mapping key       = provider + provider_subject
```
이것이 이 프로젝트의 핵심 아키텍처다.
