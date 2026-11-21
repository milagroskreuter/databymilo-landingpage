import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid, sanitize } from "@/lib/marketing/sponsors/crud";
import { INTERACTION_SCHEMA } from "@/lib/marketing/sponsors/schemas";

export const dynamic = "force-dynamic";

// GET ?deal_id=... devuelve el historial de un acuerdo; sin deal_id, las últimas 300.
export async function GET(request) {
  try {
    const dealId = new URL(request.url).searchParams.get("deal_id");
    let q = getSupabaseAdmin()
      .from("mk_sponsors_interactions")
      .select("*")
      .order("happened_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (dealId) {
      if (!isUuid(dealId)) return Response.json({ error: "Id inválido" }, { status: 400 });
      q = q.eq("deal_id", dealId);
    }
    const { data, error } = await q.limit(300);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ items: data || [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error: vErr } = sanitize(INTERACTION_SCHEMA, body, { required: ["deal_id", "summary"] });
    if (vErr) return Response.json({ error: vErr }, { status: 400 });
    if (!data.happened_on) delete data.happened_on;
    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("mk_sponsors_interactions").insert(data).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await supabase.from("mk_sponsors_deals").update({ updated_at: new Date().toISOString() }).eq("id", data.deal_id);
    return Response.json({ item: row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
