import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { supabase } from "@/integrations/supabase/client";
import { updateCoachProfile } from "@/lib/public-profile";
import { toastError } from "@/lib/errors";
import { ARTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "Coach profile — STRIVE" },
      { name: "description", content: "Set up your coach profile with schedule and location." },
    ],
  }),
  component: CoachSettings,
});

function CoachSettings() {
  const { user, profile } = useSupabaseUser();
  const navigate = useNavigate();
  const [isCoach, setIsCoach] = useState(false);
  const [location, setLocation] = useState("");
  const [schedule, setSchedule] = useState("");
  const [arts, setArts] = useState<string[]>(["BJJ"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_coach, coach_location, coach_schedule, coach_arts")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setIsCoach(data.is_coach);
        setLocation(data.coach_location ?? "");
        setSchedule(data.coach_schedule ?? "");
        if (data.coach_arts.length) setArts(data.coach_arts);
      });
  }, [user]);

  async function save() {
    if (isCoach && (!location.trim() || !schedule.trim())) {
      toast.error("Add your location and schedule");
      return;
    }
    setSaving(true);
    try {
      await updateCoachProfile({
        is_coach: isCoach,
        coach_location: location.trim() || null,
        coach_schedule: schedule.trim() || null,
        coach_arts: arts.map((a) => a.toLowerCase()),
      });
      toast.success("Coach profile saved");
      if (profile?.handle) navigate({ to: "/u/$handle", params: { handle: profile.handle } });
    } catch (e) {
      toastError(e, "coach_save");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/60";

  return (
    <MobileShell>
      <div className="space-y-5 animate-snap-in">
        <h1 className="font-display text-3xl uppercase italic">Coach profile</h1>
        <label className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
          <span className="text-sm font-semibold">I teach classes</span>
          <input type="checkbox" checked={isCoach} onChange={(e) => setIsCoach(e.target.checked)} className="size-5 accent-[hsl(var(--accent))]" />
        </label>
        {isCoach && (
          <>
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Arts you teach</p>
              <div className="flex flex-wrap gap-2">
                {ARTS.map((a) => {
                  const on = arts.map((x) => x.toLowerCase()).includes(a.toLowerCase());
                  return (
                    <button key={a} type="button"
                      onClick={() => setArts((cur) => on ? cur.filter((x) => x.toLowerCase() !== a.toLowerCase()) : [...cur, a])}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${on ? "bg-accent text-accent-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Location (gym, city)</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={160} className={input} placeholder="Gracie Barra, Madrid" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Schedule</span>
              <textarea value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={600} rows={5} className={input} placeholder={"Mon/Wed/Fri 19:30–20:30 BJJ\nSat 11:00 Open mat"} />
            </label>
            <p className="text-xs text-muted-foreground">Your training videos are the public videos you upload.</p>
          </>
        )}
        <button onClick={save} disabled={saving} className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-bold uppercase disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </MobileShell>
  );
}
