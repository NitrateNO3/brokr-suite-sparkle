-- Properties: split blanket manage into staff write + privileged delete
DROP POLICY IF EXISTS "team manage properties" ON public.properties;
CREATE POLICY "staff insert properties" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "staff update properties" ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "privileged delete properties" ON public.properties FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'manager'));

-- Leads
DROP POLICY IF EXISTS "team delete leads" ON public.leads;
CREATE POLICY "privileged delete leads" ON public.leads FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'manager'));

-- Customers
DROP POLICY IF EXISTS "team delete customers" ON public.customers;
CREATE POLICY "privileged delete customers" ON public.customers FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'manager'));

-- Settings: admin-only writes, staff read
DROP POLICY IF EXISTS "settings manage" ON public.settings;
CREATE POLICY "settings staff read" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));