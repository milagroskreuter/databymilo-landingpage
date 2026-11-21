import { getSupabaseAdmin } from "@/lib/supabase";
import { cleanTags, fail, json } from "@/lib/marketing/brand/server";

export const dynamic = "force-dynamic";

// GET ?kind=&q= → frases guardadas (las más usadas primero).
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("mk_brand_snippets")
      .select("*")
      .order("uses", { ascending: false })
      .order("created_at", { ascending: false });
    const kind = sp.get("kind");
    if (kind) query = query.eq("kind", kind);
    const q = (sp.get("q") || "").trim().replace(/[%,(){}"\\]/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    const { data, error } = await query.limit(300);
    if (error) return fail(error);
    return json({ snippets: data });
  } catch (err) {
    return fail(err);
  }
}

// POST { kind, title, body, network?, tags? }
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    if (!b.title?.trim() || !b.body?.trim()) return fail("Faltan el título o el texto", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("mk_brand_snippets")
      .insert({
        kind: b.kind || "otro",
        title: b.title.trim().slice(0, 160),
        body: b.body.trim(),
        network: b.network || null,
        tags: cleanTags(b.tags),
      })
      .select()
      .single();
    if (error) return fail(error);
    return json({ snippet: data }, 201);
  } catch (err) {
    return fail(err);
  }
}
