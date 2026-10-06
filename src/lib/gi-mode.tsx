import { useEffect, useState } from "react";

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
  if (!mode || mode === "both") return null;
  return (
    <span className="ml-1.5 rounded-full border border-accent/50 px-1.5 py-px text-[9px] font-bold uppercase text-accent">
      {mode === "gi" ? "Gi" : "No-Gi"}
    </span>
  );
}
