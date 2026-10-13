import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCount } from "@/lib/mock-data";

export const Route = createFileRoute("/v/$id")({
  head: () => ({
    meta: [
      { title: "Video — STRIVE" },
      { name: "description", content: "Watch this martial arts training video on STRIVE." },
      { property: "og:title", content: "Video — STRIVE" },
      { property: "og:description", content: "Watch this martial arts training video on STRIVE." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VideoPage,
});

function VideoPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const q = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, handle, caption, video, poster, art, level, likes, comments, visibility")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const p = q.data;

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="relative w-full max-w-md h-dvh bg-black">
        <button
          onClick={() => router.history.back()}
          aria-label="Back"
          className="absolute top-4 left-4 z-10 size-10 rounded-full bg-black/60 text-white flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        {q.isLoading && <div className="absolute inset-0 animate-pulse bg-secondary" />}
        {!q.isLoading && !p && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-background">
            <p>Video not found / Vídeo no encontrado</p>
            <Link to="/" className="text-accent underline">Feed</Link>
          </div>
        )}
        {p && (
          <>
            <video src={p.video} poster={p.poster} autoPlay loop playsInline controls className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute bottom-0 inset-x-0 p-4 pb-16 bg-gradient-to-t from-black/90 to-transparent text-white pointer-events-none">
              <Link to="/u/$handle" params={{ handle: p.handle }} className="font-semibold pointer-events-auto">@{p.handle}</Link>
              <p className="text-sm mt-1">{p.caption}</p>
              <p className="text-xs font-mono mt-2 opacity-80 flex gap-4">
                <span>{p.art} · {p.level}</span>
                <span className="flex items-center gap-1"><Heart className="size-3" />{formatCount(p.likes)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="size-3" />{formatCount(p.comments)}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
