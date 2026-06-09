# OpenAPI 문서화

## 목적

서버는 `springdoc-openapi`를 사용해 OpenAPI 스펙을 제공한다.  
프론트엔드는 이 스펙을 기반으로 Orval을 사용해 타입 세이프 API 클라이언트, React Query 훅, MSW 핸들러, Zod 스키마를 생성한다.

## 엔드포인트

```txt
GET /v3/api-docs
GET /swagger-ui/index.html
```

`/api/v1`은 실제 서비스 API prefix이고, `/v3/api-docs`는 OpenAPI 문서 엔드포인트다.
`/v3/api-docs`는 API 버전이 아니다.

## Controller 작성 규칙

모든 Controller에는 `@Tag`를 붙인다.

```java
@Tag(name = "posts")
@RestController
@RequestMapping("/api/v1/posts")
public class PostCommandController {
}
```

모든 API 메서드에는 `@Operation`을 붙인다.

```java
@Operation(operationId = "createPost", summary = "게시글 생성")
@PostMapping
public ResponseEntity<PostResponse> create(...) {
    ...
}
```

## operationId 규칙

`operationId`는 프론트엔드 Orval 생성 코드의 함수명과 훅명에 영향을 준다.
따라서 전체 API에서 중복되지 않아야 하며, 명확한 동사 + 도메인 형태를 사용한다.

예시:

```txt
getMe
createPost
updatePost
deletePost
getNotifications
markNotificationAsRead
createScheduledPost
```

## 응답 타입 명시 규칙

OpenAPI는 Java 타입만 보고 nullable/required 여부를 항상 정확히 추론하지 못한다. 프론트엔드 Orval 생성 타입이 실제 API 계약과 어긋나지 않게, response record의 필드는 가능한 한 명시적으로 타입을 특정한다.

권장 기준:

- 응답에 항상 포함되는 필드는 `@Schema(requiredMode = Schema.RequiredMode.REQUIRED)`를 붙인다.
- 항상 포함되지만 값이 없을 수 있는 필드는 `requiredMode = REQUIRED, nullable = true`를 함께 사용한다.
- `parentId`, `publishedPostId`, 이미지 `width/height/altText`처럼 null 가능성이 계약인 필드는 nullable을 명시한다.
- controller 내부 파라미터는 schema에 나오지 않도록 `@Parameter(hidden = true)`를 유지한다.

예시:

```java
public record ScheduledPostResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long parentId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        Instant scheduledAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
        Long publishedPostId
) {
}
```

이렇게 해야 클라이언트 generated 타입이 `field?: T`처럼 불필요하게 optional로 풀리지 않고, 실제 응답 계약에 맞는 `field: T` 또는 `field: T | null` 형태에 가깝게 생성된다.

## 숨겨야 하는 파라미터

서버 내부에서만 사용하는 파라미터는 OpenAPI 스펙에 노출하지 않는다.

대상:

```txt
@AuthenticationPrincipal OidcUser
CsrfToken
```

예시:

```java
@Operation(operationId = "getMe", summary = "내 정보 조회")
@GetMapping("/me")
public AuthUserResponse me(
        @Parameter(hidden = true) @AuthenticationPrincipal OidcUser oidcUser
) {
    ...
}
```

```java
@Operation(operationId = "getCsrfToken", summary = "CSRF 토큰 조회")
@GetMapping("/csrf")
public CsrfToken csrf(
        @Parameter(hidden = true) CsrfToken csrfToken
) {
    return csrfToken;
}
```

## Security 설정

OpenAPI 문서 접근을 위해 아래 경로는 인증 없이 접근 가능해야 한다.

```txt
/v3/api-docs/**
/swagger-ui/**
/swagger-ui.html
```

실제 보호 대상 API는 기존처럼 `/api/v1/**` 기준으로 관리한다.

## 검증

서버 컴파일:

```bash
./gradlew clean compileJava
```

서버 실행 후 확인:

```txt
http://localhost:8080/v3/api-docs
http://localhost:8080/swagger-ui/index.html
```
