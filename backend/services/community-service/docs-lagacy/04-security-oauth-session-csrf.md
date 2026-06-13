# Security: OAuth2 Login, Session, CSRF, CORS

이 서버는 token-only stateless API가 아니라, **OAuth2 Login + server-side session + CSRF protection** 기반의 SPA 인증 모델을 사용한다.

## 구성 요소

| 구성 요소               | 위치                              | 역할                                                                      |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `SecurityConfig`        | `infrastructure/security`         | SecurityFilterChain, CORS, CSRF, OAuth2 Login, logout, API error handling |
| `CustomOidcUserService` | `infrastructure/security/oidc`    | Google OIDC 사용자 정보를 local `User`와 동기화                           |
| `CurrentUserService`    | `application/auth`                | Controller/Service에서 현재 로그인 사용자 조회                            |
| `User`                  | `core/user`                       | 애플리케이션 사용자 entity                                                |
| `UserRepository`        | `infrastructure/persistence/user` | 사용자 저장/조회                                                          |

## 인증 흐름

```text
Browser
  -> GET /oauth2/authorization/google
  -> Google Login
  -> GET /login/oauth2/code/google
  -> CustomOidcUserService loads/upserts User
  -> Spring Security creates HttpSession
  -> Spring Session stores session in Redis
  -> Redirect to http://localhost:5173/oauth/success
```

## 세션 저장

`spring-session-data-redis`를 사용한다.

```yaml
spring:
  session:
    timeout: 30m
    redis:
      namespace: demo:session
      flush-mode: on-save
      save-mode: on-set-attribute
```

쿠키 설정:

```yaml
server:
  servlet:
    session:
      cookie:
        name: SESSION
        http-only: true
        same-site: lax
        secure: false
```

운영 환경에서 HTTPS를 사용한다면 `secure: true`로 바꿔야 한다.

## CSRF

세션 쿠키 인증은 브라우저가 쿠키를 자동 전송하기 때문에 CSRF 공격에 취약할 수 있다. 이 서버는 Spring Security의 CSRF 보호를 유지한다.

```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
)
```

`HttpOnly=false`를 쓰는 이유는 React 클라이언트가 `XSRF-TOKEN` 쿠키를 읽어서 `X-XSRF-TOKEN` 헤더에 넣을 수 있도록 하기 위함이다.

## 프론트엔드 요청 규칙

1. 앱 초기화 시 `GET /api/v1/auth/csrf` 호출
2. 응답 cookie에 저장된 `XSRF-TOKEN` 읽기
3. `POST`, `PUT`, `PATCH`, `DELETE` 요청에 `X-XSRF-TOKEN` 헤더 추가
4. axios/fetch는 credentials를 포함해야 함

Axios 예시:

```ts
const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getCookie("XSRF-TOKEN");
  if (token) config.headers["X-XSRF-TOKEN"] = token;
  return config;
});
```

## CORS

현재 허용 origin:

```java
config.setAllowedOrigins(List.of("http://localhost:5173"));
config.setAllowCredentials(true);
```

운영 환경에서는 `application.yaml` 프로퍼티로 분리하는 것이 좋다.

예시 개선안:

```yaml
app:
  frontend:
    base-url: ${FRONTEND_BASE_URL:http://localhost:5173}
    allowed-origins: ${FRONTEND_ALLOWED_ORIGINS:http://localhost:5173}
```

## API 인증 정책

현재 보안 정책 요약:

- `/`, `/error`, `/login`, `/api/v1/auth/csrf`는 public
- `GET /api/v1/posts/**`는 public
- `POST/PUT/DELETE /api/v1/posts/**`는 authenticated
- 그 외 요청은 authenticated
- `/api/**` 인증 실패는 JSON `401`
- `/api/**` 인가 실패는 JSON `403`

## 로그아웃

```text
POST /api/v1/auth/logout
```

로그아웃은 세션을 무효화하고 `SESSION` 쿠키를 삭제한다.

## 새 보안 정책 추가 체크리스트

- [ ] 해당 API가 public인지 authenticated인지 명확한가?
- [ ] public GET API에서 개인화 필드가 필요한 경우 anonymous를 안전하게 처리하는가?
- [ ] unsafe method 요청에 CSRF 테스트가 있는가?
- [ ] CORS origin을 운영 환경에서 프로퍼티화했는가?
- [ ] 로그인 실패/권한 실패가 HTML redirect가 아니라 JSON으로 내려가는가?

## 참고 링크

- Spring Security OAuth2 Client — https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html
- Spring Security OAuth2 Login Core Configuration — https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html
- Spring Security CSRF — https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html
- Spring Session Redis — https://docs.spring.io/spring-session/reference/guides/boot-redis.html
