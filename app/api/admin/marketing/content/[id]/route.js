import { getSupabaseAdmin } from "@/lib/supabase";
import { updateContent, deleteContent, isUuid, CONTENT_TABLE } from "@/lib/marketing/content";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    if (!isUuid(params.id)) return Response.json({ error: "Id inválido" }, { status: 400 });
    const { data, error } = await getSupabaseAdmin().from(CONTENT_TABLE).select("*").eq("id", params.id).maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "No existe esa pieza" }, { status: 404 });
    return Response.json({ item: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { data, error, status } = await updateContent(getSupabaseAdmin(), params.id, body);
    if (error) return Response.json({ error }, { status });
    return Response.json({ item: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { error, status } = await deleteContent(getSupabaseAdmin(), params.id);
    if (error) return Response.json({ error }, { status });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
