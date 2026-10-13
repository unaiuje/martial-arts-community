import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/errors";
import { useIsAdmin } from "@/lib/admin";

export type GiMode = "all" | "gi" | "nogi";
const KEY = "strive-gi-mode";

export function useGiMode() {
  const [mode, setModeState] = useState<GiMode>("all");
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v === "gi" || v === "nogi" || v === "all") setModeState(v);
  }, []);
  const setMode = (m: GiMode) => {
    setModeState(m);
    localStorage.setItem(KEY, m);
  };
  return [mode, setMode] as const;
}

export function matchesGiMode(techMode: string | null | undefined, mode: GiMode) {
  if (mode === "all") return true;
  return (techMode ?? "both") === "both" || techMode === mode;
}

export function GiToggle({ mode, onChange }: { mode: GiMode; onChange: (m: GiMode) => void }) {
  const opts: { v: GiMode; label: string }[] = [
    { v: "all", label: "All" },
    { v: "gi", label: "Gi (BJJ)" },
    { v: "nogi", label: "No-Gi (Grappling)" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary/60 border border-border" role="group" aria-label="Gi or No-Gi">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={mode === o.v}
          className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
            mode === o.v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function GiBadge({ mode }: { mode: string | null | undefined }) {
  const m = mode ?? "both";
  const label = m === "gi" ? "Gi" : m === "nogi" ? "No-Gi" : "Gi · No-Gi";
  return (
    <span className={`ml-1.5 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase whitespace-nowrap ${
      m === "both" ? "border-border text-muted-foreground" : "border-accent/50 text-accent"
    }`}>
      {label}
    </span>
  );
}

/** Admin-only control to correct a technique's Gi / No-Gi classification. */
export function GiEditor({ techniqueId, mode }: { techniqueId: string; mode: string | null | undefined }) {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  if (!isAdmin) return null;
  async function save(v: string) {
    setSaving(true);
    const { error } = await supabase.from("techniques").update({ gi_mode: v }).eq("id", techniqueId);
    setSaving(false);
    if (error) return toastError(error, "gi_mode_update");
    toast.success("Classification saved");
    qc.invalidateQueries({ queryKey: ["technique"] });
    qc.invalidateQueries({ queryKey: ["technique-category"] });
    qc.invalidateQueries({ queryKey: ["all-techniques"] });
  }
  return (
    <select
      aria-label="Gi or No-Gi classification"
      value={mode ?? "both"}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => save(e.target.value)}
      className="text-[11px] font-bold uppercase rounded-lg bg-secondary border border-border px-2 py-1"
    >
      <option value="both">Gi · No-Gi</option>
      <option value="gi">Gi only</option>
      <option value="nogi">No-Gi only</option>
    </select>
  );
}
