import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/marketing/sponsors/crud";

export const dynamic = "force-dynamic";

export async function DELETE(_req, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("mk_sponsors_interactions").delete().eq("id", params.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
