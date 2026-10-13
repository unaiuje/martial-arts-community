CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

GRANT UPDATE (gi_mode) ON public.techniques TO authenticated;
ALTER TABLE public.techniques ADD CONSTRAINT techniques_gi_mode_check CHECK (gi_mode IN ('both','gi','nogi'));
CREATE POLICY "techniques admin update" ON public.techniques FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE (status) ON public.suggestions TO authenticated;
CREATE POLICY "suggestions admin update" ON public.suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "suggestions admin delete" ON public.suggestions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "media public insert" ON storage.objects;
DROP POLICY IF EXISTS "media public update" ON storage.objects;
DROP POLICY IF EXISTS "media public delete" ON storage.objects;
CREATE POLICY "media owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "media owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "media owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text);