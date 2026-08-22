CREATE OR REPLACE FUNCTION public.list_shared_properties(p_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(card ORDER BY ord), '[]'::jsonb)
  FROM (
    SELECT
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'title', p.title,
        'property_type', p.property_type,
        'purpose', p.purpose,
        'status', p.status,
        'area_unit', p.area_unit,
        'cover_image', p.cover_image,
        'description', CASE WHEN p.share_show_description THEN p.description END,
        'price', CASE WHEN p.share_show_price THEN p.price END,
        'negotiable', CASE WHEN p.share_show_price THEN p.negotiable ELSE false END,
        'city', CASE WHEN p.share_show_location THEN p.city END,
        'sector', CASE WHEN p.share_show_location THEN p.sector END,
        'address', CASE WHEN p.share_show_address THEN p.address END,
        'bedrooms', CASE WHEN p.share_show_specs THEN p.bedrooms END,
        'bathrooms', CASE WHEN p.share_show_specs THEN p.bathrooms END,
        'parking', CASE WHEN p.share_show_specs THEN p.parking END,
        'furnishing', CASE WHEN p.share_show_specs THEN p.furnishing END,
        'carpet_area', CASE WHEN p.share_show_specs THEN p.carpet_area END,
        'builtup_area', CASE WHEN p.share_show_specs THEN p.builtup_area END,
        'super_area', CASE WHEN p.share_show_specs THEN p.super_area END,
        'amenities', CASE WHEN p.share_show_amenities THEN to_jsonb(p.amenities) ELSE '[]'::jsonb END,
        'agent_name', CASE WHEN p.share_show_contact THEN p.agent_name END,
        'agent_phone', CASE WHEN p.share_show_contact THEN p.agent_phone END,
        'agent_whatsapp', CASE WHEN p.share_show_contact THEN p.agent_whatsapp END,
        'agent_email', CASE WHEN p.share_show_contact THEN p.agent_email END,
        'images', COALESCE((
          SELECT jsonb_agg(i.url ORDER BY i.sort_order)
          FROM public.property_images i
          WHERE i.property_id = p.id AND i.media_kind = 'photo'
        ), '[]'::jsonb)
      ) AS card,
      array_position(p_ids, p.id) AS ord
    FROM public.properties p
    WHERE p.id = ANY(p_ids) AND p.is_archived = false
  ) t;
$function$;

REVOKE ALL ON FUNCTION public.list_shared_properties(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_properties(uuid[]) TO service_role;