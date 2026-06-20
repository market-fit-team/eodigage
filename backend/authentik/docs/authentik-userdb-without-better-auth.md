# Better Auth가 소유하지 않는 authentik 사용자 DB 경계

## 현재 경계

`frontend/src/features/auth/lib/auth.ts`는 Better Auth를 authentik OIDC client로만 쓴다.

```ts
export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "authentik",
          discoveryUrl: env.AUTHENTIK_DISCOVERY_URL,
          scopes: ["openid", "profile", "email"],
        },
      ],
    }),
    nextCookies(),
  ],
})
```

`frontend/src/app/api/auth/[...all]/route.ts`는 OAuth callback과 session cookie를 처리한다.
이 경계에서는 Better Auth가 브라우저 session facade다.
사용자 DB 원본은 authentik이다.

```text
Browser
  -> /api/auth/sign-in/oauth2
  -> authentik
  -> /api/auth/oauth2/callback/authentik
  -> Better Auth session cookie
```

## Better Auth가 소유하면 안 되는 값

Better Auth `user.id`, `session.userId`, `account.accountId`를 MSA의 사용자 FK로 쓰지 않는다.
이 값들은 Better Auth가 자기 DB 안에서 만든 local id다.

```json
{
  "session": {
    "userId": "yuU7T7ZWK7LO2VbGdqCH0fOXB4LCsJEZ"
  },
  "user": {
    "id": "yuU7T7ZWK7LO2VbGdqCH0fOXB4LCsJEZ"
  }
}
```

MSA가 공유하는 사용자 기준값은 authentik user다.
REST 생성/조회/수정/삭제는 `AUTHENTIK_SERVICE_ROLE_KEY`를 Bearer token으로 사용해 `/api/v3/core/users/`를 호출한다.

```text
MSA local row
  authentik_user_uuid: authentik.core.user.uuid
  authentik_user_pk: authentik.core.user.pk
```

`authentik_user_uuid`는 서비스 DB의 외부키 성격으로 둔다.
`authentik_user_pk`는 `/core/users/{pk}/` 호출용 캐시로 둔다.

## JWT claim

`pickle-web` provider는 현재 `sub_mode: hashed_user_id`다.
그래서 `jwt.sub`는 authentik REST user의 `pk`도 `uuid`도 아니다.

```text
jwt.sub != authentik core user pk
jwt.sub != authentik core user uuid
```

MSA에서 JWT만 보고 authentik user row를 찾으려면 authentik scope mapping을 추가한다.
이 claim이 들어가면 Better Auth session DB를 보지 않고도 백엔드가 user DB 기준값을 바로 얻는다.

```json
{
  "sub": "hashed-provider-subject",
  "email": "user@example.com",
  "name": "Example User",
  "authentik_user_pk": 5,
  "authentik_user_uuid": "27bc9058-687c-4dba-a409-0ef1bea8ff24"
}
```

`backend/services/community-service/src/main/java/com/example/server/application/auth/CurrentUserService.java`는 지금 `jwt.getSubject()`를 `providerSubject`로 저장한다.
이 코드는 claim mapping 이후 `authentik_user_uuid`를 우선 읽도록 바뀐다.

```java
String authentikUserUuid = jwt.getClaimAsString("authentik_user_uuid");
String authentikUserPk = jwt.getClaimAsString("authentik_user_pk");
```

`backend/services/community-service/src/main/java/com/example/server/core/user/User.java`의 local `app_users`는 도메인 FK용 캐시 테이블로 남는다.
프로필 원본은 authentik이고, community DB는 게시글/좋아요/알림 같은 도메인 row가 FK를 걸 수 있게 local surrogate key를 가진다.

```text
authentik.core.user
  -> app_users.authentik_user_uuid
  -> posts.user_id
  -> notifications.user_id
```

## 프로필 수정

프로필 수정 UI는 Better Auth `user` table을 수정하지 않는다.
프론트는 BFF나 MSA endpoint를 호출하고, 그 서버가 서비스롤키로 authentik `/core/users/{pk}/`를 PATCH 한다.

```text
Browser
  -> PATCH /api/profile/me
  -> profile-service
  -> PATCH http://authentik-server:9000/api/v3/core/users/{pk}/
```

요청 body는 authentik user shape에 맞춘다.

```json
{
  "name": "Example User",
  "attributes": {
    "displayName": "example-user"
  }
}
```

프로필을 읽는 서비스는 우선 JWT claim을 쓰고, 최신 값이 필요하면 `/core/users/{pk}/`를 조회한다.

## 제거 순서

Better Auth에서 제거할 소유권은 DB user identity다.
OAuth client와 browser session cookie는 프론트가 직접 authentik OIDC flow를 구현하기 전까지 남긴다.

```text
남김:
  /api/auth/[...all]
  genericOAuth providerId=authentik
  authClient.getAccessToken()
  browser session cookie

걷어냄:
  Better Auth user.id를 MSA FK로 사용
  Better Auth user profile을 원본으로 사용
  Better Auth session JSON을 user DB 계약으로 사용
```

MSA user contract는 이 shape로 고정한다.

```ts
type AuthentikUserRef = {
  authentikUserUuid: string
  authentikUserPk: number
  email: string
  name: string
  displayName?: string
}
```

## 주요 파일

- `frontend/src/features/auth/lib/auth.ts`
- `frontend/src/features/auth/lib/auth-client.ts`
- `frontend/src/features/auth/lib/server-access-token.ts`
- `frontend/src/features/auth/lib/fetch-with-auth.ts`
- `frontend/src/app/api/auth/[...all]/route.ts`
- `backend/services/community-service/src/main/java/com/example/server/application/auth/CurrentUserService.java`
- `backend/services/community-service/src/main/java/com/example/server/core/user/User.java`
- `backend/authentik/docs/msa-user-api.md`

## 참고 문서

- https://better-auth.com/docs/plugins/generic-oauth
- https://better-auth.com/docs/integrations/next
- https://docs.goauthentik.io/add-secure-apps/providers/oauth2/
- https://api.goauthentik.io/authentication/
- https://api.goauthentik.io/reference/core-users-list/
- https://api.goauthentik.io/reference/core-users-create/
- https://api.goauthentik.io/reference/core-users-partial-update/
- https://api.goauthentik.io/reference/core-users-destroy/
