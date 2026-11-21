import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { templateFromBody } from "@/lib/marketing/launches/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_launches_templates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return json({ templates: data || [] });
  });
}

export async function POST(request) {
  const row = templateFromBody(await readBody(request));
  if (!row.title) return fail("Escribí la tarea.", 400);
  if (!row.phase) row.phase = "pre";
  return withDb(async (supabase) => {
    if (row.sort_order == null) {
      const { data: last } = await supabase
        .from("mk_launches_templates")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      row.sort_order = (last?.sort_order || 0) + 1;
    }
    const { data, error } = await supabase.from("mk_launches_templates").insert(row).select().single();
    if (error) return fail(error.message);
    return json({ ok: true, template: data }, 201);
  });
}
