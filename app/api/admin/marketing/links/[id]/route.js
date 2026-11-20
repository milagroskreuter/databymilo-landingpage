import { getSupabaseAdmin } from "@/lib/supabase";
import { cleanLink } from "@/lib/marketing/links/validate";
import { revalidateLinks } from "@/lib/marketing/links/data";
import { jsonError } from "@/lib/marketing/links/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function PATCH(request, { params }) {
  try {
    if (!UUID_RE.test(params.id)) return Response.json({ error: "Link inválido" }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const { row, error } = cleanLink(body, { partial: true });
    if (error) return Response.json({ error }, { status: 400 });

    const supabase = getSupabaseAdmin();
    // Si pasa a estar en la bio, va al final de la lista.
    if (row.in_bio === true) {
      const { data: cur } = await supabase.from("mk_links_links").select("in_bio").eq("id", params.id).maybeSingle();
      if (cur && !cur.in_bio) {
        const { data: last } = await supabase
          .from("mk_links_links")
          .select("bio_order")
          .eq("in_bio", true)
          .order("bio_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        row.bio_order = (last?.bio_order ?? 0) + 1;
      }
    }
    row.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from("mk_links_links")
      .update(row)
      .eq("id", params.id)
      .select()
      .maybeSingle();
    if (dbError) {
      if (dbError.code === "23505") return Response.json({ error: "Ya existe un link con ese nombre corto" }, { status: 409 });
      throw new Error(dbError.message);
    }
    if (!data) return Response.json({ error: "No existe ese link" }, { status: 404 });
    revalidateLinks();
    return Response.json({ link: data });
  } catch (err) {
    return jsonError(err);
  }
}

// Borra el link; sus clicks quedan (con link_id vacío) para no perder el histórico.
export async function DELETE(_request, { params }) {
  try {
    if (!UUID_RE.test(params.id)) return Response.json({ error: "Link inválido" }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("mk_links_links").delete().eq("id", params.id);
    if (error) throw new Error(error.message);
    revalidateLinks();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
