// Helpers de servidor para las rutas /api/admin/marketing/launches.
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDate } from "./dates";
import { LAUNCH_STATUS_BY_ID } from "./constants";
import { dueDateFor, tasksFromTemplates } from "./schedule";

export const json = (data, status = 200) => Response.json(data, { status });
export const fail = (error, status = 500) => Response.json({ error }, { status });

export async function withDb(fn) {
  try {
    return await fn(getSupabaseAdmin());
  } catch (err) {
    return fail(err.message || "Error inesperado");
  }
}

export async function readBody(request) {
  return request.json().catch(() => ({}));
}

const dateOrNull = (v) => (isDate(v) ? v : null);

// Normaliza un lanzamiento recibido del admin. Solo incluye las claves presentes.
export function launchFromBody(body) {
  const out = {};
  if (body.name !== undefined) out.name = String(body.name || "").trim();
  if (body.resource_slug !== undefined) out.resource_slug = body.resource_slug || null;
  if (body.status !== undefined) out.status = LAUNCH_STATUS_BY_ID[body.status] ? body.status : "planning";
  if (body.starts_on !== undefined) out.starts_on = dateOrNull(body.starts_on);
  if (body.launch_on !== undefined) out.launch_on = dateOrNull(body.launch_on);
  if (body.ends_on !== undefined) out.ends_on = dateOrNull(body.ends_on);
  if (body.notes !== undefined) out.notes = body.notes ? String(body.notes) : null;
  if (body.keydate_id !== undefined) out.keydate_id = body.keydate_id || null;
  if (body.goal_sales !== undefined) {
    const n = parseInt(body.goal_sales, 10);
    out.goal_sales = Number.isFinite(n) && n > 0 ? n : null;
  }
  return out;
}

export function validateDates(l) {
  if (l.starts_on && l.launch_on && l.starts_on > l.launch_on) return "El inicio tiene que ser antes de la apertura.";
  if (l.launch_on && l.ends_on && l.ends_on < l.launch_on) return "El cierre tiene que ser después de la apertura.";
  return null;
}

// Crea las tareas del checklist a partir de las plantillas activas.
export async function applyTemplates(supabase, launch) {
  const { data: templates, error } = await supabase
    .from("mk_launches_templates")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = tasksFromTemplates(launch, templates || []);
  if (!rows.length) return 0;
  const { error: insErr } = await supabase.from("mk_launches_tasks").insert(rows);
  if (insErr) throw new Error(insErr.message);
  return rows.length;
}

// Si cambian las fechas del lanzamiento, mueve las tareas con ancla que no estén hechas.
export async function rescheduleTasks(supabase, launch) {
  const { data: tasks, error } = await supabase
    .from("mk_launches_tasks")
    .select("id, anchor, offset_days, due_on, done")
    .eq("launch_id", launch.id)
    .not("anchor", "is", null);
  if (error) throw new Error(error.message);
  const changes = (tasks || [])
    .filter((t) => !t.done)
    .map((t) => ({ id: t.id, old: t.due_on, due_on: dueDateFor(launch, t.anchor, t.offset_days) }))
    .filter((t) => t.due_on !== t.old);
  for (const c of changes) {
    await supabase.from("mk_launches_tasks").update({ due_on: c.due_on }).eq("id", c.id);
  }
  return changes.length;
}
