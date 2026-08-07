-- ============ ENUMS ============
CREATE TYPE public.customer_status AS ENUM ('new','active','following_up','negotiating','converted','inactive','lost');
CREATE TYPE public.customer_priority AS ENUM ('low','medium','high','vip');
CREATE TYPE public.customer_intent AS ENUM ('buy','rent','lease','invest');
CREATE TYPE public.share_channel AS ENUM ('whatsapp','email','sms','link','qr');
CREATE TYPE public.share_event_type AS ENUM ('sent','delivered','opened','viewed','favourite','brochure_downloaded','enquiry','visit_booked','reshared');
CREATE TYPE public.visit_status AS ENUM ('scheduled','completed','cancelled','rescheduled','no_show');
CREATE TYPE public.demand_level AS ENUM ('low','moderate','high','very_high');

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  photo_url text,
  phone text,
  whatsapp text,
  email text,
  occupation text,
  company text,
  budget_min numeric,
  budget_max numeric,
  preferred_city text,
  preferred_location text,
  property_type public.property_type,
  bhk_preference integer,
  intent public.customer_intent NOT NULL DEFAULT 'buy',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  source text DEFAULT 'manual',
  status public.customer_status NOT NULL DEFAULT 'new',
  priority public.customer_priority NOT NULL DEFAULT 'medium',
  is_vip boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_status_idx ON public.customers(status);
CREATE INDEX customers_assigned_idx ON public.customers(assigned_to);
CREATE UNIQUE INDEX customers_phone_uidx ON public.customers(phone) WHERE phone IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read customers" ON public.customers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "team insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team update customers" ON public.customers FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team delete customers" ON public.customers FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER customers_touch BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CUSTOMER NOTES ============
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_notes_customer_idx ON public.customer_notes(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read notes" ON public.customer_notes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "team write notes" ON public.customer_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author delete notes" ON public.customer_notes FOR DELETE TO authenticated USING (auth.uid() = author_id OR private.has_role(auth.uid(),'admin'));

-- ============ CUSTOMER DOCUMENTS ============
CREATE TABLE public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL,
  doc_type text DEFAULT 'other',
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_documents_customer_idx ON public.customer_documents(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_documents TO authenticated;
GRANT ALL ON public.customer_documents TO service_role;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team manage customer docs" ON public.customer_documents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============ CUSTOMER ACTIVITY TIMELINE ============
CREATE TABLE public.customer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  detail text,
  meta jsonb,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_activity_customer_idx ON public.customer_activity(customer_id, created_at DESC);
GRANT SELECT, INSERT ON public.customer_activity TO authenticated;
GRANT ALL ON public.customer_activity TO service_role;
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read customer activity" ON public.customer_activity FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "team write customer activity" ON public.customer_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ============ PROPERTY SHARES ============
CREATE TABLE public.property_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  channel public.share_channel NOT NULL DEFAULT 'link',
  message text,
  title text,
  shared_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX property_shares_customer_idx ON public.property_shares(customer_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_shares TO authenticated;
GRANT ALL ON public.property_shares TO service_role;
ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team manage shares" ON public.property_shares FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.property_share_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.property_shares(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_favourite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (share_id, property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_share_items TO authenticated;
GRANT ALL ON public.property_share_items TO service_role;
ALTER TABLE public.property_share_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team manage share items" ON public.property_share_items FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.property_shares(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  event public.share_event_type NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX share_events_share_idx ON public.share_events(share_id, created_at DESC);
GRANT SELECT, INSERT ON public.share_events TO authenticated;
GRANT ALL ON public.share_events TO service_role;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read share events" ON public.share_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "team write share events" ON public.share_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ============ SITE VISITS ============
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  meeting_point text,
  status public.visit_status NOT NULL DEFAULT 'scheduled',
  notes text,
  feedback text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_when_idx ON public.site_visits(scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team manage visits" ON public.site_visits FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER site_visits_touch BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ LOCATIONS HIERARCHY ============
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS sub_sector text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS demand public.demand_level NOT NULL DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS top_builder text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER locations_touch BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PUBLIC SHARE BUNDLE (redaction-aware) ============
CREATE OR REPLACE FUNCTION public.get_share_bundle(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'message', s.message,
    'created_at', s.created_at,
    'customer_name', c.full_name,
    'properties', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'title', p.title,
        'cover_image', p.cover_image,
        'property_type', p.property_type,
        'purpose', p.purpose,
        'price', CASE WHEN p.share_show_price THEN p.price END,
        'city', CASE WHEN p.share_show_location THEN p.city END,
        'sector', CASE WHEN p.share_show_location THEN p.sector END,
        'bedrooms', CASE WHEN p.share_show_specs THEN p.bedrooms END,
        'bathrooms', CASE WHEN p.share_show_specs THEN p.bathrooms END,
        'super_area', CASE WHEN p.share_show_specs THEN p.super_area END,
        'area_unit', p.area_unit,
        'is_favourite', i.is_favourite
      ) ORDER BY i.sort_order)
      FROM public.property_share_items i
      JOIN public.properties p ON p.id = i.property_id
      WHERE i.share_id = s.id AND p.is_archived = false
    ), '[]'::jsonb)
  )
  FROM public.property_shares s
  LEFT JOIN public.customers c ON c.id = s.customer_id
  WHERE s.token = p_token
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_share_bundle(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_share_bundle(text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_share_event(p_token text, p_event public.share_event_type, p_property_id uuid DEFAULT NULL, p_meta jsonb DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_share public.property_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share FROM public.property_shares WHERE token = p_token;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO public.share_events (share_id, property_id, event, meta)
  VALUES (v_share.id, p_property_id, p_event, p_meta);

  UPDATE public.property_shares
     SET opened_at = COALESCE(opened_at, now()),
         last_viewed_at = now(),
         view_count = view_count + CASE WHEN p_event IN ('opened','viewed') THEN 1 ELSE 0 END
   WHERE id = v_share.id;

  IF p_event = 'favourite' AND p_property_id IS NOT NULL THEN
    UPDATE public.property_share_items SET is_favourite = true
     WHERE share_id = v_share.id AND property_id = p_property_id;
  END IF;

  IF v_share.customer_id IS NOT NULL THEN
    INSERT INTO public.customer_activity (customer_id, kind, title, detail, meta)
    VALUES (v_share.customer_id, 'share', 'Shared link ' || p_event::text, v_share.title, jsonb_build_object('share_id', v_share.id, 'property_id', p_property_id));
  END IF;

  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.record_share_event(text, public.share_event_type, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_share_event(text, public.share_event_type, uuid, jsonb) TO service_role;