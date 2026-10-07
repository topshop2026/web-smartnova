CREATE TABLE IF NOT EXISTS editorial_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  quote text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE editorial_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_editorial_testimonials" ON editorial_testimonials;
CREATE POLICY "public_select_editorial_testimonials" ON editorial_testimonials
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_editorial_testimonials" ON editorial_testimonials;
CREATE POLICY "admin_insert_editorial_testimonials" ON editorial_testimonials
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_editorial_testimonials" ON editorial_testimonials;
CREATE POLICY "admin_delete_editorial_testimonials" ON editorial_testimonials
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_editorial_testimonials_product
  ON editorial_testimonials(product_id, created_at DESC);
