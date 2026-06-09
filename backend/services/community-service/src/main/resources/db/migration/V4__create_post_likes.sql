-- V4: post_likes 테이블 생성, 제약 조건, RLS 정책 수립
CREATE TABLE post_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_post_likes_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_post_likes_user
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    -- 중복 좋아요 방어선: 데이터베이스 유니크 제약
    CONSTRAINT uk_post_likes_post_user
        UNIQUE (post_id, user_id)
);

-- 검색 속도 최적화를 위한 인덱스들 추가
CREATE INDEX idx_post_likes_post_id
ON post_likes (post_id);

CREATE INDEX idx_post_likes_user_id
ON post_likes (user_id);

CREATE INDEX idx_post_likes_post_user
ON post_likes (post_id, user_id);

-- ROW LEVEL SECURITY 활성화 및 강제화
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes FORCE ROW LEVEL SECURITY;

-- 1. SELECT 정책: 좋아요 집계를 위해 모든 조회를 허용 (특정인에게 한정할 경우 전체 카운트 계산 불가능)
CREATE POLICY post_likes_select_all
ON post_likes
FOR SELECT
USING (true);

-- 2. INSERT 정책: 현재 로그인한 세션 사용자 본인의 좋아요만 생성 가능
CREATE POLICY post_likes_insert_own
ON post_likes
FOR INSERT
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);

-- 3. DELETE 정책: 현재 로그인한 세션 사용자 본인의 좋아요만 삭제 가능
CREATE POLICY post_likes_delete_own
ON post_likes
FOR DELETE
USING (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);
