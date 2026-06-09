package com.example.server.infrastructure.persistence.session;

import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Component // NOTE: [Spring] 빈으로 등록하여 필요한 곳에서 주입받아 사용할 수 있도록 함
public class DbSessionContext {

    @PersistenceContext // NOTE: [JPA] 컨테이너가 관리하는 EntityManager 주입
    private EntityManager entityManager;

    /**
     * PostgreSQL 데이터베이스 트랜잭션 범위 안에 현재 로그인한 사용자 ID를 설정 값으로 로드합니다.
     * 세 번째 인자를 true로 두어, 현재 트랜잭션이 끝나면 설정 정보가 무효화(Local Transaction Bound)되도록 유도합니다.
     */
    public void setCurrentUserId(Long userId) {
        entityManager
                .createNativeQuery("select set_config('app.current_user_id', :userId, true)")
                .setParameter("userId", userId.toString())
                .getSingleResult();
    }
}
