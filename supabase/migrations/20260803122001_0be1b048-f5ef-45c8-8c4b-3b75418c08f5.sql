ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS share_show_price boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_address boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_location boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_description boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_amenities boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_show_specs boolean NOT NULL DEFAULT true;