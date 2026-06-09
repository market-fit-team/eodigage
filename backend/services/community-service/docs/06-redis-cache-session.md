# Redis: Session and Cache

Redis는 이 서버에서 두 가지 역할을 한다.

1. Spring Session 저장소
2. Spring Cache / semantic related posts cache 저장소

## Session Storage

의존성:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'org.springframework.session:spring-session-data-redis'
```

설정:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 3s

  session:
    timeout: 30m
    redis:
      namespace: demo:session
      flush-mode: on-save
      save-mode: on-set-attribute
```

Redis에 세션을 저장하면 서버 인스턴스를 늘리더라도 동일 Redis를 바라보는 한 사용자의 로그인 세션을 유지할 수 있다.

## Cache Manager

`RedisConfig`는 Spring Cache를 활성화한다.

```java
@EnableCaching
public class RedisConfig {
    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        ...
    }
}
```

기본 정책:

- key serializer: `StringRedisSerializer`
- value serializer: `GenericJackson2JsonRedisSerializer`
- default TTL: 10분
- null cache disabled

## 게시글 캐시

`PostCommandService`는 게시글 생성/수정/삭제 시 캐시를 무효화한다.

```java
@CacheEvict(value = "posts", allEntries = true)
```

```java
@Caching(evict = {
    @CacheEvict(value = "post", key = "#id"),
    @CacheEvict(value = "posts", allEntries = true)
})
```

쓰기 작업 후 stale feed를 방지하기 위한 정책이다.

## Semantic Related Posts Cache

관련 게시글은 비용이 큰 upstream 호출을 줄이기 위해 Redis cache를 사용한다.

관련 클래스:

```text
infrastructure/cache/semantic/RelatedPostsCacheEntry.java
infrastructure/cache/semantic/RelatedPostsCacheKeyFactory.java
infrastructure/cache/semantic/RelatedPostsCacheRepository.java
infrastructure/http/semantic/config/PostSemanticProperties.java
```

설정:

```yaml
app:
  post:
    semantic:
      related-default-limit: ${POST_SEMANTIC_RELATED_DEFAULT_LIMIT:10}
      related-max-limit: ${POST_SEMANTIC_RELATED_MAX_LIMIT:20}
      related-cache-ttl: ${POST_SEMANTIC_RELATED_CACHE_TTL:P3D}
```

캐시 전략:

- 관련 게시글 결과는 일정 기간 TTL을 가진다.
- 응답 전체를 영구 저장하지 않고, 최신 게시글 상태를 반영할 수 있도록 필요한 최소 데이터만 캐시하는 방향이 좋다.
- 게시글 삭제/수정 시 semantic index sync 이벤트를 발행한다.

## 운영 시 체크리스트

- [ ] Redis persistence 설정이 필요한가?
- [ ] 세션 namespace가 환경별로 분리되어 있는가?
- [ ] cache key prefix가 충돌하지 않는가?
- [ ] TTL이 너무 길어 stale data가 오래 남지 않는가?
- [ ] `GenericJackson2JsonRedisSerializer`의 타입 정보가 배포 버전 변경과 충돌하지 않는가?

## Redis 장애 시 영향

| 장애               | 영향                                         |
| ------------------ | -------------------------------------------- |
| Redis session down | 로그인 세션 조회 실패, 사용자 인증 불가 가능 |
| Redis cache down   | 캐시 조회/저장 실패, upstream/DB 부하 증가   |
| Redis data flush   | 모든 사용자 세션 만료, 캐시 cold start       |

## 참고 링크

- Spring Session Redis — https://docs.spring.io/spring-session/reference/guides/boot-redis.html
- Spring Session Redis Configuration — https://docs.spring.io/spring-session/reference/configuration/redis.html
- Spring Data Redis — https://spring.io/projects/spring-data-redis
- Spring Cache with Redis — https://docs.spring.io/spring-boot/reference/io/caching.html
