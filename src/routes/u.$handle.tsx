import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Clock, GraduationCap, Settings } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { fetchPublicPosts, fetchPublicProfile } from "@/lib/public-profile";
import { fetchFollowCounts, fetchMyFollowingSet, toggleFollow } from "@/lib/social";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { toastError } from "@/lib/errors";
import { formatCount } from "@/lib/mock-data";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — STRIVE` },
      { name: "description", content: `Martial arts videos and training by @${params.handle} on STRIVE.` },
      { property: "og:title", content: `@${params.handle} — STRIVE` },
      { property: "og:description", content: `Watch @${params.handle}'s public training videos.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { handle } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useSupabaseUser();

  const profileQ = useQuery({ queryKey: ["public-profile", handle], queryFn: () => fetchPublicProfile(handle) });
  const p = profileQ.data;
  const countsQ = useQuery({
    queryKey: ["follow-counts", p?.id],
    queryFn: () => fetchFollowCounts(p!.id),
    enabled: !!p,
  });
  const postsQ = useQuery({
    queryKey: ["public-posts", p?.id],
    queryFn: () => fetchPublicPosts(p!.id),
    enabled: !!p,
  });
  const followingQ = useQuery({
    queryKey: ["is-following", p?.id, user?.id],
    queryFn: async () => (await fetchMyFollowingSet([p!.id])).has(p!.id),
    enabled: !!p && !!user && user.id !== p.id,
  });

  if (profileQ.isLoading) {
    return (
      <MobileShell>
        <div className="space-y-4 animate-pulse">
          <div className="size-24 rounded-full bg-secondary mx-auto" />
          <div className="h-6 w-40 bg-secondary rounded mx-auto" />
        </div>
      </MobileShell>
    );
  }
  if (!p) {
    return (
      <MobileShell>
        <p className="text-center text-muted-foreground py-20">User @{handle} not found.</p>
      </MobileShell>
    );
  }

  const isMe = user?.id === p.id;
  const following = !!followingQ.data;

  async function onFollow() {
    try {
      await toggleFollow(p!.id, following);
      qc.invalidateQueries({ queryKey: ["is-following", p!.id] });
      qc.invalidateQueries({ queryKey: ["follow-counts", p!.id] });
    } catch (e) {
      toastError(e, "public_profile_follow");
    }
  }

  return (
    <MobileShell>
      <div className="space-y-6 animate-snap-in">
        <header className="flex flex-col items-center text-center gap-3">
          <div className="size-24 rounded-full border-2 border-accent overflow-hidden bg-secondary">
            {p.avatar_url && <img src={p.avatar_url} alt={p.handle} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h1 className="font-display text-3xl uppercase italic tracking-tight">
              {p.display_name || p.handle}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">@{p.handle}</p>
            {p.is_coach && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-[10px] font-bold uppercase">
                <GraduationCap className="size-3" /> Coach
              </span>
            )}
          </div>
          {p.bio && <p className="text-sm text-muted-foreground max-w-xs">{p.bio}</p>}
          <div className="flex gap-8">
            <Stat n={postsQ.data?.length ?? 0} label="Videos" />
            <Stat n={countsQ.data?.followers ?? 0} label="Followers" />
            <Stat n={countsQ.data?.following ?? 0} label="Following" />
          </div>
          {isMe ? (
            <Link to="/coach" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-xs font-bold uppercase">
              <Settings className="size-3.5" /> Coach settings
            </Link>
          ) : user ? (
            <button
              onClick={onFollow}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase ${following ? "bg-secondary border border-border" : "bg-accent text-accent-foreground"}`}
            >
              {following ? "Following" : "Follow"}
            </button>
          ) : (
            <Link to="/auth" search={{ redirect: `/u/${p.handle}` }} className="px-6 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase">
              Sign in to follow
            </Link>
          )}
        </header>

        {p.is_coach && (p.coach_location || p.coach_schedule) && (
          <section className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Coaching</p>
            {p.coach_arts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.coach_arts.map((a) => (
                  <span key={a} className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-secondary">{a}</span>
                ))}
              </div>
            )}
            {p.coach_location && (
              <p className="flex items-start gap-2 text-sm"><MapPin className="size-4 text-accent shrink-0 mt-0.5" />{p.coach_location}</p>
            )}
            {p.coach_schedule && (
              <p className="flex items-start gap-2 text-sm whitespace-pre-line"><Clock className="size-4 text-accent shrink-0 mt-0.5" />{p.coach_schedule}</p>
            )}
          </section>
        )}

        <section className="grid grid-cols-3 gap-1.5">
          {(postsQ.data ?? []).map((v) => (
            <Link key={v.id} to="/v/$id" params={{ id: v.id }} className="relative aspect-[9/14] rounded-lg overflow-hidden bg-secondary">
              {v.poster && <img src={v.poster} alt={v.caption} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
              <span className="absolute bottom-1 left-1.5 text-[10px] font-mono text-white drop-shadow">♥ {formatCount(v.likes)}</span>
            </Link>
          ))}
          {postsQ.data && postsQ.data.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-10">No public videos yet.</p>
          )}
        </section>
      </div>
    </MobileShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="font-display text-xl">{formatCount(n)}</p>
      <p className="text-[10px] font-mono uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
