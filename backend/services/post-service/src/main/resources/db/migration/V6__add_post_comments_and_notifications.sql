CREATE TABLE post_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id),
    user_id VARCHAR(200) NOT NULL,
    author_name VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_post_comments_post
    ON post_comments (post_id, created_at ASC, id ASC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_post_comments_author
    ON post_comments (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_user_id VARCHAR(200) NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message VARCHAR(500) NOT NULL,
    target_post_id UUID,
    target_comment_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_notifications_recipient
    ON notifications (recipient_user_id, is_read, created_at DESC, id DESC);
