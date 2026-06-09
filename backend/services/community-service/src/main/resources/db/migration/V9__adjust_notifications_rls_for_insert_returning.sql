-- V9: notifications INSERT + RETURNING 경로에서 actor가 RLS SELECT를 통과하도록 정책을 보완한다.

DROP POLICY IF EXISTS notifications_select_recipient ON notifications;

CREATE POLICY notifications_select_recipient_or_actor
ON notifications
FOR SELECT
USING (
    app_current_user_id() IS NOT NULL
    AND (
        recipient_user_id = app_current_user_id()
        OR actor_user_id = app_current_user_id()
    )
);
