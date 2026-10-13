import { createServerFn } from "@tanstack/react-start";

export const aiVideoSearch = createServerFn({ method: "POST" })
  .inputValidator((d: { query: string }) => {
    const query = String(d?.query ?? "").trim().slice(0, 500);
    if (query.length < 3) throw new Error("Describe what you're looking for (3+ characters)");
    return { query };
  })
  .handler(async ({ data }) => {
    const { runAiVideoSearch } = await import("./ai-video-search.server");
    return runAiVideoSearch(data.query);
  });
