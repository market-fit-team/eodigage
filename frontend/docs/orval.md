# Orval 설정 가이드

## 1. 목적

Orval은 백엔드 서비스가 제공하는 OpenAPI 문서(`/v3/api-docs`)를 읽어서 다음 파일들을 자동 생성한다.

```txt
API 요청 함수
React Query hooks
Suspense Query hooks
Mutation hooks
Query helper
Zod schemas
```

공식 문서:

- [Orval Docs](https://orval.dev/docs)
- [Input Configuration](https://orval.dev/docs/reference/configuration/input)
- [Output Configuration](https://orval.dev/docs/reference/configuration/output)

## 2. 입력 문서 위치

각 서비스는 `/v3/api-docs`를 제공한다.

```txt
profile-service → /v3/api-docs
echo-service    → /v3/api-docs
```

Orval은 Nginx를 통해 노출된 문서를 읽는다.

```ts
const OPENAPI_GATEWAY_ORIGIN =
  process.env.OPENAPI_GATEWAY_ORIGIN ?? "http://localhost:8080"
```

서비스별 OpenAPI 입력 URL은 다음처럼 만든다.

```ts
new URL(inputPath, OPENAPI_GATEWAY_ORIGIN).toString()
```

예시:

```txt
http://localhost:8080/api/profile/v3/api-docs
http://localhost:8080/api/echo/v3/api-docs
```

`input.target`에는 OpenAPI JSON/YAML URL 또는 파일 경로를 넣을 수 있다.

```ts
input: {
  target: new URL(inputPath, OPENAPI_GATEWAY_ORIGIN).toString(),
}
```

관련 문서:

- [Orval Input Configuration](https://orval.dev/docs/reference/configuration/input)

## 3. 출력 위치

생성 파일은 `src/shared/api/generated` 아래에 서비스별로 분리한다.

```ts
const GENERATED_ROOT = "src/shared/api/generated"
```

서비스별 출력 구조:

```txt
src/shared/api/generated/profile/endpoints
src/shared/api/generated/profile/schemas

src/shared/api/generated/echo/endpoints
src/shared/api/generated/echo/schemas
```

`endpoints`에는 API 함수와 React Query hook이 생성된다.
`schemas`에는 Zod schema가 생성된다.

```ts
target: `${GENERATED_ROOT}/${name}/endpoints`,
schemas: {
  path: `${GENERATED_ROOT}/${name}/schemas`,
  type: "zod",
},
```

`generated` 폴더는 Orval이 관리하므로 직접 수정하지 않는다.

관련 문서:

- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)
- [Orval Zod](https://orval.dev/docs/guides/zod)

## 4. 생성 모드

이 프로젝트는 `tags-split` 모드를 사용한다.

```ts
mode: "tags-split"
```

OpenAPI의 `tags` 기준으로 endpoint 파일을 분리한다.
서비스 내부 API가 늘어났을 때 파일이 한 곳에 몰리지 않도록 하기 위한 설정이다.

```ts
output: {
  mode: "tags-split",
}
```

관련 문서:

- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)

## 5. React Query client 생성

이 프로젝트는 Orval이 React Query hook을 생성하도록 설정한다.

```ts
client: "react-query"
```

생성 대상:

```txt
useQuery
useSuspenseQuery
useMutation
prefetch helper
invalidate helper
get query data helper
set query data helper
```

설정:

```ts
query: {
  useQuery: true,
  useSuspenseQuery: true,
  useMutation: true,
  usePrefetch: true,
  useInvalidate: true,
  useSetQueryData: true,
  useGetQueryData: true,
  signal: true,
}
```

조회 API는 기본적으로 Suspense hook을 사용한다.

```tsx
const { data } = useGetMeSuspense()
```

관련 문서:

- [Orval React Query](https://orval.dev/docs/guides/react-query)

## 6. Fetch client 사용

HTTP client는 `fetch`를 사용한다.

```ts
httpClient: "fetch"
```

이 프로젝트에서는 `customFetch`나 `mutator`를 사용하지 않는다.

이유:

```txt
Orval generated code
→ 기본 fetch 사용
→ Next.js 서버 런타임에서는 Next 확장 fetch 사용 가능
```

서버 컴포넌트나 서버 prefetch 코드에서는 필요하면 Next fetch 옵션을 넘길 수 있다.

```ts
await getMe({
  cache: "no-store",
})
```

또는:

```ts
await getMe({
  next: {
    revalidate: 60,
    tags: ["profile"],
  },
})
```

관련 문서:

- [Orval Fetch Client](https://orval.dev/docs/guides/fetch-client)
- [Orval Fetch Runtime Base URL](https://orval.dev/docs/guides/fetch)
- [Next.js fetch](https://nextjs.org/docs/app/api-reference/functions/fetch)

## 7. Runtime baseUrl

OpenAPI 문서를 읽는 URL과 실제 앱에서 API를 호출하는 URL은 다르다.

### Codegen URL

Orval이 `/v3/api-docs`를 읽는 주소다.

```txt
http://localhost:8080/api/profile/v3/api-docs
```

### Runtime URL

생성된 client가 실제 호출하는 주소다.

```txt
/api/proxy/profile
/api/proxy/echo
```

설정:

```ts
baseUrl: {
  runtime: `(process.env.NEXT_PUBLIC_APP_ORIGIN ?? "") + "${runtimeBasePath}"`,
}
```

예시:

```ts
runtimeBasePath: "/api/proxy/profile"
```

브라우저에서는 같은 origin의 `/api/proxy/profile`을 호출한다.
서버 런타임에서는 `NEXT_PUBLIC_APP_ORIGIN`을 붙여 absolute URL로 호출할 수 있다.

관련 문서:

- [Orval Fetch Runtime Base URL](https://orval.dev/docs/guides/fetch)

## 8. Zod schema와 runtime validation

Zod schema를 생성한다.

```ts
schemas: {
  path: `${GENERATED_ROOT}/${name}/schemas`,
  type: "zod",
}
```

fetch 응답 runtime validation도 켠다.

```ts
fetch: {
  runtimeValidation: true,
}
```

이 설정을 사용하면 OpenAPI schema와 실제 응답이 다를 때 런타임 검증 에러가 날 수 있다.
따라서 API 응답이 바뀌면 `/v3/api-docs`도 반드시 같이 갱신해야 한다.

관련 문서:

- [Orval Zod](https://orval.dev/docs/guides/zod)
- [Orval Client with Zod](https://orval.dev/docs/guides/client-with-zod)

## 9. Fetch override

fetch 관련 설정은 다음처럼 둔다.

```ts
fetch: {
  includeHttpResponseReturnType: false,
  forceSuccessResponse: true,
  runtimeValidation: true,
}
```

의미:

```txt
includeHttpResponseReturnType: false
→ 응답 타입에 HTTP Response wrapper를 포함하지 않는다.

forceSuccessResponse: true
→ 성공 응답 타입 중심으로 생성한다.

runtimeValidation: true
→ Zod schema로 JSON 응답을 검증한다.
```

관련 문서:

- [Orval Output Configuration](https://orval.dev/docs/reference/configuration/output)

## 10. 파일 정리 정책

생성 전에 기존 output 폴더를 정리한다.

```ts
clean: true
```

따라서 `generated` 폴더 안에 직접 작성한 코드를 두면 안 된다.
직접 작성하는 API 유틸은 반드시 `generated` 밖에 둔다.

```txt
가능:
src/shared/api/some-manual-file.ts

금지:
src/shared/api/generated/profile/직접작성.ts
```

## 11. namingConvention

생성 파일명은 kebab-case를 사용한다.

```ts
namingConvention: "kebab-case"
```

예상 파일명 형태:

```txt
get-me.ts
get-echo.ts
profile.ts
echo.ts
```

## 12. Project 생성 함수

서비스별 Orval 설정은 `createProject` 함수로 만든다.

```ts
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
        header: GENERATED_HEADER,
        query: {
          useQuery: true,
          useSuspenseQuery: true,
          useMutation: true,
          usePrefetch: true,
          useInvalidate: true,
          useSetQueryData: true,
          useGetQueryData: true,
          signal: true,
        },
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
          runtimeValidation: true,
        },
      },
    },
  }
}
```

## 13. 현재 project 목록

현재는 두 개 project를 생성한다.

```ts
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

서비스가 추가되면 같은 형식으로 project를 추가한다.

## 14. 실행 방법

백엔드 서비스와 Nginx가 떠 있어야 한다.

```bash
docker compose up -d --build
```

OpenAPI 문서가 JSON으로 응답하는지 먼저 확인한다.

```bash
curl http://localhost:8080/api/profile/v3/api-docs
curl http://localhost:8080/api/echo/v3/api-docs
```

그 다음 Orval을 실행한다.

```bash
npm run api:generate
```

## 15. 자주 나는 에러

### Failed to parse JSON/YAML from URL

Orval이 `input.target` URL에서 OpenAPI JSON/YAML을 읽지 못한 상태다.

확인할 것:

```txt
1. 서비스가 실행 중인지
2. /v3/api-docs endpoint가 실제로 있는지
3. Nginx 경유 URL이 200 JSON을 반환하는지
4. 서버 코드 변경 후 컨테이너를 rebuild 했는지
```

정상 응답 예시:

```txt
HTTP/1.1 200 OK
Content-Type: application/json

{
  "openapi": "3.0.3",
  "info": { ... },
  "paths": { ... }
}
```
