import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { isDate } from "@/lib/marketing/launches/dates";
import { PHASE_BY_ID } from "@/lib/marketing/launches/constants";

export const dynamic = "force-dynamic";

// Tildar / editar una tarea.
export async function PATCH(request, { params }) {
  const body = await readBody(request);
  const row = {};
  if (body.done !== undefined) {
    row.done = !!body.done;
    row.done_at = body.done ? new Date().toISOString() : null;
  }
  if (body.title !== undefined) {
    row.title = String(body.title || "").trim();
    if (!row.title) return fail("La tarea no puede quedar vacía.", 400);
  }
  if (body.description !== undefined) row.description = body.description || null;
  if (body.phase !== undefined && PHASE_BY_ID[body.phase]) row.phase = body.phase;
  if (body.due_on !== undefined) {
    row.due_on = isDate(body.due_on) ? body.due_on : null;
    // Fecha puesta a mano: deja de moverse con las fechas del lanzamiento.
    row.anchor = null;
    row.offset_days = null;
  }
  if (!Object.keys(row).length) return fail("Nada para cambiar.", 400);

  return withDb(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_launches_tasks")
      .update(row)
      .eq("id", params.taskId)
      .eq("launch_id", params.id)
      .select()
      .single();
    if (error) return fail(error.message);
    return json({ ok: true, task: data });
  });
}

export async function DELETE(_, { params }) {
  return withDb(async (supabase) => {
    const { error } = await supabase
      .from("mk_launches_tasks")
      .delete()
      .eq("id", params.taskId)
      .eq("launch_id", params.id);
    if (error) return fail(error.message);
    return json({ ok: true });
  });
}
