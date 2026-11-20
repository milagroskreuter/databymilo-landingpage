import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/marketing/content";
import { SERIES_TABLE, validateSeries } from "@/lib/marketing/content/series";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const { data, error } = validateSeries(body, { partial: true });
    if (error) return Response.json({ error }, { status: 400 });
    const res = await getSupabaseAdmin().from(SERIES_TABLE).update(data).eq("id", params.id).select().maybeSingle();
    if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
    if (!res.data) return Response.json({ error: "No existe esa serie" }, { status: 404 });
    return Response.json({ item: res.data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Borrar una serie no borra sus piezas: quedan en el calendario sin serie.
export async function DELETE(_request, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const { error } = await getSupabaseAdmin().from(SERIES_TABLE).delete().eq("id", params.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
