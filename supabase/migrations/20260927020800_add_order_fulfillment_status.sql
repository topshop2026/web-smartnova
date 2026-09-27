ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'waiting_payment'
  CHECK (fulfillment_status IN (
    'waiting_payment', 'payment_success', 'order_received', 'waiting_data',
    'in_progress', 'review', 'revision', 'completed'
  ));

UPDATE orders
SET fulfillment_status = CASE
  WHEN status = 'completed' THEN 'payment_success'
  ELSE 'waiting_payment'
END
WHERE fulfillment_status = 'waiting_payment';

DROP POLICY IF EXISTS "admin_select_orders" ON orders;
CREATE POLICY "admin_select_orders" ON orders FOR SELECT
  TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_order_fulfillment" ON orders;
CREATE POLICY "admin_update_order_fulfillment" ON orders FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION update_order_fulfillment_status(
  p_order_id uuid,
  p_next_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') <> 'admin' THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_next_status NOT IN (
    'waiting_payment', 'payment_success', 'order_received', 'waiting_data',
    'in_progress', 'review', 'revision', 'completed'
  ) THEN
    RAISE EXCEPTION 'Invalid fulfillment status';
  END IF;

  UPDATE orders
  SET fulfillment_status = p_next_status
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  RETURN p_next_status;
END;
$$;

REVOKE ALL ON FUNCTION update_order_fulfillment_status(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION update_order_fulfillment_status(uuid, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION sync_payment_to_fulfillment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed'
     AND NEW.fulfillment_status = 'waiting_payment' THEN
    NEW.fulfillment_status := 'payment_success';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_payment_to_fulfillment_status_trigger ON orders;
CREATE TRIGGER sync_payment_to_fulfillment_status_trigger
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_to_fulfillment_status();
