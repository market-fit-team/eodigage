CREATE POLICY notifications_delete_recipient
ON notifications
FOR DELETE
USING (
    app_current_user_id() IS NOT NULL
    AND recipient_user_id = app_current_user_id()
);
