import { applyTemplates, fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { isDate } from "@/lib/marketing/launches/dates";
import { PHASE_BY_ID } from "@/lib/marketing/launches/constants";

export const dynamic = "force-dynamic";

// Agrega una tarea propia, o { fromTemplates: true } para sumar las de las plantillas.
export async function POST(request, { params }) {
  const body = await readBody(request);
  return withDb(async (supabase) => {
    const { data: launch } = await supabase.from("mk_launches").select("*").eq("id", params.id).maybeSingle();
    if (!launch) return fail("No encontrado", 404);

    if (body.fromTemplates) {
      const added = await applyTemplates(supabase, launch);
      return json({ ok: true, added }, 201);
    }

    const title = String(body.title || "").trim();
    if (!title) return fail("Escribí la tarea.", 400);
    const { data, error } = await supabase
      .from("mk_launches_tasks")
      .insert({
        launch_id: launch.id,
        phase: PHASE_BY_ID[body.phase] ? body.phase : "pre",
        title,
        description: body.description || null,
        due_on: isDate(body.due_on) ? body.due_on : null,
        sort_order: 1000,
      })
      .select()
      .single();
    if (error) return fail(error.message);
    return json({ ok: true, task: data }, 201);
  });
}
