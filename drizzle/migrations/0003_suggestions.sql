CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body text CHECK (body IS NULL OR char_length(body) <= 1000),
  category text NOT NULL DEFAULT 'feature' CHECK (category IN ('feature','technique','bug','other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','planned','done')),
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suggestions TO anon;
GRANT SELECT, INSERT, DELETE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions read all" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "suggestions insert own" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'open' AND votes = 0);
CREATE POLICY "suggestions delete own" ON public.suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.suggestion_votes (
  suggestion_id uuid NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (suggestion_id, user_id)
);
GRANT SELECT ON public.suggestion_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.suggestion_votes TO authenticated;
GRANT ALL ON public.suggestion_votes TO service_role;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svotes read all" ON public.suggestion_votes FOR SELECT USING (true);
CREATE POLICY "svotes insert own" ON public.suggestion_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "svotes delete own" ON public.suggestion_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.on_suggestion_vote() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suggestions SET votes = votes + 1 WHERE id = NEW.suggestion_id; RETURN NEW;
  ELSE
    UPDATE public.suggestions SET votes = GREATEST(0, votes - 1) WHERE id = OLD.suggestion_id; RETURN OLD;
  END IF;
END; $$;
CREATE TRIGGER trg_suggestion_votes AFTER INSERT OR DELETE ON public.suggestion_votes FOR EACH ROW EXECUTE FUNCTION public.on_suggestion_vote();