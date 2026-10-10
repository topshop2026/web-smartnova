WITH completed_sales AS (
  SELECT
    (order_item.item ->> 'product_id')::uuid AS product_id,
    SUM(COALESCE(NULLIF(order_item.item ->> 'quantity', '')::integer, 1))::integer AS units_sold
  FROM orders
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(orders.items_json, '[]'::jsonb)) AS order_item(item)
  WHERE orders.status = 'completed'
  GROUP BY (order_item.item ->> 'product_id')::uuid
)
UPDATE products
SET sales_count = products.sales_count + completed_sales.units_sold
FROM completed_sales
WHERE products.id = completed_sales.product_id;

UPDATE products
SET
  rating = review_stats.average_rating,
  review_count = review_stats.review_count
FROM (
  SELECT
    product_id,
    round(avg(rating)::numeric, 1) AS average_rating,
    count(*)::integer AS review_count
  FROM product_reviews
  GROUP BY product_id
) AS review_stats
WHERE products.id = review_stats.product_id;

CREATE OR REPLACE FUNCTION track_completed_order_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item jsonb;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR order_item IN
      SELECT item
      FROM jsonb_array_elements(COALESCE(NEW.items_json, '[]'::jsonb)) AS requested_items(item)
    LOOP
      UPDATE products
      SET sales_count = sales_count + COALESCE(NULLIF(order_item ->> 'quantity', '')::integer, 1)
      WHERE id = (order_item ->> 'product_id')::uuid;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_completed_order_sales_trigger ON orders;
CREATE TRIGGER track_completed_order_sales_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_completed_order_sales();

CREATE OR REPLACE FUNCTION refresh_product_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_product_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    affected_product_id := OLD.product_id;
    UPDATE products
    SET
      rating = COALESCE((
        SELECT round(avg(rating)::numeric, 1)
        FROM product_reviews
        WHERE product_id = affected_product_id
      ), 0),
      review_count = (
        SELECT count(*)::integer
        FROM product_reviews
        WHERE product_id = affected_product_id
      )
    WHERE id = affected_product_id;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    affected_product_id := NEW.product_id;
    UPDATE products
    SET
      rating = COALESCE((
        SELECT round(avg(rating)::numeric, 1)
        FROM product_reviews
        WHERE product_id = affected_product_id
      ), 0),
      review_count = (
        SELECT count(*)::integer
        FROM product_reviews
        WHERE product_id = affected_product_id
      )
    WHERE id = affected_product_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_product_review_stats_trigger ON product_reviews;
CREATE TRIGGER refresh_product_review_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION refresh_product_review_stats();

DROP POLICY IF EXISTS "authenticated_verified_purchase_review" ON product_reviews;
CREATE POLICY "authenticated_verified_purchase_review" ON product_reviews FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.user_id = auth.uid()
        AND orders.status = 'completed'
        AND orders.fulfillment_status = 'completed'
        AND orders.items_json @> jsonb_build_array(
          jsonb_build_object('product_id', product_reviews.product_id)
        )
    )
  );
