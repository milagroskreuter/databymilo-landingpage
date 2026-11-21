import { fail, json, launchFromBody, readBody, rescheduleTasks, validateDates, withDb } from "@/lib/marketing/launches/launches";

export const dynamic = "force-dynamic";

const CONTENT_FIELDS = "id, title, status, network, format, scheduled_at, published_at, permalink, pillar_id, source";

// Detalle: lanzamiento + checklist + piezas + recursos + fecha clave asociada.
export async function GET(_, { params }) {
  return withDb(async (supabase) => {
    const { data: launch, error } = await supabase.from("mk_launches").select("*").eq("id", params.id).maybeSingle();
    if (error) return fail(error.message);
    if (!launch) return fail("No encontrado", 404);

    const [tasks, pieces, resources, keydate] = await Promise.all([
      supabase
        .from("mk_launches_tasks")
        .select("*")
        .eq("launch_id", launch.id)
        .order("due_on", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true }),
      supabase
        .from("mk_content")
        .select(CONTENT_FIELDS)
        .eq("launch_id", launch.id)
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("resources").select("slug, title, is_paid").order("sort_order", { ascending: true }),
      launch.keydate_id
        ? supabase
            .from("mk_launches_keydates")
            .select("id, name, starts_on, ends_on, approximate")
            .eq("id", launch.keydate_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return json({
      launch,
      tasks: tasks.data || [],
      pieces: pieces.data || [],
      resources: resources.data || [],
      keydate: keydate.data || null,
    });
  });
}

export async function PUT(request, { params }) {
  const body = await readBody(request);
  const row = launchFromBody(body);
  if (row.name !== undefined && !row.name) return fail("El nombre no puede quedar vacío.", 400);

  return withDb(async (supabase) => {
    const { data: current } = await supabase.from("mk_launches").select("*").eq("id", params.id).maybeSingle();
    if (!current) return fail("No encontrado", 404);
    const invalid = validateDates({ ...current, ...row });
    if (invalid) return fail(invalid, 400);

    const { data, error } = await supabase
      .from("mk_launches")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) return fail(error.message);

    const datesChanged = ["starts_on", "launch_on", "ends_on"].some((k) => k in row && row[k] !== current[k]);
    const movedTasks = datesChanged ? await rescheduleTasks(supabase, data) : 0;
    return json({ ok: true, launch: data, movedTasks });
  });
}

// Borra el lanzamiento y su checklist. Las piezas quedan en el calendario, sin lanzamiento.
export async function DELETE(_, { params }) {
  return withDb(async (supabase) => {
    const { error } = await supabase.from("mk_launches").delete().eq("id", params.id);
    if (error) return fail(error.message);
    return json({ ok: true });
  });
}
