-- NOTE: [Flyway] V1 마이그레이션 - app_users 및 posts 테이블 구조 생성

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_subject VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(255),
    role VARCHAR(30) NOT NULL,
    CONSTRAINT uk_user_provider_subject UNIQUE (provider, provider_subject)
);

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id)
        REFERENCES app_users (id)
        ON DELETE RESTRICT -- NOTE: 사용자 임의 탈퇴 시 게시글이 존재하면 탈퇴 차단 정책 적용
);

-- NOTE: 게시글 작성자별 조회/필터링 최적화를 위해 인덱스 추가
CREATE INDEX idx_posts_user_id ON posts (user_id);
