-- 1. Remove direct anonymous access to the raw properties table
DROP POLICY IF EXISTS "published properties public read" ON public.properties;
REVOKE ALL ON public.properties FROM anon;

-- 2. Redacted, published-only view for public consumption
CREATE OR REPLACE VIEW public.published_properties
WITH (security_barrier = true) AS
SELECT
  p.id,
  p.property_code,
  p.title,
  p.slug,
  p.property_type,
  p.purpose,
  p.status,
  CASE WHEN p.share_show_description THEN p.description END AS description,
  CASE WHEN p.share_show_price THEN p.price END AS price,
  CASE WHEN p.share_show_price THEN p.negotiable ELSE false END AS negotiable,
  CASE WHEN p.share_show_price THEN p.maintenance_charges END AS maintenance_charges,
  CASE WHEN p.share_show_price THEN p.booking_amount END AS booking_amount,
  CASE WHEN p.share_show_price THEN p.security_deposit END AS security_deposit,
  CASE WHEN p.share_show_location THEN p.city END AS city,
  CASE WHEN p.share_show_location THEN p.sector END AS sector,
  CASE WHEN p.share_show_location THEN p.pin_code END AS pin_code,
  CASE WHEN p.share_show_address THEN p.address END AS address,
  CASE WHEN p.share_show_address THEN p.landmark END AS landmark,
  CASE WHEN p.share_show_address THEN p.latitude END AS latitude,
  CASE WHEN p.share_show_address THEN p.longitude END AS longitude,
  CASE WHEN p.share_show_address THEN p.maps_url END AS maps_url,
  CASE WHEN p.share_show_specs THEN p.bedrooms END AS bedrooms,
  CASE WHEN p.share_show_specs THEN p.bathrooms END AS bathrooms,
  CASE WHEN p.share_show_specs THEN p.balconies END AS balconies,
  CASE WHEN p.share_show_specs THEN p.parking END AS parking,
  CASE WHEN p.share_show_specs THEN p.floor_no END AS floor_no,
  CASE WHEN p.share_show_specs THEN p.total_floors END AS total_floors,
  CASE WHEN p.share_show_specs THEN p.facing END AS facing,
  CASE WHEN p.share_show_specs THEN p.furnishing END AS furnishing,
  CASE WHEN p.share_show_specs THEN p.carpet_area END AS carpet_area,
  CASE WHEN p.share_show_specs THEN p.builtup_area END AS builtup_area,
  CASE WHEN p.share_show_specs THEN p.super_area END AS super_area,
  p.area_unit,
  p.age,
  CASE WHEN p.share_show_amenities THEN p.amenities ELSE '{}'::text[] END AS amenities,
  p.cover_image,
  p.youtube_url,
  p.virtual_tour_url,
  p.meta_title,
  p.meta_description,
  p.keywords,
  p.is_published,
  p.is_featured,
  p.is_verified,
  p.is_premium,
  p.is_hot,
  p.is_exclusive,
  CASE WHEN p.share_show_contact THEN p.agent_name END AS agent_name,
  CASE WHEN p.share_show_contact THEN p.agent_phone END AS agent_phone,
  CASE WHEN p.share_show_contact THEN p.agent_whatsapp END AS agent_whatsapp,
  CASE WHEN p.share_show_contact THEN p.agent_email END AS agent_email,
  CASE WHEN p.share_show_contact THEN p.agent_office END AS agent_office,
  p.created_at,
  p.updated_at
FROM public.properties p
WHERE p.is_published = true AND p.is_archived = false;

GRANT SELECT ON public.published_properties TO anon, authenticated;