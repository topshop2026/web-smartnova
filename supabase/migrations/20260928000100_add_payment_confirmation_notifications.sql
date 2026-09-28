ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_confirmation_claim_token uuid,
  ADD COLUMN IF NOT EXISTS email_confirmation_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_claim_token uuid,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_claimed_at timestamptz;

DROP FUNCTION reserve_order_inventory(text, uuid, text, text, numeric, jsonb);

CREATE OR REPLACE FUNCTION reserve_order_inventory(
  p_order_number text,
  p_user_id uuid,
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
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
  IF p_customer_phone !~ '^62[0-9]{8,13}$' THEN
    RAISE EXCEPTION 'Invalid WhatsApp number';
  END IF;

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
    order_number, user_id, customer_email, customer_name, customer_phone, whatsapp_consent_at,
    total_amount, currency, status, items_json
  ) VALUES (
    p_order_number, p_user_id, p_customer_email, p_customer_name, p_customer_phone, now(),
    p_total_amount, 'IDR', 'pending', p_items_json
  ) RETURNING id INTO created_order_id;

  RETURN created_order_id;
END;
$$;

REVOKE ALL ON FUNCTION reserve_order_inventory(text, uuid, text, text, text, numeric, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_order_inventory(text, uuid, text, text, text, numeric, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION claim_order_payment_notification(
  p_order_number text,
  p_channel text,
  p_claim_token uuid
)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  customer_email text,
  customer_name text,
  customer_phone text,
  total_amount numeric,
  items_json jsonb,
  claim_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel = 'email' THEN
    RETURN QUERY
    UPDATE orders AS o
    SET email_confirmation_claim_token = p_claim_token,
        email_confirmation_claimed_at = now()
    WHERE o.order_number = p_order_number
      AND o.status = 'completed'
      AND o.email_confirmation_sent_at IS NULL
      AND (o.email_confirmation_claim_token IS NULL
        OR o.email_confirmation_claimed_at < now() - interval '5 minutes')
    RETURNING o.id, o.order_number, o.customer_email, o.customer_name,
      o.customer_phone, o.total_amount, o.items_json, p_claim_token;
  ELSIF p_channel = 'whatsapp' THEN
    RETURN QUERY
    UPDATE orders AS o
    SET whatsapp_confirmation_claim_token = p_claim_token,
        whatsapp_confirmation_claimed_at = now()
    WHERE o.order_number = p_order_number
      AND o.status = 'completed'
      AND o.customer_phone IS NOT NULL
      AND o.whatsapp_confirmation_sent_at IS NULL
      AND (o.whatsapp_confirmation_claim_token IS NULL
        OR o.whatsapp_confirmation_claimed_at < now() - interval '5 minutes')
    RETURNING o.id, o.order_number, o.customer_email, o.customer_name,
      o.customer_phone, o.total_amount, o.items_json, p_claim_token;
  ELSE
    RAISE EXCEPTION 'Invalid notification channel';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION complete_order_payment_notification(
  p_order_id uuid,
  p_channel text,
  p_claim_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel = 'email' THEN
    UPDATE orders
    SET email_confirmation_sent_at = now(),
        email_confirmation_claim_token = NULL,
        email_confirmation_claimed_at = NULL
    WHERE id = p_order_id
      AND status = 'completed'
      AND email_confirmation_claim_token = p_claim_token;
  ELSIF p_channel = 'whatsapp' THEN
    UPDATE orders
    SET whatsapp_confirmation_sent_at = now(),
        whatsapp_confirmation_claim_token = NULL,
        whatsapp_confirmation_claimed_at = NULL
    WHERE id = p_order_id
      AND status = 'completed'
      AND whatsapp_confirmation_claim_token = p_claim_token;
  ELSE
    RAISE EXCEPTION 'Invalid notification channel';
  END IF;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION release_order_payment_notification(
  p_order_id uuid,
  p_channel text,
  p_claim_token uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel = 'email' THEN
    UPDATE orders
    SET email_confirmation_claim_token = NULL,
        email_confirmation_claimed_at = NULL
    WHERE id = p_order_id AND email_confirmation_claim_token = p_claim_token;
  ELSIF p_channel = 'whatsapp' THEN
    UPDATE orders
    SET whatsapp_confirmation_claim_token = NULL,
        whatsapp_confirmation_claimed_at = NULL
    WHERE id = p_order_id AND whatsapp_confirmation_claim_token = p_claim_token;
  ELSE
    RAISE EXCEPTION 'Invalid notification channel';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION claim_order_payment_notification(text, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_order_payment_notification(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_order_payment_notification(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_order_payment_notification(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION complete_order_payment_notification(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION release_order_payment_notification(uuid, text, uuid) TO service_role;