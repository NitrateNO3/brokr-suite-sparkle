
-- ENUMS
CREATE TYPE public.property_type AS ENUM ('apartment','builder_floor','villa','independent_house','penthouse','plot','commercial','retail_shop','office_space','warehouse','farm_house');
CREATE TYPE public.property_purpose AS ENUM ('sale','rent','lease');
CREATE TYPE public.property_status AS ENUM ('available','sold','rented','draft','under_offer','archived');
CREATE TYPE public.facing_type AS ENUM ('north','south','east','west','north_east','north_west','south_east','south_west');
CREATE TYPE public.area_unit AS ENUM ('sqft','sqyard','acre');
CREATE TYPE public.furnishing_type AS ENUM ('fully_furnished','semi_furnished','unfurnished');
CREATE TYPE public.property_age AS ENUM ('new_launch','ready_to_move','under_construction','0_1','1_5','5_10','10_plus');
CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','visit_scheduled','negotiation','won','lost');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  job_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- AMENITIES
CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.amenities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amenities public read" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "amenities manage" ON public.amenities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LOCATIONS
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  sector text,
  pin_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, sector)
);
GRANT SELECT ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "locations manage" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROPERTIES
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code text NOT NULL UNIQUE DEFAULT ('DRE-' || upper(substr(md5(gen_random_uuid()::text),1,6))),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  property_type public.property_type NOT NULL DEFAULT 'apartment',
  purpose public.property_purpose NOT NULL DEFAULT 'sale',
  status public.property_status NOT NULL DEFAULT 'draft',
  description text,
  -- pricing
  price numeric NOT NULL DEFAULT 0,
  negotiable boolean NOT NULL DEFAULT false,
  maintenance_charges numeric,
  booking_amount numeric,
  security_deposit numeric,
  -- location
  city text NOT NULL DEFAULT 'Gurgaon',
  sector text,
  address text,
  landmark text,
  pin_code text,
  latitude numeric,
  longitude numeric,
  maps_url text,
  -- details
  bedrooms int,
  bathrooms int,
  balconies int,
  parking int,
  floor_no int,
  total_floors int,
  facing public.facing_type,
  area_unit public.area_unit NOT NULL DEFAULT 'sqft',
  carpet_area numeric,
  builtup_area numeric,
  super_area numeric,
  age public.property_age,
  furnishing public.furnishing_type,
  amenities text[] NOT NULL DEFAULT '{}',
  -- media links
  cover_image text,
  youtube_url text,
  virtual_tour_url text,
  -- seo
  meta_title text,
  meta_description text,
  keywords text,
  -- flags
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  is_premium boolean NOT NULL DEFAULT false,
  is_hot boolean NOT NULL DEFAULT false,
  is_exclusive boolean NOT NULL DEFAULT false,
  is_starred boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  -- agent
  agent_name text,
  agent_phone text,
  agent_whatsapp text,
  agent_email text,
  agent_office text,
  views int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_status_idx ON public.properties(status);
CREATE INDEX properties_city_idx ON public.properties(city);
GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published properties public read" ON public.properties FOR SELECT TO anon USING (is_published = true AND is_archived = false);
CREATE POLICY "team read all properties" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "team manage properties" ON public.properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER properties_touch BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PROPERTY IMAGES
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "images manage" ON public.property_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROPERTY VIDEOS
CREATE TABLE public.property_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_videos TO authenticated;
GRANT ALL ON public.property_videos TO service_role;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos public read" ON public.property_videos FOR SELECT USING (true);
CREATE POLICY "videos manage" ON public.property_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROPERTY DOCUMENTS
CREATE TABLE public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL,
  doc_type text DEFAULT 'brochure',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_documents TO authenticated;
GRANT ALL ON public.property_documents TO service_role;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents manage" ON public.property_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  message text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_title text,
  status public.lead_status NOT NULL DEFAULT 'new',
  notes text,
  source text DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit lead" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "team read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "team update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team delete leads" ON public.leads FOR DELETE TO authenticated USING (true);
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PROPERTY VIEWS
CREATE TABLE public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.property_views TO anon;
GRANT SELECT, INSERT ON public.property_views TO authenticated;
GRANT ALL ON public.property_views TO service_role;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can record view" ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "team read views" ON public.property_views FOR SELECT TO authenticated USING (true);

-- SETTINGS
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text NOT NULL DEFAULT 'Deep Real Estate',
  logo_url text,
  address text,
  email text,
  phone text,
  whatsapp text,
  website text,
  facebook text,
  instagram text,
  linkedin text,
  youtube text,
  primary_color text DEFAULT '#0F4C3A',
  secondary_color text DEFAULT '#C8A45C',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings manage" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read activity" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "team write activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- SEED: settings
INSERT INTO public.settings (agency_name, address, email, phone, whatsapp, website, instagram, facebook, linkedin, primary_color, secondary_color)
VALUES ('Deep Real Estate', 'Unit 214, Vipul Trade Centre, Sector 48, Sohna Road, Gurgaon, Haryana 122018', 'hello@deeprealestate.in', '+91 98110 45678', '+91 98110 45678', 'https://deeprealestate.in', 'https://instagram.com/deeprealestate', 'https://facebook.com/deeprealestate', 'https://linkedin.com/company/deeprealestate', '#0F4C3A', '#C8A45C');

-- SEED: amenities
INSERT INTO public.amenities (name, category) VALUES
('Swimming Pool','lifestyle'),('Gym','lifestyle'),('Lift','building'),('Club House','lifestyle'),
('Power Backup','utility'),('24x7 Security','security'),('CCTV','security'),('Garden','outdoor'),
('Kids Play Area','outdoor'),('Jogging Track','outdoor'),('Visitor Parking','building'),('Modular Kitchen','interior'),
('Servant Room','interior'),('Study Room','interior'),('Balcony','interior'),('Terrace','interior'),
('Air Conditioning','interior'),('Internet','utility'),('RO Water','utility'),('Pet Friendly','lifestyle');

-- SEED: locations
INSERT INTO public.locations (city, sector) VALUES ('Sohna', NULL), ('Manesar', NULL);
INSERT INTO public.locations (city, sector)
SELECT 'Gurgaon', s FROM unnest(ARRAY['14','15','22','23','28','31','37D','42','43','45','46','47','48','49','50','51','52','54','55','56','57','58','59','60','61','62','63','65','66','67','68','69','70','71','72','82','83','84','85','86','88','89','90','91','92','93','95','99','102','104','109','110','111','113','114']) AS s;

-- SEED: properties
INSERT INTO public.properties (property_code,title,slug,property_type,purpose,status,description,price,negotiable,maintenance_charges,booking_amount,city,sector,address,landmark,pin_code,latitude,longitude,bedrooms,bathrooms,balconies,parking,floor_no,total_floors,facing,carpet_area,builtup_area,super_area,age,furnishing,amenities,cover_image,is_published,is_featured,is_verified,is_premium,is_hot,is_exclusive,agent_name,agent_phone,agent_whatsapp,agent_email,agent_office,views,meta_title,meta_description,created_at) VALUES
('DRE-1001','Luxury 4BHK Villa in Sector 56','luxury-4bhk-villa-sector-56','villa','sale','available','A meticulously designed independent villa with double-height living spaces, private lawn and a rooftop terrace. Located minutes from Golf Course Road with premium schools and hospitals nearby.',42500000,true,12000,500000,'Gurgaon','56','Block C, Sushant Lok II','Near Vipul World',122011,28.4241,77.0910,4,5,3,3,0,3,'north_east',3200,3800,4200,'ready_to_move','semi_furnished',ARRAY['Swimming Pool','Gym','Power Backup','24x7 Security','CCTV','Garden','Modular Kitchen','Servant Room','Terrace','Air Conditioning'],'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',true,true,true,true,true,true,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',1284,'Luxury 4BHK Villa in Sector 56, Gurgaon','Premium 4BHK villa with private lawn and rooftop terrace in Sector 56, Gurgaon. Ready to move.', now() - interval '3 days'),
('DRE-1002','Premium 3BHK Apartment in Sector 65','premium-3bhk-apartment-sector-65','apartment','sale','available','High-floor 3BHK in a gated township on Golf Course Extension Road, with wide balconies overlooking landscaped greens and a full clubhouse.',21500000,true,7500,300000,'Gurgaon','65','Emerald Heights, Golf Course Ext Road','Opposite Tulip Chowk',122102,28.3985,77.0685,3,3,2,2,14,22,'east',1650,1880,2100,'ready_to_move','fully_furnished',ARRAY['Swimming Pool','Gym','Lift','Club House','Power Backup','24x7 Security','CCTV','Kids Play Area','Modular Kitchen','Air Conditioning','Internet'],'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',true,true,true,true,false,false,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',962,'Premium 3BHK Apartment in Sector 65 Gurgaon','Furnished high-floor 3BHK apartment with clubhouse access on Golf Course Extension Road.', now() - interval '8 days'),
('DRE-1003','Modern Builder Floor in Sector 46','modern-builder-floor-sector-46','builder_floor','sale','available','Newly constructed independent builder floor with stilt parking, modular kitchen and premium Italian marble flooring throughout.',14800000,false,3000,200000,'Gurgaon','46','H Block, Sector 46','Near Huda Market',122003,28.4390,77.0530,3,3,2,1,2,4,'west',1450,1600,1750,'new_launch','semi_furnished',ARRAY['Lift','Power Backup','24x7 Security','Modular Kitchen','Balcony','Air Conditioning','RO Water'],'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',true,false,true,false,true,false,'Ritika Sharma','+91 98110 45611','+91 98110 45611','ritika@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',541,'Modern Builder Floor in Sector 46 Gurgaon','Brand new 3BHK builder floor with stilt parking and Italian marble flooring in Sector 46.', now() - interval '12 days'),
('DRE-1004','Spacious 2BHK for Rent in Sector 49','spacious-2bhk-rent-sector-49','apartment','rent','available','Bright 2BHK on Sohna Road with a well-maintained society, power backup and covered parking. Ideal for working professionals and small families.',38000,true,2500,NULL,'Gurgaon','49','Uniworld Garden, Sohna Road','Near Subhash Chowk',122018,28.4180,77.0400,2,2,2,1,7,14,'north',980,1120,1250,'1_5','semi_furnished',ARRAY['Lift','Power Backup','24x7 Security','CCTV','Visitor Parking','Kids Play Area','Garden','Internet'],'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',true,false,true,false,false,false,'Ritika Sharma','+91 98110 45611','+91 98110 45611','ritika@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',433,'2BHK Apartment for Rent in Sector 49 Gurgaon','Semi-furnished 2BHK on Sohna Road with power backup, parking and clubhouse access.', now() - interval '5 days'),
('DRE-1005','Signature Penthouse in Sector 42','signature-penthouse-sector-42','penthouse','sale','under_offer','A duplex penthouse on Golf Course Road with a private plunge pool, panoramic city views and a dedicated lift lobby.',89000000,false,25000,1000000,'Gurgaon','42','The Aralias, Golf Course Road','Near DLF Golf Club',122002,28.4600,77.0990,5,6,4,4,24,25,'south_east',5200,6000,6800,'ready_to_move','fully_furnished',ARRAY['Swimming Pool','Gym','Lift','Club House','Power Backup','24x7 Security','CCTV','Terrace','Servant Room','Study Room','Air Conditioning','Pet Friendly'],'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',true,true,true,true,true,true,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',2104,'Signature Penthouse in Sector 42 Gurgaon','Duplex penthouse with private plunge pool and panoramic views on Golf Course Road.', now() - interval '20 days'),
('DRE-1006','Commercial Office Space in Sector 44','commercial-office-space-sector-44','office_space','lease','available','Fully fitted plug-and-play office with 60 workstations, cabins, conference rooms and dedicated parking in a Grade-A tower.',420000,true,45000,NULL,'Gurgaon','43','Global Business Park, Sector 43','Near Sector 42-43 Metro',122009,28.4520,77.0870,NULL,4,0,12,8,15,'north_west',4800,5400,6200,'ready_to_move','fully_furnished',ARRAY['Lift','Power Backup','24x7 Security','CCTV','Visitor Parking','Air Conditioning','Internet'],'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80',true,false,true,true,false,false,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',318,'Grade-A Office Space for Lease in Sector 43 Gurgaon','Plug-and-play office with 60 workstations and dedicated parking in Global Business Park.', now() - interval '15 days'),
('DRE-1007','Farm House Retreat in Sohna','farm-house-retreat-sohna','farm_house','sale','available','Two-acre farmhouse retreat at the foothills of the Aravallis with an orchard, guest cottage and swimming pool. A perfect weekend estate.',67500000,true,NULL,750000,'Sohna',NULL,'Damdama Road, Sohna','Near Damdama Lake',122103,28.2470,77.0650,4,4,2,6,0,2,'east',NULL,4500,87120,'ready_to_move','semi_furnished',ARRAY['Swimming Pool','Garden','Power Backup','24x7 Security','CCTV','Servant Room','Terrace','Pet Friendly','RO Water'],'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',true,true,true,true,false,true,'Ritika Sharma','+91 98110 45611','+91 98110 45611','ritika@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',877,'Farm House for Sale in Sohna, Gurgaon','Two-acre Aravalli farmhouse with orchard, pool and guest cottage near Damdama Lake.', now() - interval '30 days'),
('DRE-1008','Industrial Warehouse in Manesar','industrial-warehouse-manesar','warehouse','lease','available','Pre-engineered warehouse with 12m clear height, dock levellers and heavy vehicle access on NH-48 near IMT Manesar.',950000,true,NULL,NULL,'Manesar',NULL,'IMT Manesar, Sector 8','Off NH-48',122051,28.3540,76.9380,NULL,2,0,20,0,1,'south',NULL,42000,45000,'ready_to_move','unfurnished',ARRAY['Power Backup','24x7 Security','CCTV','Visitor Parking'],'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=80',true,false,true,false,false,false,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',196,'Warehouse for Lease in IMT Manesar','Pre-engineered warehouse with dock levellers and 12m clear height near NH-48, Manesar.', now() - interval '18 days'),
('DRE-1009','Residential Plot in Sector 92','residential-plot-sector-92','plot','sale','sold','South-facing residential plot in a licensed colony with wide internal roads and immediate registry.',9800000,false,NULL,150000,'Gurgaon','92','Vatika India Next, Sector 92','Near Dwarka Expressway',122505,28.3860,76.9420,NULL,NULL,NULL,NULL,NULL,NULL,'south',NULL,NULL,1800,'ready_to_move','unfurnished',ARRAY['24x7 Security','Garden'],'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',true,false,true,false,false,false,'Ritika Sharma','+91 98110 45611','+91 98110 45611','ritika@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',264,'Residential Plot for Sale in Sector 92 Gurgaon','South-facing 200 sq yard plot with immediate registry near Dwarka Expressway.', now() - interval '40 days'),
('DRE-1010','Boutique Retail Shop in Sector 82','boutique-retail-shop-sector-82','retail_shop','rent','draft','Ground-floor retail unit inside a high-footfall mixed-use development with glass frontage and dedicated signage space.',185000,true,9000,NULL,'Gurgaon','82','Vatika Town Square, Sector 82','Near NH-48',122004,28.3760,76.9530,NULL,1,0,2,0,3,'north',NULL,780,950,'ready_to_move','unfurnished',ARRAY['Lift','Power Backup','24x7 Security','CCTV','Visitor Parking','Air Conditioning'],'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',false,false,false,false,false,false,'Deepak Yadav','+91 98110 45678','+91 98110 45678','deepak@deeprealestate.in','Sector 48, Sohna Road, Gurgaon',41,'Retail Shop for Rent in Sector 82 Gurgaon','High-footfall ground-floor retail unit with glass frontage in Vatika Town Square.', now() - interval '2 days');

-- SEED: images (gallery per property)
INSERT INTO public.property_images (property_id, url, sort_order, is_featured)
SELECT p.id, p.cover_image, 0, true FROM public.properties p;
INSERT INTO public.property_images (property_id, url, sort_order, is_featured)
SELECT p.id, u.url, u.ord, false FROM public.properties p
CROSS JOIN (VALUES
  ('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',1),
  ('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',2),
  ('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80',3),
  ('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',4)
) AS u(url, ord);

-- SEED: leads
INSERT INTO public.leads (name, phone, email, message, property_id, property_title, status, notes, created_at)
SELECT v.name, v.phone, v.email, v.message, p.id, p.title, v.status::public.lead_status, v.notes, now() - (v.days || ' days')::interval
FROM (VALUES
  ('Ankit Malhotra','+91 98765 12345','ankit.malhotra@gmail.com','Interested in a site visit this weekend.','luxury-4bhk-villa-sector-56','new','Prefers Saturday morning visit.',1),
  ('Priya Nair','+91 99887 66554','priya.nair@outlook.com','Please share the payment plan and floor plan.','premium-3bhk-apartment-sector-65','contacted','Shared brochure over WhatsApp.',2),
  ('Rahul Verma','+91 98180 33221','rahul.verma@gmail.com','Looking for a 2BHK on rent from next month.','spacious-2bhk-rent-sector-49','qualified','Budget 40k, family of three.',3),
  ('Sanjay Gupta','+91 97117 88990','sanjay.g@corpmail.com','Need 60-seat office on a 5 year lease.','commercial-office-space-sector-44','visit_scheduled','Visit booked for Friday 4pm.',4),
  ('Meera Krishnan','+91 90909 12121','meera.k@gmail.com','Is the farmhouse price negotiable?','farm-house-retreat-sohna','negotiation','Offered 6.4 Cr.',6),
  ('Imran Sheikh','+91 98999 45454','imran.sheikh@gmail.com','Interested in the penthouse, need NRI payment options.','signature-penthouse-sector-42','new','Based in Dubai.',7),
  ('Neha Bansal','+91 98555 77441','neha.bansal@gmail.com','Warehouse requirement for logistics firm.','industrial-warehouse-manesar','won','Lease signed.',12)
) AS v(name,phone,email,message,slug,status,notes,days)
JOIN public.properties p ON p.slug = v.slug;

-- SEED: property views history for charts
INSERT INTO public.property_views (property_id, created_at)
SELECT p.id, now() - (random() * 45 || ' days')::interval
FROM public.properties p, generate_series(1, 40) g
WHERE p.is_published = true;
