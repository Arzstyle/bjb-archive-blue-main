-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read activity logs
CREATE POLICY "Users can read activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
