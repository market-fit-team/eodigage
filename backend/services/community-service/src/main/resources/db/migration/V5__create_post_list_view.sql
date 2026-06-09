-- V5: post_list_view 데이터베이스 뷰 생성
CREATE OR REPLACE VIEW post_list_view
WITH (security_invoker = true) -- 호출자의 RLS 및 권한을 그대로 평가
AS
SELECT
    p.id,
    p.title,
    p.user_id AS author_id,
    u.name AS author_name,
    u.picture_url AS author_picture_url,
    p.created_at,
    p.updated_at,
    COUNT(pl.id)::BIGINT AS like_count,
    -- 현재 세션 사용자 ID(app_current_user_id)를 기준으로 좋아요 클릭 여부 계산
    EXISTS (
        SELECT 1
        FROM post_likes mine
        WHERE mine.post_id = p.id
          AND mine.user_id = app_current_user_id()
    ) AS liked_by_me
FROM posts p
JOIN app_users u
    ON u.id = p.user_id
LEFT JOIN post_likes pl
    ON pl.post_id = p.id
GROUP BY
    p.id,
    p.title,
    p.user_id,
    u.name,
    u.picture_url,
    p.created_at,
    p.updated_at;
