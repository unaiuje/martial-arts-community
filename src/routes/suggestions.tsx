import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronUp, Trash2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { toastError } from "@/lib/errors";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Community suggestions — STRIVE" },
      { name: "description", content: "Suggest and vote on new features and techniques for STRIVE." },
      { property: "og:title", content: "Community suggestions — STRIVE" },
      { property: "og:description", content: "Help shape STRIVE: suggest ideas and upvote the best ones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuggestionsPage,
});

const CATS = [
  { v: "feature", label: "Feature" },
  { v: "technique", label: "Technique" },
  { v: "bug", label: "Bug" },
  { v: "other", label: "Other" },
] as const;

function SuggestionsPage() {
  const { user } = useSupabaseUser();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("feature");
  const [sort, setSort] = useState<"top" | "new">("top");
  const [busy, setBusy] = useState(false);

  const listQ = useQuery({
    queryKey: ["suggestions", sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .order(sort === "top" ? "votes" : "created_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const myVotesQ = useQuery({
    queryKey: ["suggestion-votes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("suggestion_votes").select("suggestion_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.suggestion_id));
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["suggestions"] });
    qc.invalidateQueries({ queryKey: ["suggestion-votes"] });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return toast.error("Write a title (at least 3 characters)");
    setBusy(true);
    try {
      const { error } = await supabase.from("suggestions").insert({
        user_id: user!.id,
        title: title.trim(),
        body: body.trim() || null,
        category,
      });
      if (error) throw error;
      setTitle("");
      setBody("");
      toast.success("Thanks! Suggestion posted");
      refresh();
    } catch (err) {
      toastError(err, "suggestion_create");
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: string, voted: boolean) {
    if (!user) return toast.error("Sign in to vote");
    try {
      const q = voted
        ? supabase.from("suggestion_votes").delete().eq("suggestion_id", id).eq("user_id", user.id)
        : supabase.from("suggestion_votes").insert({ suggestion_id: id, user_id: user.id });
      const { error } = await q;
      if (error) throw error;
      refresh();
    } catch (err) {
      toastError(err, "suggestion_vote");
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) return toastError(error, "suggestion_delete");
    refresh();
  }

  const input = "w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/60";

  return (
    <MobileShell>
      <div className="space-y-6 animate-snap-in">
        <header className="space-y-1">
          <h1 className="font-display text-4xl uppercase italic tracking-tight">Suggestions</h1>
          <p className="text-sm text-muted-foreground">What should we add next? Vote for the ideas you want.</p>
        </header>

        {user ? (
          <form onSubmit={submit} className="space-y-3 p-4 rounded-2xl bg-card border border-border">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Your idea in one line" className={input} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} placeholder="Details (optional)" className={input} />
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button key={c.v} type="button" onClick={() => setCategory(c.v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${category === c.v ? "bg-accent text-accent-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-bold uppercase text-sm disabled:opacity-60">
              {busy ? "Posting…" : "Post suggestion"}
            </button>
          </form>
        ) : (
          <Link to="/auth" search={{ redirect: "/suggestions" }} className="block text-center p-4 rounded-2xl bg-card border border-border text-sm font-semibold">
            Sign in to suggest ideas and vote
          </Link>
        )}

        <div className="flex gap-2">
          {(["top", "new"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${sort === s ? "bg-accent text-accent-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
              {s === "top" ? "Top" : "Newest"}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {listQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {listQ.data?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground space-y-2">
              <Lightbulb className="size-6 mx-auto" />
              <p className="text-sm">No suggestions yet. Be the first!</p>
            </div>
          )}
          {listQ.data?.map((s) => {
            const voted = !!myVotesQ.data?.has(s.id);
            return (
              <li key={s.id} className="flex gap-3 p-4 rounded-2xl bg-card border border-border">
                <button onClick={() => vote(s.id, voted)} aria-label={voted ? "Remove vote" : "Vote"} aria-pressed={voted}
                  className={`shrink-0 w-12 rounded-xl flex flex-col items-center justify-center py-1 ${voted ? "bg-accent text-accent-foreground" : "bg-secondary border border-border"}`}>
                  <ChevronUp className="size-4" />
                  <span className="text-sm font-bold">{s.votes}</span>
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-accent">{s.category}</span>
                    {s.status !== "open" && (
                      <span className="text-[10px] font-mono uppercase px-1.5 rounded-full bg-secondary">{s.status}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold break-words">{s.title}</p>
                  {s.body && <p className="text-xs text-muted-foreground whitespace-pre-line break-words">{s.body}</p>}
                </div>
                {user?.id === s.user_id && (
                  <button onClick={() => remove(s.id)} aria-label="Delete suggestion" className="self-start text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </MobileShell>
  );
}
