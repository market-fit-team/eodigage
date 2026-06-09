CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    recipient_user_id BIGINT NOT NULL,
    actor_user_id BIGINT NOT NULL,

    type VARCHAR(50) NOT NULL,

    target_post_id BIGINT NOT NULL,
    source_post_id BIGINT NULL,

    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_target_post
        FOREIGN KEY (target_post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_source_post
        FOREIGN KEY (source_post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_notifications_type
        CHECK (type IN ('POST_REPLY', 'POST_LIKE'))
);

CREATE INDEX idx_notifications_recipient_created_at_id
ON notifications (recipient_user_id, created_at DESC, id DESC);

CREATE INDEX idx_notifications_recipient_read_at
ON notifications (recipient_user_id, read_at);

CREATE INDEX idx_notifications_actor_created_at_id
ON notifications (actor_user_id, created_at DESC, id DESC);

CREATE INDEX idx_notifications_target_post
ON notifications (target_post_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_recipient
ON notifications
FOR SELECT
USING (
    app_current_user_id() IS NOT NULL
    AND recipient_user_id = app_current_user_id()
);

CREATE POLICY notifications_insert_actor
ON notifications
FOR INSERT
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND actor_user_id = app_current_user_id()
);

CREATE POLICY notifications_update_recipient
ON notifications
FOR UPDATE
USING (
    app_current_user_id() IS NOT NULL
    AND recipient_user_id = app_current_user_id()
)
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND recipient_user_id = app_current_user_id()
);
