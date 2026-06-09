package com.example.server.application.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.server.core.user.User;
import com.example.server.infrastructure.persistence.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service // NOTE: [Spring] 서비스 클래스로 지정
@RequiredArgsConstructor // NOTE: [Lombok] final 필드 생성자 주입
@Transactional(readOnly = true) // NOTE: [Spring] 읽기 전용 트랜잭션 적용
public class CurrentUserService {

    private final UserRepository userRepository;

    /**
     * 현재 로그인한 Jwt가 있으면 DB에서 사용자(User)를 조회하여 반환하고,
     * 없거나 로그인되지 않은 경우 401(UNAUTHORIZED), DB에 없는 경우 404(NOT_FOUND) 예외를 던집니다.
     */
    public User getRequiredUser(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다."
            );
        }

        return userRepository
                .findByProviderAndProviderSubject("google", jwt.getSubject())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "로그인 사용자 정보를 찾을 수 없습니다."
                ));
    }
}
