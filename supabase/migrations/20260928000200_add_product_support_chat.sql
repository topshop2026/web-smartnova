CREATE TABLE IF NOT EXISTS support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_customer_updated
  ON support_conversations (customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_created
  ON support_messages (conversation_id, created_at);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_own_or_admin_conversations" ON support_conversations;
CREATE POLICY "chat_read_own_or_admin_conversations" ON support_conversations FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "chat_customer_create_conversation" ON support_conversations;
CREATE POLICY "chat_customer_create_conversation" ON support_conversations FOR INSERT
  TO authenticated WITH CHECK (
    customer_id = auth.uid()
    AND customer_email = (auth.jwt() ->> 'email')
    AND status = 'open'
  );

DROP POLICY IF EXISTS "chat_admin_update_conversation" ON support_conversations;
CREATE POLICY "chat_admin_update_conversation" ON support_conversations FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "chat_read_accessible_messages" ON support_messages;
CREATE POLICY "chat_read_accessible_messages" ON support_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM support_conversations c
      WHERE c.id = conversation_id
        AND (
          c.customer_id = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "chat_send_as_customer_or_admin" ON support_messages;
CREATE POLICY "chat_send_as_customer_or_admin" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid()
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

CREATE OR REPLACE FUNCTION set_support_conversation_product_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT name INTO NEW.product_name FROM products WHERE id = NEW.product_id;
  IF NEW.product_name IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_support_conversation_product_name_trigger ON support_conversations;
CREATE TRIGGER set_support_conversation_product_name_trigger
  BEFORE INSERT ON support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION set_support_conversation_product_name();

CREATE OR REPLACE FUNCTION touch_support_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE support_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION set_support_conversation_product_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION touch_support_conversation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS touch_support_conversation_trigger ON support_messages;
CREATE TRIGGER touch_support_conversation_trigger
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_support_conversation();

GRANT SELECT, INSERT ON support_conversations TO authenticated;
GRANT UPDATE (status) ON support_conversations TO authenticated;
GRANT SELECT, INSERT ON support_messages TO authenticated;