CREATE TABLE notification_delivery_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    notification_id BIGINT NOT NULL,
    recipient_user_id BIGINT NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    delivery_status VARCHAR(40) NOT NULL,
    failure_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notification_delivery_events_notification
        FOREIGN KEY (notification_id)
        REFERENCES notifications(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_delivery_events_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_notification_delivery_status
        CHECK (delivery_status IN ('SSE_SENT', 'STORED_ONLY', 'FAILED'))
);

CREATE INDEX idx_notification_delivery_events_notification
ON notification_delivery_events (notification_id);

CREATE INDEX idx_notification_delivery_events_recipient_created_at
ON notification_delivery_events (recipient_user_id, created_at DESC, id DESC);
