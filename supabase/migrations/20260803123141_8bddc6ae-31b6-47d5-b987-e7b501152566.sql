ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_follow_up_at_idx ON public.leads (follow_up_at);