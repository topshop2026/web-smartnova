ALTER TABLE products
  ADD COLUMN IF NOT EXISTS feature_price numeric(12,2) NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS duration_prices jsonb NOT NULL DEFAULT '[]'::jsonb;

-- The original starter catalog used USD values; convert it once to the agreed demo rate.
UPDATE products
SET price = round(price * 16) * 1000,
    original_price = CASE
      WHEN original_price IS NULL THEN NULL
  WHEN original_price < 1000 THEN round(original_price * 16) * 1000
  ELSE original_price
    END
WHERE price < 1000;

UPDATE products
SET duration_prices = jsonb_build_array(
  jsonb_build_object('days', 1, 'surcharge', round(price * 0.50 / 1000) * 1000),
  jsonb_build_object('days', 2, 'surcharge', round(price * 0.25 / 1000) * 1000),
  jsonb_build_object('days', 3, 'surcharge', round(price * 0.10 / 1000) * 1000),
  jsonb_build_object('days', 7, 'surcharge', 0),
  jsonb_build_object('days', 14, 'surcharge', 0)
)
WHERE duration_prices = '[]'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS payment_token text,
  ADD COLUMN IF NOT EXISTS payment_redirect_url text;

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
  ON product_reviews (product_id, user_id)
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "customer_select_own_orders" ON orders;
CREATE POLICY "customer_select_own_orders" ON orders FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;
DROP POLICY IF EXISTS "authenticated_verified_purchase_review" ON product_reviews;
CREATE POLICY "authenticated_verified_purchase_review" ON product_reviews FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.user_id = auth.uid()
        AND orders.status = 'completed'
        AND orders.items_json @> jsonb_build_array(
          jsonb_build_object('product_id', product_reviews.product_id)
        )
    )
  );

DROP POLICY IF EXISTS "admin_update_product_pricing" ON products;
CREATE POLICY "admin_update_product_pricing" ON products FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');