import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PublicProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "handle"
  | "display_name"
  | "avatar_url"
  | "bio"
  | "primary_art"
  | "is_coach"
  | "coach_location"
  | "coach_schedule"
  | "coach_arts"
>;

const COLS =
  "id, handle, display_name, avatar_url, bio, primary_art, is_coach, coach_location, coach_schedule, coach_arts";

export async function fetchPublicProfile(handle: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLS)
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PublicProfile | null) ?? null;
}

export async function fetchPublicPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, caption, poster, art, likes, created_at")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchCoaches(art?: string): Promise<PublicProfile[]> {
  let q = supabase.from("profiles").select(COLS).eq("is_coach", true).limit(50);
  if (art) q = q.contains("coach_arts", [art]);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicProfile[];
}

export async function fetchProfileMini(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("handle, avatar_url, is_coach")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function updateCoachProfile(input: {
  is_coach: boolean;
  coach_location: string | null;
  coach_schedule: string | null;
  coach_arts: string[];
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("AUTH_REQUIRED");
  const { error } = await supabase.from("profiles").update(input).eq("id", auth.user.id);
  if (error) throw new Error(error.message);
}
