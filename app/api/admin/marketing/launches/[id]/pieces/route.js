import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { isDate } from "@/lib/marketing/launches/dates";
import { pieceRow, salesPillarId } from "@/lib/marketing/launches/plan";

export const dynamic = "force-dynamic";

// Crea una pieza suelta del lanzamiento (cae en el calendario si tiene fecha).
export async function POST(request, { params }) {
  const body = await readBody(request);
  const title = String(body.title || "").trim();
  if (!title) return fail("Poné un título para la pieza.", 400);
  return withDb(async (supabase) => {
    const { data: launch } = await supabase.from("mk_launches").select("id").eq("id", params.id).maybeSingle();
    if (!launch) return fail("No encontrado", 404);
    const pillarId = await salesPillarId(supabase);
    const row = pieceRow(
      {
        title,
        network: body.network,
        format: body.format,
        date: isDate(body.date) ? body.date : null,
        time: /^\d{2}:\d{2}$/.test(body.time || "") ? body.time : "10:00",
      },
      { launchId: launch.id, pillarId }
    );
    const { data, error } = await supabase.from("mk_content").insert(row).select("id").single();
    if (error) return fail(error.message);
    return json({ ok: true, id: data.id }, 201);
  });
}
