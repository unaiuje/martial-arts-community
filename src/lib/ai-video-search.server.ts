import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export type AiVideoHit = {
  id: string;
  handle: string;
  caption: string;
  poster: string;
  art: string;
  level: string;
  likes: number;
  reason: string;
};

export async function runAiVideoSearch(query: string): Promise<{ hits: AiVideoHit[]; summary: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI search is not configured");

  const sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: posts, error } = await sb
    .from("posts")
    .select("id, handle, caption, poster, art, level, tags, likes, post_techniques(techniques(name))")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  if (!posts?.length) return { hits: [], summary: "" };

  const catalog = posts
    .map((p) => {
      const techs = ((p.post_techniques ?? []) as { techniques: { name: string } | null }[])
        .map((t) => t.techniques?.name)
        .filter(Boolean)
        .join(", ");
      return `${p.id} | ${p.art} | ${p.level} | ${p.caption.slice(0, 200)} | tags: ${p.tags.join(" ")} | techniques: ${techs}`;
    })
    .join("\n");

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions:
      "You help martial artists find training videos. Given a user's description of a technique or goal and a catalog of videos (id | art | level | caption | tags | techniques), pick up to 8 most relevant videos. Reply ONLY with JSON: {\"summary\": string (one sentence, same language as the user), \"results\": [{\"id\": string, \"reason\": string (short, same language as the user)}]}. Use only ids from the catalog. Return an empty results array if nothing fits.",
    messages: [{ role: "user", content: `Request: ${query}\n\nCatalog:\n${catalog}` }],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;

  let parsed: { summary?: string; results?: { id: string; reason?: string }[] } = {};
  try {
    const m = text.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  } catch {
    parsed = {};
  }
  const byId = new Map(posts.map((p) => [p.id, p]));
  const hits: AiVideoHit[] = [];
  for (const r of parsed.results ?? []) {
    const p = byId.get(r.id);
    if (!p || hits.some((h) => h.id === p.id)) continue;
    hits.push({
      id: p.id, handle: p.handle, caption: p.caption, poster: p.poster,
      art: p.art, level: p.level, likes: p.likes, reason: String(r.reason ?? ""),
    });
    if (hits.length >= 8) break;
  }
  return { hits, summary: String(parsed.summary ?? "") };
}
