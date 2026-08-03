
CREATE POLICY "media read" ON storage.objects FOR SELECT USING (bucket_id = 'property-media');
CREATE POLICY "media insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-media');
CREATE POLICY "media update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-media');
CREATE POLICY "media delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-media');
