ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TYPE public.task_status AS ENUM ('open','in_progress','done');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  details text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.task_status NOT NULL DEFAULT 'open',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Assignee, creator or admin can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creator or admin can delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX tasks_status_idx ON public.tasks(status);
CREATE INDEX properties_assigned_to_idx ON public.properties(assigned_to);