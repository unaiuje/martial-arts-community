ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_coach boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_location text,
  ADD COLUMN IF NOT EXISTS coach_schedule text,
  ADD COLUMN IF NOT EXISTS coach_arts text[] NOT NULL DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS profiles_is_coach_idx ON public.profiles (is_coach) WHERE is_coach;