import { getSupabaseAdmin } from "@/lib/supabase";
import { createContent, listContent } from "@/lib/marketing/content";

export const dynamic = "force-dynamic";

// GET  ?status=&network=&pillar_id=&series_id=&from=&to=&q=&ideas=1 → { items }
// POST { title, status, network, ... }                              → { item }

export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const filters = Object.fromEntries(
      ["status", "network", "pillar_id", "series_id", "from", "to", "q", "limit"]
        .map((k) => [k, sp.get(k)])
        .filter(([, v]) => v)
    );
    if (sp.get("ideas") === "1") filters.ideas = true;
    const { data, error, status } = await listContent(getSupabaseAdmin(), filters);
    if (error) return Response.json({ error }, { status });
    return Response.json({ items: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error, status } = await createContent(getSupabaseAdmin(), body);
    if (error) return Response.json({ error }, { status });
    return Response.json({ item: data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
