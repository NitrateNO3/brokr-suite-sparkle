DROP POLICY IF EXISTS "images public read" ON public.property_images;
CREATE POLICY "images public read" ON public.property_images
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_images.property_id AND p.is_published = true));

DROP POLICY IF EXISTS "videos public read" ON public.property_videos;
CREATE POLICY "videos public read" ON public.property_videos
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_videos.property_id AND p.is_published = true));