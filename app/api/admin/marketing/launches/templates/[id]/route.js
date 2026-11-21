import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { templateFromBody } from "@/lib/marketing/launches/templates";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const row = templateFromBody(await readBody(request));
  if (row.title !== undefined && !row.title) return fail("La tarea no puede quedar vacía.", 400);
  return withDb(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_launches_templates")
      .update(row)
      .eq("id", params.id)
      .select()
      .single();
    if (error) return fail(error.message);
    return json({ ok: true, template: data });
  });
}

// Borrar una plantilla no toca las tareas ya creadas en los lanzamientos.
export async function DELETE(_, { params }) {
  return withDb(async (supabase) => {
    const { error } = await supabase.from("mk_launches_templates").delete().eq("id", params.id);
    if (error) return fail(error.message);
    return json({ ok: true });
  });
}
