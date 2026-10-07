ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz;

UPDATE orders
SET payment_completed_at = created_at
WHERE status = 'completed'
  AND payment_completed_at IS NULL;

CREATE OR REPLACE FUNCTION set_order_payment_completed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.payment_completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_payment_completed_at_trigger ON orders;
CREATE TRIGGER set_order_payment_completed_at_trigger
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_payment_completed_at();
