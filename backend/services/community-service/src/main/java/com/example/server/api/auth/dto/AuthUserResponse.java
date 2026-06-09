package com.example.server.api.auth.dto;

import com.example.server.core.user.User;
import com.example.server.core.user.UserRole;

// NOTE: [Java 14+] Record를 사용하여 불변(Immutable) 데이터 객체를 간결하게 정의
public record AuthUserResponse(
        Long id,
        String email,
        boolean emailVerified,
        String name,
        String pictureUrl,
        UserRole role
) {
    // NOTE: [Java] Entity 객체를 응답 DTO로 변환하는 정적 팩토리 메서드
    public static AuthUserResponse from(User user) {
        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getName(),
                user.getPictureUrl(),
                user.getRole()
        );
    }
}
