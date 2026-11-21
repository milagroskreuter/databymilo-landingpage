import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/marketing/sponsors/crud";

export const dynamic = "force-dynamic";

const fail = (err) => Response.json({ error: err.message }, { status: 500 });

// Piezas (mk_content) asociadas a un acuerdo.
export async function GET(_req, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: links, error } = await supabase.from("mk_sponsors_deal_content").select("content_id").eq("deal_id", params.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const ids = (links || []).map((l) => l.content_id);
    if (!ids.length) return Response.json({ items: [] });
    const { data, error: e2 } = await supabase
      .from("mk_content")
      .select("id, title, status, network, format, published_at, scheduled_at")
      .in("id", ids);
    if (e2) return Response.json({ error: e2.message }, { status: 500 });
    return Response.json({ items: data || [] });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!isUuid(params.id) || !isUuid(body.content_id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const { error } = await getSupabaseAdmin()
      .from("mk_sponsors_deal_content")
      .upsert({ deal_id: params.id, content_id: body.content_id }, { onConflict: "deal_id,content_id" });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const contentId = new URL(request.url).searchParams.get("content_id");
    if (!isUuid(params.id) || !isUuid(contentId)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const { error } = await getSupabaseAdmin()
      .from("mk_sponsors_deal_content")
      .delete()
      .eq("deal_id", params.id)
      .eq("content_id", contentId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
