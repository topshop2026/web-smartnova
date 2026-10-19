CREATE TABLE IF NOT EXISTS public.popup_ad_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  title text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  image_path text,
  delay_seconds integer NOT NULL DEFAULT 3 CHECK (delay_seconds BETWEEN 1 AND 60),
  frequency text NOT NULL DEFAULT 'session'
    CHECK (frequency IN ('session', 'day', 'week', 'month')),
  target_url text CHECK (target_url IS NULL OR target_url ~* '^https?://')
);

ALTER TABLE public.popup_ad_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_popup_ad_settings" ON public.popup_ad_settings;
CREATE POLICY "public_read_popup_ad_settings" ON public.popup_ad_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_popup_ad_settings" ON public.popup_ad_settings;
CREATE POLICY "admin_insert_popup_ad_settings" ON public.popup_ad_settings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_popup_ad_settings" ON public.popup_ad_settings;
CREATE POLICY "admin_update_popup_ad_settings" ON public.popup_ad_settings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.popup_ad_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('popup-ad-images', 'popup-ad-images', true, 10485760, ARRAY['image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png'];

DROP POLICY IF EXISTS "admin_upload_popup_ad_images" ON storage.objects;
CREATE POLICY "admin_upload_popup_ad_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'popup-ad-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "admin_delete_popup_ad_images" ON storage.objects;
CREATE POLICY "admin_delete_popup_ad_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'popup-ad-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
