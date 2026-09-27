ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 100
  CHECK (stock >= 0);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION reserve_order_inventory(
  p_order_number text,
  p_user_id uuid,
  p_customer_email text,
  p_customer_name text,
  p_total_amount numeric,
  p_items_json jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item jsonb;
  product_id uuid;
  item_quantity integer;
  created_order_id uuid;
BEGIN
  FOR order_item IN
    SELECT item
    FROM jsonb_array_elements(p_items_json) AS requested_items(item)
    ORDER BY (item ->> 'product_id')::uuid
  LOOP
    product_id := (order_item ->> 'product_id')::uuid;
    item_quantity := (order_item ->> 'quantity')::integer;

    IF item_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    UPDATE products
    SET stock = stock - item_quantity
    WHERE id = product_id AND stock >= item_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', product_id
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO orders (
    order_number, user_id, customer_email, customer_name,
    total_amount, currency, status, items_json
  ) VALUES (
    p_order_number, p_user_id, p_customer_email, p_customer_name,
    p_total_amount, 'IDR', 'pending', p_items_json
  ) RETURNING id INTO created_order_id;

  RETURN created_order_id;
END;
$$;

REVOKE ALL ON FUNCTION reserve_order_inventory(text, uuid, text, text, numeric, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_order_inventory(text, uuid, text, text, numeric, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION update_midtrans_order_status(
  p_order_number text,
  p_total_amount numeric,
  p_next_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order orders%ROWTYPE;
  order_item jsonb;
  product_id uuid;
  item_quantity integer;
BEGIN
  IF p_next_status NOT IN ('pending', 'completed', 'failed', 'expired', 'refunded') THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  SELECT * INTO current_order
  FROM orders
  WHERE order_number = p_order_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF round(current_order.total_amount) <> round(p_total_amount) THEN
    RAISE EXCEPTION 'Payment amount does not match order';
  END IF;

  IF current_order.status = 'refunded'
    OR (current_order.status = 'completed' AND p_next_status IN ('pending', 'failed', 'expired'))
    OR (current_order.status IN ('failed', 'expired') AND p_next_status = 'pending') THEN
    RETURN current_order.status;
  END IF;

  IF current_order.status IN ('failed', 'expired') AND p_next_status = 'completed' THEN
    FOR order_item IN
      SELECT item
      FROM jsonb_array_elements(current_order.items_json) AS requested_items(item)
      ORDER BY (item ->> 'product_id')::uuid
    LOOP
      product_id := (order_item ->> 'product_id')::uuid;
      item_quantity := (order_item ->> 'quantity')::integer;
      UPDATE products
      SET stock = stock - item_quantity
      WHERE id = product_id AND stock >= item_quantity;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for completed payment %', p_order_number
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;
  ELSIF current_order.status = 'pending' AND p_next_status IN ('failed', 'expired', 'refunded') THEN
    FOR order_item IN
      SELECT item
      FROM jsonb_array_elements(current_order.items_json) AS requested_items(item)
      ORDER BY (item ->> 'product_id')::uuid
    LOOP
      product_id := (order_item ->> 'product_id')::uuid;
      item_quantity := (order_item ->> 'quantity')::integer;
      UPDATE products SET stock = stock + item_quantity WHERE id = product_id;
    END LOOP;
  END IF;

  UPDATE orders SET status = p_next_status WHERE id = current_order.id;
  RETURN p_next_status;
END;
$$;

REVOKE ALL ON FUNCTION update_midtrans_order_status(text, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION update_midtrans_order_status(text, numeric, text)
  TO service_role;