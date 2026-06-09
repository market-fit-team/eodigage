package com.example.server.infrastructure.security;

import java.io.IOException;

import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import org.springframework.security.config.http.SessionCreationPolicy;
import lombok.RequiredArgsConstructor;

@Configuration // NOTE: [Spring] 설정 클래스로 지정
@RequiredArgsConstructor // NOTE: [Lombok] final 필드 생성자 주입
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);


    @Bean // NOTE: [Spring Security] 보안 필터 체인 빈 등록
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        return http
                .csrf(csrf -> csrf.disable()) // NOTE: JWT 기반 Stateless API이므로 CSRF 비활성화

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/error",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll() // NOTE: [Spring Security] 해당 경로는 인증 없이 허용
                        .requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll() // NOTE: [Spring Security] 게시글 조회는 전체 허용
                        .requestMatchers(HttpMethod.POST, "/api/v1/posts/**").authenticated() // NOTE: [Spring Security] 게시글 작성/댓글/좋아요는 인증 필요
                        .requestMatchers(HttpMethod.PUT, "/api/v1/posts/**").authenticated() // NOTE: [Spring Security] 게시글 수정은 인증 필요
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/posts/**").authenticated() // NOTE: [Spring Security] 게시글 삭제/좋아요 취소는 인증 필요
                        .anyRequest().authenticated() // NOTE: [Spring Security] 그 외 모든 요청은 인증 필요
                )

                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                apiAuthenticationEntryPoint(),
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                        )
                        .defaultAccessDeniedHandlerFor(
                                (request, response, accessDeniedException) -> {
                                    log.warn(
                                            "Access denied. method={}, path={}",
                                            request.getMethod(),
                                            request.getRequestURI()
                                    );
                                    writeJsonError(
                                            response,
                                            HttpServletResponse.SC_FORBIDDEN,
                                            "접근 권한이 없습니다."
                                    );
                                },
                                PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                        )
                )

                .build();
    }

    private AuthenticationEntryPoint apiAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            log.warn(
                    "Unauthorized request. method={}, path={}",
                    request.getMethod(),
                    request.getRequestURI()
            );
            writeJsonError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "로그인이 필요합니다."
            );
        };
    }

    private void writeJsonError(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"status\":" + status + ",\"message\":\"" + message + "\"}"
        );
    }


}
