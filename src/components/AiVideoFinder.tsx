import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { aiVideoSearch } from "@/lib/ai-video-search.functions";
import { tr, useLangSubscription } from "@/lib/i18n";
import { useDraft } from "@/hooks/use-draft";
import { describeError } from "@/lib/errors";
import type { AiVideoHit } from "@/lib/ai-video-search.server";

export function AiVideoFinder() {
  useLangSubscription();
  const [query, setQuery] = useDraft("ai.query", "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<{ hits: AiVideoHit[]; summary: string } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3 || busy) return;
    setBusy(true);
    setError("");
    try {
      setRes(await aiVideoSearch({ data: { query } }));
    } catch (err) {
      setError(describeError(err, tr("AI search failed. Try again.", "La búsqueda con IA falló. Inténtalo de nuevo.")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <form onSubmit={run} className="space-y-3 p-4 rounded-2xl bg-card border border-border">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-accent" />
          {tr("Describe a technique or goal", "Describe una técnica u objetivo")}
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={tr(
            "e.g. I keep getting stuck in bottom half guard and want to sweep bigger guys",
            "p. ej. Me quedo atascado en media guardia abajo y quiero barrer a gente más grande",
          )}
          className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/60"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length < 3}
          className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-bold uppercase text-sm disabled:opacity-60"
        >
          {busy ? tr("Finding videos…", "Buscando vídeos…") : tr("Find videos with AI", "Buscar vídeos con IA")}
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {busy && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[9/14] rounded-xl bg-secondary animate-pulse" />)}
        </div>
      )}
      {res && !busy && (
        <div className="space-y-3">
          {res.summary && <p className="text-sm text-muted-foreground">{res.summary}</p>}
          {res.hits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tr("No matching videos yet. Try describing it differently.", "Aún no hay vídeos que encajen. Prueba a describirlo de otra forma.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {res.hits.map((h) => (
                <li key={h.id}>
                  <Link to="/v/$id" params={{ id: h.id }} className="flex gap-3 p-2 rounded-xl bg-card border border-border">
                    <img src={h.poster} alt="" loading="lazy" className="w-16 aspect-[9/14] rounded-lg object-cover bg-secondary" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-mono uppercase text-accent">{h.art} · {h.level}</p>
                      <p className="text-sm font-semibold line-clamp-2">{h.caption}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{h.reason}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">@{h.handle}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
