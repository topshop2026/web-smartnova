ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(attachments) = 'array');

ALTER TABLE support_messages
  DROP CONSTRAINT IF EXISTS support_messages_body_check;

ALTER TABLE support_messages
  ADD CONSTRAINT support_messages_body_or_attachments_check
  CHECK (char_length(body) BETWEEN 1 AND 4000 OR attachments <> '[]'::jsonb);

DROP POLICY IF EXISTS "chat_send_as_customer_or_admin" ON support_messages;
CREATE POLICY "chat_send_as_customer_or_admin" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND jsonb_typeof(attachments) = 'array'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(attachments) AS attachment(value)
      WHERE COALESCE(value ->> 'path', '') NOT LIKE conversation_id::text || '/%'
    )
    AND EXISTS (
      SELECT 1 FROM support_conversations c
      WHERE c.id = conversation_id
        AND c.status = 'open'
        AND (
          c.customer_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-chat-attachments',
  'support-chat-attachments',
  false,
  10485760,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/csv', 'application/rtf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat_read_conversation_attachments" ON storage.objects;
CREATE POLICY "chat_read_conversation_attachments" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'support-chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.customer_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "chat_upload_conversation_attachments" ON storage.objects;
CREATE POLICY "chat_upload_conversation_attachments" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'support-chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.status = 'open'
        AND (
          c.customer_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "chat_delete_conversation_attachments" ON storage.objects;
CREATE POLICY "chat_delete_conversation_attachments" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'support-chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (
          c.customer_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );