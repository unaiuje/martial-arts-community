CREATE OR REPLACE FUNCTION public.get_feed_v2(
  p_cursor_score double precision DEFAULT NULL,
  p_cursor timestamp with time zone DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid, user_id uuid, handle text, caption text, video text, poster text,
  art text, level text, tags text[], likes integer, comments integer,
  created_at timestamp with time zone, visibility text, score double precision
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS uid),
  maxa AS (
    SELECT GREATEST(COALESCE(MAX(score), 0), 1)::double precision AS m
    FROM public.user_art_affinity
    WHERE user_id = (SELECT uid FROM me)
  ),
  base AS (
    SELECT p.*,
      LEAST(COALESCE(a.score, 0)::double precision / (SELECT m FROM maxa), 1.0) AS aff_norm,
      CASE WHEN (SELECT uid FROM me) IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = (SELECT uid FROM me) AND f.following_id = p.user_id
      ) THEN 1.0 ELSE 0.0 END AS follow_bonus,
      EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / (3 * 86400.0)) AS recency
    FROM public.posts p
    LEFT JOIN public.user_art_affinity a
      ON a.user_id = (SELECT uid FROM me) AND a.art = p.art
    WHERE p.visibility = 'public'
  ),
  scored AS (
    SELECT b.*, (0.55 * b.aff_norm + 0.20 * b.follow_bonus + 0.25 * b.recency) AS score
    FROM base b
  )
  SELECT s.id, s.user_id, s.handle, s.caption, s.video, s.poster, s.art, s.level,
         s.tags, s.likes, s.comments, s.created_at, s.visibility, s.score
  FROM scored s
  WHERE p_cursor_score IS NULL
     OR (s.score, s.created_at) < (p_cursor_score, COALESCE(p_cursor, 'infinity'::timestamptz))
  ORDER BY s.score DESC, s.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 50));
$function$;

GRANT EXECUTE ON FUNCTION public.get_feed_v2(double precision, timestamp with time zone, integer) TO anon, authenticated, service_role;
