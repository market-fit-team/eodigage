ALTER TABLE scheduled_posts
ADD COLUMN media_attachment_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE scheduled_posts
ADD CONSTRAINT chk_scheduled_posts_media_attachment_ids_array
CHECK (jsonb_typeof(media_attachment_ids) = 'array');

ALTER TABLE scheduled_posts
ADD CONSTRAINT chk_scheduled_posts_media_attachment_ids_limit
CHECK (jsonb_array_length(media_attachment_ids) <= 4);
