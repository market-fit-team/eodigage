# Orval 설정 가이드

## 적용 범위

이 문서는 Next.js App Router 프로젝트에서 Orval을 사용해 OpenAPI 기반 API client를 생성하는 설정을 설명한다.

사용 목적은 다음과 같다.

```txt
OpenAPI 문서
→ Orval
→ fetch 기반 API 함수
→ TanStack Query hooks
→ Suspense Query hooks
→ Zod schemas
```

이 프로젝트는 `customFetch` 또는 Orval mutator를 사용하지 않는다. 생성된 client는 Orval 기본 fetch client를 사용한다.

관련 문서:

- [Orval Docs](https://orval.dev/docs)
- [Orval Input Configuration](https://orval.dev/docs/reference/configuration/input)
- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)
- [Orval React Query Guide](https://orval.dev/docs/guides/react-query)
- [Orval Fetch Guide](https://orval.dev/docs/guides/fetch)
- [Orval Custom Base URL Guide](https://orval.dev/docs/guides/set-base-url)

---

## 전체 설정

```ts
import { type Config, type Options, defineConfig } from "orval"

const OPENAPI_GATEWAY_ORIGIN =
  process.env.OPENAPI_GATEWAY_ORIGIN ?? "http://localhost:8080"

const GENERATED_ROOT = "src/shared/api/generated"

const createProject = ({
  name,
  inputPath,
  runtimeBasePath,
}: {
  name: string
  inputPath: string
  runtimeBasePath: string
}): Options => {
  return {
    input: {
      target: new URL(inputPath, OPENAPI_GATEWAY_ORIGIN).toString(),
    },
    output: {
      mode: "tags-split",
      target: `${GENERATED_ROOT}/${name}/endpoints`,
      schemas: {
        path: `${GENERATED_ROOT}/${name}/schemas`,
        type: "zod",
      },
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      namingConvention: "kebab-case",
      baseUrl: {
        runtime: `(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "") + "${runtimeBasePath}"`,
      },
      override: {
        header: false,
        query: {
          useSuspenseQuery: true,
          usePrefetch: true,
          useInvalidate: true,
          useSetQueryData: true,
          useGetQueryData: true,
          signal: true,
        },
        fetch: {
          includeHttpResponseReturnType: true,
          forceSuccessResponse: true,
          runtimeValidation: false,
        },
      },
    },
  }
}

export default defineConfig((): Config => {
  return {
    "profile-api": createProject({
      name: "profile",
      inputPath: "/api/profile/v3/api-docs",
      runtimeBasePath: "/api/proxy/profile",
    }),

    "echo-api": createProject({
      name: "echo",
      inputPath: "/api/echo/v3/api-docs",
      runtimeBasePath: "/api/proxy/echo",
    }),
  }
})
```

---

## 1. `input.target`

```ts
input: {
  target: new URL(inputPath, OPENAPI_GATEWAY_ORIGIN).toString(),
}
```

`input.target`은 Orval이 읽을 OpenAPI 문서의 위치다.
문서 위치는 파일 경로 또는 HTTP URL을 사용할 수 있다.

이 프로젝트는 백엔드 서비스가 제공하는 `/v3/api-docs`를 Nginx 경유 URL로 읽는다.

```txt
http://localhost:8080/api/profile/v3/api-docs
http://localhost:8080/api/echo/v3/api-docs
```

관련 문서:

- [Orval Input Configuration](https://orval.dev/docs/reference/configuration/input)

---

## 2. `output.mode`

```ts
mode: "tags-split"
```

`tags-split`은 OpenAPI의 `tags` 기준으로 endpoint 파일을 분리하는 생성 모드다.

서비스별 API가 늘어났을 때 하나의 파일에 모든 endpoint가 몰리지 않도록 하기 위해 사용한다.

관련 문서:

- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)

---

## 3. `output.target`

```ts
target: `${GENERATED_ROOT}/${name}/endpoints`
```

`target`은 API 함수와 React Query hook이 생성될 위치다.

예상 구조:

```txt
src/shared/api/generated/profile/endpoints
src/shared/api/generated/echo/endpoints
```

`generated` 아래의 파일은 Orval이 관리하므로 직접 수정하지 않는다.

---

## 4. `output.schemas`

```ts
schemas: {
  path: `${GENERATED_ROOT}/${name}/schemas`,
  type: "zod",
}
```

`schemas`는 OpenAPI schema를 생성할 위치와 형식을 지정한다.

이 프로젝트는 schema를 Zod로 생성한다.

예상 구조:

```txt
src/shared/api/generated/profile/schemas
src/shared/api/generated/echo/schemas
```

Zod schema는 응답 검증, form validation, 테스트 데이터 검증 등에 재사용할 수 있다.

관련 문서:

- [Orval Zod Guide](https://orval.dev/docs/guides/zod)
- [Orval Client with Zod Guide](https://orval.dev/docs/guides/client-with-zod)

---

## 5. `client`

```ts
client: "react-query"
```

`client: "react-query"`는 Orval이 TanStack Query 기반 hook을 생성하도록 한다.

생성 대상은 OpenAPI operation에 따라 달라진다.

```txt
GET    → query hook
POST   → mutation hook
PUT    → mutation hook
PATCH  → mutation hook
DELETE → mutation hook
```

관련 문서:

- [Orval React Query Guide](https://orval.dev/docs/guides/react-query)
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)

---

## 6. `httpClient`

```ts
httpClient: "fetch"
```

`httpClient: "fetch"`는 생성된 API 함수가 fetch 기반으로 요청하도록 한다.

이 프로젝트는 Axios를 사용하지 않는다.
또한 `customFetch`와 mutator를 사용하지 않는다.

이 설정을 사용하면 서버 런타임에서 generated fetch 함수에 Next.js fetch option을 전달할 수 있다.

```ts
await getMe({
  cache: "no-store",
})
```

```ts
await getMe({
  next: {
    revalidate: 60,
    tags: ["profile"],
  },
})
```

Next.js의 `cache`, `next.revalidate`, `next.tags` 옵션은 서버 런타임에서 의미가 있다.
클라이언트 컴포넌트에서 실행되는 React Query hook은 브라우저 fetch를 사용한다.

관련 문서:

- [Orval Fetch Guide](https://orval.dev/docs/guides/fetch)
- [Next.js fetch API Reference](https://nextjs.org/docs/app/api-reference/functions/fetch)

---

## 7. `baseUrl.runtime`

```ts
baseUrl: {
  runtime: `(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "") + "${runtimeBasePath}"`,
}
```

`baseUrl.runtime`은 생성된 fetch client가 앱 실행 시점에 사용할 base URL 표현식이다.

이 프로젝트에서는 OpenAPI 문서를 읽는 URL과 실제 API 호출 URL을 분리한다.

### Codegen URL

Orval이 OpenAPI 문서를 읽는 URL이다.

```txt
http://localhost:8080/api/profile/v3/api-docs
```

### Runtime URL

생성된 client가 실제 호출하는 URL이다.

```txt
/api/proxy/profile
/api/proxy/echo
```

브라우저에서는 같은 origin의 `/api/proxy/*`를 호출한다.
서버 런타임에서는 `NEXT_PUBLIC_APP_ORIGIN`을 붙여 absolute URL로 호출할 수 있다.

관련 문서:

- [Orval Custom Base URL Guide](https://orval.dev/docs/guides/set-base-url)

---

## 8. `clean`

```ts
clean: true
```

`clean: true`는 Orval 실행 시 기존 생성 파일을 정리한 뒤 다시 생성하도록 한다.

따라서 `generated` 폴더 안에 직접 작성한 코드를 두면 안 된다.

```txt
가능:
src/shared/api/manual-client.ts

금지:
src/shared/api/generated/profile/manual-client.ts
```

---

## 9. `namingConvention`

```ts
namingConvention: "kebab-case"
```

생성 파일명을 kebab-case로 통일한다.

예상 파일명:

```txt
get-me.ts
get-echo.ts
profile.ts
echo.ts
```

---

## 10. `override.header`

```ts
header: false
```

커스텀 header는 사용하지 않는다.

생성 파일 최상단에 별도 주석, lint directive, block comment를 삽입하지 않는다.
생성 파일에 대한 lint 제외가 필요하면 Orval header가 아니라 ESLint 설정에서 `generated` 경로를 제외한다.

예시:

```txt
src/shared/api/generated/**
```

---

## 11. `override.query`

```ts
query: {
  useSuspenseQuery: true,
  usePrefetch: true,
  useInvalidate: true,
  useSetQueryData: true,
  useGetQueryData: true,
  signal: true,
}
```

### `useSuspenseQuery`

Suspense 기반 query hook을 생성한다.

```tsx
const { data } = useGetMeSuspense()
```

로딩 UI는 hook의 `isLoading` 대신 React `<Suspense>` fallback에서 처리한다.

### `usePrefetch`

서버 컴포넌트나 라우트 단위에서 데이터를 미리 채우기 위한 prefetch helper를 생성한다.

### `useInvalidate`

mutation 이후 관련 query를 무효화하기 위한 helper를 생성한다.

### `useSetQueryData`

캐시 데이터를 직접 갱신하기 위한 helper를 생성한다.

### `useGetQueryData`

캐시에 들어 있는 query data를 읽기 위한 helper를 생성한다.

### `signal`

fetch 요청에 `AbortSignal`을 연결한다.
React Query가 요청 취소를 처리할 수 있도록 한다.

관련 문서:

- [Orval React Query Guide](https://orval.dev/docs/guides/react-query)
- [TanStack Query SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

---

## 12. `override.fetch`

```ts
fetch: {
  includeHttpResponseReturnType: true,
  forceSuccessResponse: true,
  runtimeValidation: false,
}
```

### `includeHttpResponseReturnType`

```ts
includeHttpResponseReturnType: true
```

fetch 함수의 반환 타입에 HTTP response 정보를 포함한다.

반환값은 API body만이 아니라 response wrapper 형태가 된다.

예시:

```ts
const result = await getMe()
const body = result.data
const status = result.status
```

React Query hook에서도 `data`는 wrapper이며, 실제 API body는 `data.data`에 있다.

```tsx
const { data } = useGetMeSuspense()

return <pre>{JSON.stringify(data.data, null, 2)}</pre>
```

### `forceSuccessResponse`

```ts
forceSuccessResponse: true
```

error response를 반환값으로 다루지 않고 throw하도록 한다.

React Query에서는 실패한 요청이 query error로 전달된다.

`forceSuccessResponse`를 사용할 때는 `includeHttpResponseReturnType: true`와 함께 사용한다.

관련 참고:

- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)
- [orval-labs/orval#2550](https://github.com/orval-labs/orval/issues/2550)

### `runtimeValidation`

```ts
runtimeValidation: false
```

fetch 응답에 대한 자동 runtime validation은 사용하지 않는다.

Zod schema는 생성하지만, generated fetch 함수 내부에서 자동으로 `.parse()`를 수행하지 않는다.

응답 검증이 필요한 곳에서는 생성된 Zod schema를 직접 import해 명시적으로 검증한다.

```ts
import { profileMeResponse } from "@/shared/api/generated/profile/schemas"

const parsed = profileMeResponse.parse(data)
```

관련 문서:

- [Orval Output Configuration - runtimeValidation](https://orval.dev/docs/reference/configuration/output)
- [Orval Client with Zod](https://orval.dev/docs/guides/client-with-zod)

---

## 13. Project 정의

서비스별 설정은 `createProject`로 만든다.

```ts
"profile-api": createProject({
  name: "profile",
  inputPath: "/api/profile/v3/api-docs",
  runtimeBasePath: "/api/proxy/profile",
})
```

각 값의 의미는 다음과 같다.

```txt
name
→ generated 하위 디렉터리 이름

inputPath
→ Orval이 읽을 OpenAPI 문서 경로

runtimeBasePath
→ generated client가 실제 앱에서 호출할 API base path
```

예시:

```txt
inputPath:
  /api/profile/v3/api-docs

runtimeBasePath:
  /api/proxy/profile
```

---

## 14. 환경 변수

`.env.example`에는 다음 값을 둔다.

```env
# Orval이 OpenAPI 문서를 읽을 gateway origin
OPENAPI_GATEWAY_ORIGIN="http://localhost:8080"

# 서버 런타임에서 /api/proxy를 absolute URL로 호출하기 위한 앱 origin
NEXT_PUBLIC_APP_ORIGIN="http://localhost:3000"

# Next BFF가 Nginx upstream으로 요청을 보낼 때 사용하는 base URL
UPSTREAM_API_BASE_URL="http://localhost:8080/api/"
```

`OPENAPI_GATEWAY_ORIGIN`은 codegen 시점에 사용한다.
`NEXT_PUBLIC_APP_ORIGIN`은 generated client의 runtime URL 계산에 사용한다.
`UPSTREAM_API_BASE_URL`은 Next.js BFF가 내부 upstream으로 요청할 때 사용한다.

관련 문서:

- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)

---

## 15. 실행 순서

백엔드 서비스와 Nginx가 먼저 실행되어야 한다.

```bash
docker compose up -d --build
```

OpenAPI 문서가 정상 응답하는지 확인한다.

```bash
curl http://localhost:8080/api/profile/v3/api-docs
curl http://localhost:8080/api/echo/v3/api-docs
```

Orval을 실행한다.

```bash
npm run api:generate
```

---

## 16. 실패 시 확인 사항

### `Failed to parse JSON/YAML from URL`

Orval이 `input.target`에서 OpenAPI 문서를 읽지 못한 상태다.

확인할 항목:

```txt
1. 백엔드 서비스가 실행 중인지 확인
2. 서비스가 /v3/api-docs를 제공하는지 확인
3. Nginx 경유 URL이 200 JSON을 반환하는지 확인
4. 서버 코드 변경 후 컨테이너가 rebuild 되었는지 확인
```

정상 응답 예시:

```txt
HTTP/1.1 200 OK
Content-Type: application/json

{
  "openapi": "3.0.3",
  "info": {
    "title": "profile-service",
    "version": "1.0.0"
  },
  "paths": {}
}
```

---

## 17. 설정 원칙

이 프로젝트의 Orval 설정 원칙은 다음과 같다.

```txt
1. OpenAPI 문서는 서비스가 제공한다.
2. Orval은 Nginx 경유 /v3/api-docs를 읽는다.
3. generated client는 직접 Nginx를 호출하지 않고 /api/proxy를 호출한다.
4. HTTP client는 기본 fetch를 사용한다.
5. customFetch와 mutator는 사용하지 않는다.
6. React Query Suspense hook을 생성한다.
7. Zod schema는 생성하되 fetch 자동 runtime validation은 사용하지 않는다.
8. generated 폴더는 직접 수정하지 않는다.
```
