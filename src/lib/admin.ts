import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

/** UI hint only — the database enforces admin rights on every write. */
export function useIsAdmin() {
  const { user } = useSupabaseUser();
  const q = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });
  return !!q.data;
}
