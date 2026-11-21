import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { buildPiecePlan, pieceRow, salesPillarId } from "@/lib/marketing/launches/plan";

export const dynamic = "force-dynamic";

async function load(supabase, id) {
  const { data: launch } = await supabase.from("mk_launches").select("*").eq("id", id).maybeSingle();
  if (!launch) return {};
  const { data: existing } = await supabase.from("mk_content").select("title, network").eq("launch_id", id);
  return { launch, plan: buildPiecePlan(launch, existing || []) };
}

// Vista previa del plan base de piezas.
export async function GET(_, { params }) {
  return withDb(async (supabase) => {
    const { launch, plan } = await load(supabase, params.id);
    if (!launch) return fail("No encontrado", 404);
    if (!launch.launch_on) return fail("Poné la fecha de apertura para generar el plan.", 400);
    return json({ plan });
  });
}

// Crea en el calendario las piezas elegidas: { keys: ["0", "3", ...] }.
export async function POST(request, { params }) {
  const body = await readBody(request);
  const keys = new Set(Array.isArray(body.keys) ? body.keys.map(String) : []);
  return withDb(async (supabase) => {
    const { launch, plan } = await load(supabase, params.id);
    if (!launch) return fail("No encontrado", 404);
    const chosen = plan.filter((p) => keys.has(p.key) && !p.exists);
    if (!chosen.length) return fail("No elegiste piezas nuevas.", 400);
    const pillarId = await salesPillarId(supabase);
    const rows = chosen.map((p) => pieceRow(p, { launchId: launch.id, pillarId }));
    const { error } = await supabase.from("mk_content").insert(rows);
    if (error) return fail(error.message);
    return json({ ok: true, created: rows.length }, 201);
  });
}
