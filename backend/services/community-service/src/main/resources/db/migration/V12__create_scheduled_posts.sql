CREATE TABLE scheduled_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_id BIGINT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    published_post_id BIGINT NULL,
    locked_at TIMESTAMPTZ NULL,
    published_at TIMESTAMPTZ NULL,
    failed_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_scheduled_posts_user
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_scheduled_posts_parent
        FOREIGN KEY (parent_id)
        REFERENCES posts(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_scheduled_posts_published_post
        FOREIGN KEY (published_post_id)
        REFERENCES posts(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_scheduled_posts_status
        CHECK (status IN ('SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'CANCELED', 'FAILED')),

    CONSTRAINT chk_scheduled_posts_scheduled_at_futureish
        CHECK (scheduled_at > created_at)
);

CREATE INDEX idx_scheduled_posts_due
ON scheduled_posts (status, scheduled_at, id);

CREATE INDEX idx_scheduled_posts_user_created_at
ON scheduled_posts (user_id, created_at DESC, id DESC);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts FORCE ROW LEVEL SECURITY;

CREATE POLICY scheduled_posts_select_own
ON scheduled_posts
FOR SELECT
USING (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);

CREATE POLICY scheduled_posts_insert_own
ON scheduled_posts
FOR INSERT
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);

CREATE POLICY scheduled_posts_update_own
ON scheduled_posts
FOR UPDATE
USING (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
)
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND user_id = app_current_user_id()
);
