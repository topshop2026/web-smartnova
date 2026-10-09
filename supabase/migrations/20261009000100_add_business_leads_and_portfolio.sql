CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  contact text NOT NULL CHECK (
    char_length(btrim(contact)) BETWEEN 5 AND 254
    AND (
      contact ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      OR regexp_replace(contact, '[ ().-]', '', 'g') ~ '^\+?[0-9]{8,15}$'
    )
  ),
  project_type text NOT NULL CHECK (
    project_type IN ('website', 'online_store', 'mobile_app', 'custom_system', 'digital_product', 'other')
  ),
  service_package text CHECK (service_package IS NULL OR char_length(service_package) <= 160),
  budget text CHECK (budget IS NULL OR char_length(budget) <= 100),
  target_timeline text CHECK (target_timeline IS NULL OR char_length(target_timeline) <= 100),
  summary text NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 10 AND 3000),
  privacy_consent boolean NOT NULL CHECK (privacy_consent),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_submit_leads" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(name)) BETWEEN 2 AND 120
    AND char_length(btrim(contact)) BETWEEN 5 AND 254
    AND (
      contact ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      OR regexp_replace(contact, '[ ().-]', '', 'g') ~ '^\+?[0-9]{8,15}$'
    )
    AND char_length(btrim(summary)) BETWEEN 10 AND 3000
    AND privacy_consent = true
    AND status = 'new'
  );

CREATE POLICY "admin_read_leads" ON leads
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_update_leads" ON leads
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 160),
  summary text NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 10 AND 1200),
  role text NOT NULL CHECK (char_length(btrim(role)) BETWEEN 2 AND 160),
  technologies text[] NOT NULL DEFAULT '{}',
  outcomes text[] NOT NULL DEFAULT '{}',
  image_url text,
  demo_url text,
  published boolean NOT NULL DEFAULT false,
  is_concept boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_portfolio" ON portfolio_projects
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "admin_read_all_portfolio" ON portfolio_projects
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_manage_portfolio" ON portfolio_projects
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
