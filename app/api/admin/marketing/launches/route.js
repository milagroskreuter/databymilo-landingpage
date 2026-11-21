import { applyTemplates, fail, json, launchFromBody, readBody, validateDates, withDb } from "@/lib/marketing/launches/launches";

export const dynamic = "force-dynamic";

// Lista de lanzamientos con avance del checklist y cantidad de piezas,
// más los recursos del sitio para asociar.
export async function GET() {
  return withDb(async (supabase) => {
    const [launches, tasks, pieces, resources] = await Promise.all([
      supabase.from("mk_launches").select("*").order("launch_on", { ascending: false, nullsFirst: true }),
      supabase.from("mk_launches_tasks").select("launch_id, done"),
      supabase.from("mk_content").select("launch_id").not("launch_id", "is", null),
      supabase.from("resources").select("slug, title, is_paid").order("sort_order", { ascending: true }),
    ]);
    if (launches.error) return fail(launches.error.message);

    const empty = () => ({ tasks: 0, done: 0, pieces: 0 });
    const stats = {};
    for (const t of tasks.data || []) {
      const s = (stats[t.launch_id] ||= empty());
      s.tasks++;
      if (t.done) s.done++;
    }
    for (const p of pieces.data || []) (stats[p.launch_id] ||= empty()).pieces++;

    return json({
      launches: (launches.data || []).map((l) => ({ ...l, stats: stats[l.id] || empty() })),
      resources: resources.data || [],
    });
  });
}

// Crea un lanzamiento. Salvo applyTemplates: false, arma el checklist desde las plantillas.
export async function POST(request) {
  const body = await readBody(request);
  const row = launchFromBody(body);
  if (!row.name) return fail("Poné un nombre para el lanzamiento.", 400);
  const invalid = validateDates(row);
  if (invalid) return fail(invalid, 400);

  return withDb(async (supabase) => {
    const { data, error } = await supabase.from("mk_launches").insert(row).select().single();
    if (error) return fail(error.message);
    const tasks = body.applyTemplates === false ? 0 : await applyTemplates(supabase, data);
    return json({ ok: true, launch: data, tasks }, 201);
  });
}
