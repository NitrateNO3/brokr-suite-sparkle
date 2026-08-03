REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "amenities manage" ON public.amenities;
CREATE POLICY "amenities manage" ON public.amenities FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "locations manage" ON public.locations;
CREATE POLICY "locations manage" ON public.locations FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "settings manage" ON public.settings;
CREATE POLICY "settings manage" ON public.settings FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team manage properties" ON public.properties;
CREATE POLICY "team manage properties" ON public.properties FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "images manage" ON public.property_images;
CREATE POLICY "images manage" ON public.property_images FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "videos manage" ON public.property_videos;
CREATE POLICY "videos manage" ON public.property_videos FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "documents manage" ON public.property_documents;
CREATE POLICY "documents manage" ON public.property_documents FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team update leads" ON public.leads;
CREATE POLICY "team update leads" ON public.leads FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team delete leads" ON public.leads;
CREATE POLICY "team delete leads" ON public.leads FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "team write activity" ON public.activity_log;
CREATE POLICY "team write activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (actor_id IS NULL OR actor_id = auth.uid()));

DROP POLICY IF EXISTS "anyone can submit lead" ON public.leads;
CREATE POLICY "anyone can submit lead" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND (phone IS NULL OR length(phone) <= 32)
    AND (email IS NULL OR length(email) <= 200)
    AND (message IS NULL OR length(message) <= 2000)
    AND (notes IS NULL OR length(notes) <= 2000)
    AND status = 'new'::lead_status
    AND (
      property_id IS NULL
      OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.is_published = true)
    )
  );

DROP POLICY IF EXISTS "anyone can record view" ON public.property_views;
CREATE POLICY "anyone can record view" ON public.property_views FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.is_published = true)
  );

DROP POLICY IF EXISTS "media read" ON storage.objects;
CREATE POLICY "media read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-media' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "media insert" ON storage.objects;
CREATE POLICY "media insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-media'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id::text = (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "media update" ON storage.objects;
CREATE POLICY "media update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id::text = (storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'property-media'
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id::text = (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "media delete" ON storage.objects;
CREATE POLICY "media delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id::text = (storage.foldername(name))[1])
  );