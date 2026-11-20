import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidateLinks } from "@/lib/marketing/links/data";
import { jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f-]{36}$/i;

// Nuevo orden de los botones de /links: { ids: [id1, id2, ...] }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter((x) => UUID_RE.test(x)).slice(0, 200) : [];
    if (ids.length === 0) return Response.json({ error: "Falta el orden" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const results = await Promise.all(
      ids.map((id, i) => supabase.from("mk_links_links").update({ bio_order: i + 1 }).eq("id", id))
    );
    const failed = results.find((r) => r.error);
    if (failed) throw new Error(failed.error.message);
    revalidateLinks();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
