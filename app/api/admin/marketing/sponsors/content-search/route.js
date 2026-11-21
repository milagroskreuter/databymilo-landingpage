import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Buscador de piezas (mk_content) para asociarlas a un acuerdo o a un espacio.
export async function GET(request) {
  try {
    const q = (new URL(request.url).searchParams.get("q") || "").trim().replace(/[%,()]/g, " ").slice(0, 80);
    let query = getSupabaseAdmin()
      .from("mk_content")
      .select("id, title, status, network, format, published_at, scheduled_at")
      .neq("status", "descartado")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(30);
    if (q) query = query.ilike("title", `%${q}%`);
    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ items: data || [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
