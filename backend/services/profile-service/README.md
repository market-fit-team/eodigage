# profile-service

`profile-service`는 Authentik access token의 `user_profile` claim을 기준으로 현재 로그인 사용자를 식별한다.
`user_profile.uuid`로 Authentik 사용자를 찾고, 프로필 조회/수정은 내부적으로 `AUTHENTIK_SERVICE_ROLE_KEY`를 사용해 authentik `/api/v3/core/users/` API를 호출한다.

## 엔드포인트

- `GET /health`
- `GET /v3/api-docs`
- `GET /user-profile`
- `PATCH /user-profile`
