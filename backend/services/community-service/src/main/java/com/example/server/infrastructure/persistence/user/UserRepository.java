package com.example.server.infrastructure.persistence.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.core.user.User;

// NOTE: [Spring Data JPA] User 엔티티에 대한 DB 접근을 담당하는 인터페이스
public interface UserRepository extends JpaRepository<User, Long> {

    // NOTE: [Spring Data JPA] 메서드 이름으로 쿼리 생성 (provider와 providerSubject로 사용자 조회)
    Optional<User> findByProviderAndProviderSubject(
            String provider,
            String providerSubject
    );
}
