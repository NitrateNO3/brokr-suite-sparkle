ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS media_kind text NOT NULL DEFAULT 'photo';

DO $$ BEGIN
  ALTER TABLE public.property_images
    ADD CONSTRAINT property_images_media_kind_check
    CHECK (media_kind IN ('photo','floor_plan','360'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS builder text,
  ADD COLUMN IF NOT EXISTS share_show_documents boolean NOT NULL DEFAULT false;

-- Normalise slugs that contain spaces/symbols so shared links resolve.
WITH fixed AS (
  SELECT id,
         regexp_replace(
           regexp_replace(lower(btrim(slug)), '[^a-z0-9]+', '-', 'g'),
           '(^-+|-+$)', '', 'g'
         ) AS clean
  FROM public.properties
)
UPDATE public.properties p
SET slug = f.clean
FROM fixed f
WHERE p.id = f.id AND f.clean <> p.slug AND length(f.clean) > 2;

CREATE OR REPLACE FUNCTION public.get_published_property(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (jsonb_build_object(
    'id', p.id,
    'property_code', p.property_code,
    'title', p.title,
    'slug', p.slug,
    'property_type', p.property_type,
    'purpose', p.purpose,
    'status', p.status,
    'area_unit', p.area_unit,
    'age', p.age,
    'builder', p.builder,
    'cover_image', p.cover_image,
    'youtube_url', p.youtube_url,
    'virtual_tour_url', p.virtual_tour_url,
    'meta_title', p.meta_title,
    'meta_description', p.meta_description,
    'keywords', p.keywords,
    'is_published', p.is_published,
    'is_featured', p.is_featured,
    'is_verified', p.is_verified,
    'is_premium', p.is_premium,
    'is_hot', p.is_hot,
    'is_exclusive', p.is_exclusive,
    'views', p.views,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) || jsonb_build_object(
    'description', CASE WHEN p.share_show_description THEN p.description END,
    'price', CASE WHEN p.share_show_price THEN p.price END,
    'negotiable', CASE WHEN p.share_show_price THEN p.negotiable ELSE false END,
    'maintenance_charges', CASE WHEN p.share_show_price THEN p.maintenance_charges END,
    'booking_amount', CASE WHEN p.share_show_price THEN p.booking_amount END,
    'security_deposit', CASE WHEN p.share_show_price THEN p.security_deposit END,
    'city', CASE WHEN p.share_show_location THEN p.city END,
    'sector', CASE WHEN p.share_show_location THEN p.sector END,
    'pin_code', CASE WHEN p.share_show_location THEN p.pin_code END,
    'address', CASE WHEN p.share_show_address THEN p.address END,
    'landmark', CASE WHEN p.share_show_address THEN p.landmark END,
    'latitude', CASE WHEN p.share_show_address THEN p.latitude END,
    'longitude', CASE WHEN p.share_show_address THEN p.longitude END,
    'maps_url', CASE WHEN p.share_show_address THEN p.maps_url END,
    'bedrooms', CASE WHEN p.share_show_specs THEN p.bedrooms END
  ) || jsonb_build_object(
    'bathrooms', CASE WHEN p.share_show_specs THEN p.bathrooms END,
    'balconies', CASE WHEN p.share_show_specs THEN p.balconies END,
    'parking', CASE WHEN p.share_show_specs THEN p.parking END,
    'floor_no', CASE WHEN p.share_show_specs THEN p.floor_no END,
    'total_floors', CASE WHEN p.share_show_specs THEN p.total_floors END,
    'facing', CASE WHEN p.share_show_specs THEN p.facing END,
    'furnishing', CASE WHEN p.share_show_specs THEN p.furnishing END,
    'carpet_area', CASE WHEN p.share_show_specs THEN p.carpet_area END,
    'builtup_area', CASE WHEN p.share_show_specs THEN p.builtup_area END,
    'super_area', CASE WHEN p.share_show_specs THEN p.super_area END,
    'amenities', CASE WHEN p.share_show_amenities THEN to_jsonb(p.amenities) ELSE '[]'::jsonb END,
    'agent_name', CASE WHEN p.share_show_contact THEN p.agent_name END,
    'agent_phone', CASE WHEN p.share_show_contact THEN p.agent_phone END,
    'agent_whatsapp', CASE WHEN p.share_show_contact THEN p.agent_whatsapp END,
    'agent_email', CASE WHEN p.share_show_contact THEN p.agent_email END,
    'agent_office', CASE WHEN p.share_show_contact THEN p.agent_office END,
    'property_images', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'property_id', i.property_id, 'url', i.url,
        'alt', i.alt, 'sort_order', i.sort_order, 'is_featured', i.is_featured,
        'media_kind', i.media_kind, 'created_at', i.created_at
      ) ORDER BY i.sort_order)
      FROM public.property_images i WHERE i.property_id = p.id
    ), '[]'::jsonb),
    'property_videos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'url', v.url, 'title', v.title
      ) ORDER BY v.created_at)
      FROM public.property_videos v WHERE v.property_id = p.id
    ), '[]'::jsonb),
    'property_documents', CASE WHEN p.share_show_documents THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'url', d.url, 'name', d.name, 'doc_type', d.doc_type
      ) ORDER BY d.created_at)
      FROM public.property_documents d WHERE d.property_id = p.id
    ), '[]'::jsonb) ELSE '[]'::jsonb END
  ))
  FROM public.properties p
  WHERE p.slug = p_slug AND p.is_published = true AND p.is_archived = false
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_published_property(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_property(text) TO service_role;

-- Compact public cards for "similar" and "recent" strips on a shared page.
CREATE OR REPLACE FUNCTION public.list_published_property_cards(
  p_exclude_slug text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(card ORDER BY sort_rank, created_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      jsonb_build_object(
        'slug', p.slug,
        'title', p.title,
        'property_type', p.property_type,
        'purpose', p.purpose,
        'cover_image', p.cover_image,
        'price', CASE WHEN p.share_show_price THEN p.price END,
        'city', CASE WHEN p.share_show_location THEN p.city END,
        'sector', CASE WHEN p.share_show_location THEN p.sector END,
        'bedrooms', CASE WHEN p.share_show_specs THEN p.bedrooms END,
        'super_area', CASE WHEN p.share_show_specs THEN p.super_area END,
        'area_unit', p.area_unit
      ) AS card,
      (CASE WHEN p_city IS NOT NULL AND p.city = p_city THEN 0 ELSE 1 END)
        + (CASE WHEN p_property_type IS NOT NULL AND p.property_type::text = p_property_type THEN 0 ELSE 1 END) AS sort_rank,
      p.created_at
    FROM public.properties p
    WHERE p.is_published = true
      AND p.is_archived = false
      AND (p_exclude_slug IS NULL OR p.slug <> p_exclude_slug)
    ORDER BY sort_rank, p.created_at DESC
    LIMIT GREATEST(p_limit, 1)
  ) t;
$function$;

REVOKE ALL ON FUNCTION public.list_published_property_cards(text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_published_property_cards(text, text, text, integer) TO service_role;