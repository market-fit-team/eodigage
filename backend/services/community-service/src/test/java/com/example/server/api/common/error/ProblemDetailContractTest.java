package com.example.server.api.common.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.lang.reflect.Method;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.server.infrastructure.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;

class ProblemDetailContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void 인증_실패_응답은_problem_detail과_www_authenticate를_반환한다() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(objectMapper);
        Method method = SecurityConfig.class.getDeclaredMethod("apiAuthenticationEntryPoint");
        method.setAccessible(true);
        AuthenticationEntryPoint entryPoint = (AuthenticationEntryPoint) method.invoke(securityConfig);

        var request = get("/api/v1/posts").buildRequest(null);
        var response = new org.springframework.mock.web.MockHttpServletResponse();

        entryPoint.commence(request, response, null);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getHeader("WWW-Authenticate")).isEqualTo("Bearer");
        assertThat(MediaType.parseMediaType(response.getContentType()))
                .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(body(response))
                .containsEntry("type", "about:blank")
                .containsEntry("title", "Unauthorized")
                .containsEntry("status", 401)
                .containsEntry("detail", "로그인이 필요합니다.")
                .containsEntry("instance", "/api/v1/posts");
    }

    @Test
    void 보안_예외_응답은_problem_detail을_반환한다() throws Exception {
        SecurityConfig securityConfig = new SecurityConfig(objectMapper);
        Method method = SecurityConfig.class.getDeclaredMethod(
                "writeProblemDetail",
                HttpServletRequest.class,
                jakarta.servlet.http.HttpServletResponse.class,
                HttpStatus.class,
                String.class
        );
        method.setAccessible(true);

        var request = get("/api/v1/posts/1").buildRequest(null);
        var response = new org.springframework.mock.web.MockHttpServletResponse();

        method.invoke(securityConfig, request, response, HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(MediaType.parseMediaType(response.getContentType()))
                .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(body(response))
                .containsEntry("type", "about:blank")
                .containsEntry("title", "Forbidden")
                .containsEntry("status", 403)
                .containsEntry("detail", "접근 권한이 없습니다.")
                .containsEntry("instance", "/api/v1/posts/1");
    }

    private Map<String, Object> body(org.springframework.mock.web.MockHttpServletResponse response) throws Exception {
        return objectMapper.readValue(response.getContentAsString(), new TypeReference<>() {});
    }
}
