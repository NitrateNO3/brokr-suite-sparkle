REVOKE ALL ON FUNCTION public.get_published_property(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_published_property_slugs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_property(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_published_property_slugs() TO service_role;