-- V6: posts를 마이크로블로그 thread 모델로 전환한다.
DROP VIEW IF EXISTS post_list_view;

ALTER TABLE posts
    RENAME COLUMN title TO content;

ALTER TABLE posts
    ALTER COLUMN content TYPE TEXT;

ALTER TABLE posts
    ADD COLUMN parent_id BIGINT NULL,
    ADD COLUMN root_id BIGINT NULL,
    ADD COLUMN depth INT NOT NULL DEFAULT 0,
    ADD COLUMN deleted_at TIMESTAMPTZ NULL;

UPDATE posts
SET root_id = id
WHERE root_id IS NULL;

ALTER TABLE posts
    ALTER COLUMN root_id SET NOT NULL;

ALTER TABLE posts
    ADD CONSTRAINT fk_posts_parent
    FOREIGN KEY (parent_id)
    REFERENCES posts(id)
    ON DELETE RESTRICT;

ALTER TABLE posts
    ADD CONSTRAINT fk_posts_root
    FOREIGN KEY (root_id)
    REFERENCES posts(id)
    ON DELETE RESTRICT;

ALTER TABLE posts
    ADD CONSTRAINT chk_posts_depth_non_negative
    CHECK (depth >= 0);

ALTER TABLE posts
    ADD CONSTRAINT chk_posts_root_depth
    CHECK (
        (parent_id IS NULL AND depth = 0)
        OR
        (parent_id IS NOT NULL AND depth > 0)
    );

ALTER TABLE posts
    ADD CONSTRAINT chk_posts_root_id_not_null
    CHECK (root_id IS NOT NULL);

CREATE INDEX idx_posts_feed_created_at_id_desc
ON posts (created_at DESC, id DESC)
WHERE parent_id IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_posts_parent_created_at_id_asc
ON posts (parent_id, created_at ASC, id ASC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_posts_root_created_at_id_asc
ON posts (root_id, created_at ASC, id ASC);

CREATE INDEX idx_posts_deleted_at
ON posts (deleted_at);
