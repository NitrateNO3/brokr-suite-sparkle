DROP VIEW IF EXISTS public.published_properties;

CREATE OR REPLACE FUNCTION public.get_published_property(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
        'created_at', i.created_at
      ) ORDER BY i.sort_order)
      FROM public.property_images i WHERE i.property_id = p.id
    ), '[]'::jsonb)
  ))
  FROM public.properties p
  WHERE p.slug = p_slug AND p.is_published = true AND p.is_archived = false
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.list_published_property_slugs()
RETURNS TABLE (slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.slug FROM public.properties p
  WHERE p.is_published = true AND p.is_archived = false;
$$;

REVOKE ALL ON FUNCTION public.get_published_property(text) FROM public;
REVOKE ALL ON FUNCTION public.list_published_property_slugs() FROM public;
GRANT EXECUTE ON FUNCTION public.get_published_property(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_published_property_slugs() TO anon, authenticated;