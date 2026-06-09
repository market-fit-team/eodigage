DROP VIEW IF EXISTS post_list_view;
DROP VIEW IF EXISTS post_summary_view;

CREATE OR REPLACE VIEW post_summary_view
WITH (security_invoker = true)
AS
SELECT
    p.id,
    CASE
        WHEN p.deleted_at IS NULL THEN p.content
        ELSE NULL
    END AS content,
    p.user_id AS author_id,
    u.name AS author_name,
    u.picture_url AS author_picture_url,
    p.parent_id,
    p.root_id,
    p.depth,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    (p.deleted_at IS NOT NULL) AS deleted,
    COUNT(DISTINCT pl.id)::BIGINT AS like_count,
    COUNT(DISTINCT reply.id)::BIGINT AS reply_count,
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
LEFT JOIN posts reply
    ON reply.parent_id = p.id
   AND reply.deleted_at IS NULL
GROUP BY
    p.id,
    p.content,
    p.user_id,
    u.name,
    u.picture_url,
    p.parent_id,
    p.root_id,
    p.depth,
    p.created_at,
    p.updated_at,
    p.deleted_at;
