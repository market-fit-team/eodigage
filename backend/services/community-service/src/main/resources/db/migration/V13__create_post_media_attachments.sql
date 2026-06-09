CREATE TABLE post_media_attachments (
    id BIGSERIAL PRIMARY KEY,

    owner_user_id BIGINT NOT NULL,
    post_id BIGINT NULL,

    bucket VARCHAR(255) NOT NULL,
    object_key VARCHAR(1024) NOT NULL,

    original_filename VARCHAR(255) NULL,
    content_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL,

    width INT NULL,
    height INT NULL,

    alt_text VARCHAR(1500) NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attached_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_post_media_attachments_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_post_media_attachments_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_post_media_attachments_object_key
        UNIQUE (object_key),

    CONSTRAINT chk_post_media_attachments_status
        CHECK (status IN ('UPLOADED', 'ATTACHED', 'DELETED')),

    CONSTRAINT chk_post_media_attachments_byte_size
        CHECK (byte_size > 0),

    CONSTRAINT chk_post_media_attachments_sort_order
        CHECK (sort_order >= 0)
);

CREATE INDEX idx_post_media_attachments_owner_status_created
ON post_media_attachments (owner_user_id, status, created_at DESC, id DESC);

CREATE INDEX idx_post_media_attachments_post_sort
ON post_media_attachments (post_id, sort_order ASC, id ASC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_post_media_attachments_post
ON post_media_attachments (post_id)
WHERE deleted_at IS NULL;

ALTER TABLE post_media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media_attachments FORCE ROW LEVEL SECURITY;

CREATE POLICY post_media_attachments_select_owner
ON post_media_attachments
FOR SELECT
USING (
    app_current_user_id() IS NOT NULL
    AND owner_user_id = app_current_user_id()
);

CREATE POLICY post_media_attachments_select_attached
ON post_media_attachments
FOR SELECT
USING (
    deleted_at IS NULL
    AND status = 'ATTACHED'
);

CREATE POLICY post_media_attachments_insert_owner
ON post_media_attachments
FOR INSERT
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND owner_user_id = app_current_user_id()
);

CREATE POLICY post_media_attachments_update_owner
ON post_media_attachments
FOR UPDATE
USING (
    app_current_user_id() IS NOT NULL
    AND owner_user_id = app_current_user_id()
)
WITH CHECK (
    app_current_user_id() IS NOT NULL
    AND owner_user_id = app_current_user_id()
);
