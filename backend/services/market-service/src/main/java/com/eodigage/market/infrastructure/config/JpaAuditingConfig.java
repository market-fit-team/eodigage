package com.eodigage.market.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing 활성화 설정.
 *
 * <p>{@code @EnableJpaAuditing}을 애플리케이션 메인 클래스가 아닌 별도 설정으로 분리한다.
 * 메인 클래스에 두면 {@code @WebMvcTest} 같은 웹 슬라이스 테스트가
 * {@code jpaAuditingHandler} 빈을 만들려다 JPA 메타모델이 비어 있어 실패한다.
 * 별도 {@code @Configuration}으로 두면 웹 슬라이스 테스트에서는 로드되지 않는다.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
