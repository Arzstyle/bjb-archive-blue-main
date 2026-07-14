
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'konsumer', 'ritel', 'mikro');
CREATE TYPE public.doc_menu AS ENUM ('slik', 'taspen', 'mutasi_rekening', 'amola', 'sitanti', 'kolateral', 'berkas_lunas');
CREATE TYPE public.doc_division AS ENUM ('konsumer', 'ritel', 'mikro', 'admin');

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_username(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu public.doc_menu NOT NULL,
  division public.doc_division NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Helper: can access menu+division
CREATE OR REPLACE FUNCTION public.can_access_doc(_user_id uuid, _menu public.doc_menu, _division public.doc_division)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.has_role(_user_id, 'admin') THEN true
      WHEN _menu IN ('sitanti', 'kolateral', 'berkas_lunas') THEN false
      WHEN _division::text = public.get_user_role(_user_id)::text THEN true
      ELSE false
    END;
$$;

CREATE POLICY "Users can view accessible documents"
  ON public.documents FOR SELECT TO authenticated
  USING (public.can_access_doc(auth.uid(), menu, division));

CREATE POLICY "Users can insert accessible documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.can_access_doc(auth.uid(), menu, division) AND uploaded_by = auth.uid());

CREATE POLICY "Users can update accessible documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (public.can_access_doc(auth.uid(), menu, division))
  WITH CHECK (public.can_access_doc(auth.uid(), menu, division));

CREATE POLICY "Users can delete accessible documents"
  ON public.documents FOR DELETE TO authenticated
  USING (public.can_access_doc(auth.uid(), menu, division));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER documents_set_updated_at BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
