import { getSupabaseAdmin } from "@/lib/supabase";
import { getList } from "@/lib/lists";

export const dynamic = "force-dynamic";

// PATCH  { name?, description?, button_label?, active? }
// DELETE → solo listas personalizadas (borra también sus suscriptoras)

export async function PATCH(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();
    const list = await getList(supabase, params.slug);
    if (!list) return Response.json({ error: "No encontrada" }, { status: 404 });

    const update = {};

    if (body.name !== undefined) {
      if (list.kind === "system") {
        return Response.json({ error: "Las listas del sistema no se pueden renombrar" }, { status: 400 });
      }
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 80) {
        return Response.json({ error: "Poné un nombre (hasta 80 caracteres)" }, { status: 400 });
      }
      update.name = name;
    }
    if (body.description !== undefined) {
      update.description =
        typeof body.description === "string" ? body.description.trim().slice(0, 500) || null : null;
    }
    if (body.button_label !== undefined) {
      update.button_label =
        typeof body.button_label === "string" ? body.button_label.trim().slice(0, 30) || null : null;
    }
    if (body.active !== undefined) {
      if (list.kind === "system" && body.active === false) {
        return Response.json({ error: "Las listas del sistema no se pueden pausar" }, { status: 400 });
      }
      update.active = !!body.active;
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ error: "Nada para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mail_lists")
      .update(update)
      .eq("slug", params.slug)
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ list: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseAdmin();
    const list = await getList(supabase, params.slug);
    if (!list) return Response.json({ error: "No encontrada" }, { status: 404 });
    if (list.kind === "system") {
      return Response.json({ error: "Las listas del sistema no se pueden borrar" }, { status: 400 });
    }
    const { error } = await supabase.from("mail_lists").delete().eq("slug", params.slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
