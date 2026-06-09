# Testing

이 서버는 단위 테스트와 통합 테스트를 함께 사용한다. 특히 DB, RabbitMQ, S3 호환 스토리지처럼 실제 인프라 동작이 중요한 부분은 Testcontainers를 사용한다.

## 의존성

```gradle
testImplementation 'org.springframework.boot:spring-boot-starter-test'
testImplementation 'org.springframework.security:spring-security-test'
testImplementation 'org.springframework.boot:spring-boot-testcontainers'
testImplementation 'org.testcontainers:testcontainers'
testImplementation 'org.testcontainers:junit-jupiter'
testImplementation 'org.testcontainers:postgresql'
testImplementation 'org.testcontainers:rabbitmq'
testImplementation 'org.testcontainers:minio'
```

## 테스트 실행

```bash
./gradlew test
```

## 테스트 리포트

```text
build/reports/tests/test/index.html
```

## 테스트 설정

```text
src/test/resources/application-test.yml
```

테스트에서는 OAuth2 dummy client, Redis namespace 분리, Flyway migration 활성화 등을 사용한다.

## 현재 테스트 패키지

```text
src/test/java/com/example/server
 ├─ api
 │   ├─ auth
 │   ├─ llm
 │   ├─ notification
 │   ├─ post
 │   ├─ postlike
 │   ├─ scheduledpost
 │   └─ semantic
 ├─ application
 │   └─ semantic
 ├─ core
 │   └─ post
 ├─ db
 ├─ infrastructure
 │   ├─ cache/semantic
 │   ├─ http/llm/mapper
 │   └─ security/oidc
 └─ support
```

## 테스트 지원 클래스

```text
support/IntegrationTestSupport.java
support/TestDataHelper.java
```

`IntegrationTestSupport`는 통합 테스트의 공통 인프라를 구성한다. PostgreSQL/RabbitMQ/MinIO/Redis 등을 실제 container로 띄우는 방식이 적합하다.

## 테스트 유형

### 1. Core Unit Test

대상:

- entity factory method
- entity state transition
- validation rule
- pure business behavior

예:

```text
core/post/PostTest.java
```

특징:

- Spring context 없이 빠르게 실행 가능해야 한다.
- DB나 외부 인프라에 의존하지 않는다.

### 2. API Integration Test

대상:

- Controller routing
- validation
- security / CSRF
- JSON response shape
- authenticated/anonymous behavior

예:

```text
api/post/PostQueryApiTest.java
api/post/PostValidationTest.java
api/post/PostApiAuthorizationTest.java
api/notification/NotificationApiTest.java
```

MockMvc를 사용한다.

### 3. Persistence / DB Policy Test

대상:

- Flyway migration
- JPA mapping validation
- RLS 정책
- DB view/projection

예:

```text
db/FlywayMigrationTest.java
db/PostRlsPolicyTest.java
```

RLS는 단순 repository mock으로 검증할 수 없다. 실제 PostgreSQL이 필요하다.

### 4. Infrastructure Test

대상:

- Redis repository
- HTTP upstream client
- RabbitMQ producer/consumer
- S3 storage adapter

예:

```text
infrastructure/cache/semantic/RelatedPostsCacheRepositoryTest.java
infrastructure/http/llm/mapper/LlmGatewayUpstreamResponseMapperTest.java
infrastructure/security/oidc/OAuth2RedirectServiceTest.java
infrastructure/security/oidc/OidcAuthenticationSuccessHandlerTest.java
```

LLM gateway는 현재 세부 HTTP client class를 나누지 않고 `LlmGatewayHttpGateway` adapter가 LangGraph JSON/SSE 호출을 담당한다. API 레벨에서는 `LlmGatewayApiTest`가 인증, thread 소유권, SSE relay header를 검증하고, mapper 레벨에서는 tools/models 응답 변환을 검증한다.

## MockMvc 테스트 팁

- 인증 사용자 테스트에는 `spring-security-test`를 사용한다.
- unsafe method는 CSRF token 포함 테스트를 한다.
- API는 response status뿐 아니라 JSON shape도 검증한다.

예시 형태:

```java
mockMvc.perform(post("/api/v1/posts")
        .with(csrf())
        .with(oidcLogin())
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"content\":\"hello\"}"))
    .andExpect(status().isCreated());
```

## Testcontainers 원칙

- DB policy, migration, RabbitMQ, S3 같은 인프라 통합은 mock보다 container 테스트를 우선한다.
- 테스트 데이터는 각 테스트에서 명시적으로 생성한다.
- container 재사용과 테스트 격리는 균형을 잡는다.
- RLS 테스트는 서로 다른 사용자 context를 반드시 검증한다.

## 테스트 추가 체크리스트

새 기능 추가 시 최소한 다음을 고려한다.

- [ ] core entity 또는 command service 단위 테스트
- [ ] API 성공/실패/validation 테스트
- [ ] 인증/인가 테스트
- [ ] DB migration 테스트
- [ ] RLS 대상이면 RLS 정책 테스트
- [ ] LLM thread처럼 owner binding이 필요한 리소스는 다른 사용자 접근 차단 테스트
- [ ] RabbitMQ/SSE/S3/Redis를 쓰면 infrastructure integration test
- [ ] 캐시 무효화가 필요한 쓰기 기능이면 cache invalidation 테스트

## CI에서 주의할 점

- Docker daemon이 필요하다.
- Testcontainers가 사용할 수 있는 network와 image pull 권한이 필요하다.
- PostgreSQL/RabbitMQ/MinIO image pull 시간이 첫 실행에서 길 수 있다.
- 테스트 병렬화 시 DB/RabbitMQ state isolation을 확인한다.

## 참고 링크

- Spring Boot Testing — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html
- MockMvc Reference — https://docs.spring.io/spring-framework/reference/testing/mockmvc.html
- Testcontainers JUnit 5 — https://java.testcontainers.org/test_framework_integration/junit_5/
- Spring Boot Testcontainers — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html
- Spring Security Test — https://docs.spring.io/spring-security/reference/servlet/test/index.html
