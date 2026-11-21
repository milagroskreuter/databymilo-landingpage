import { applyTemplates, fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { addDays } from "@/lib/marketing/launches/dates";
import { pieceRow, salesPillarId } from "@/lib/marketing/launches/plan";
import { DEFAULT_PRE_DAYS } from "@/lib/marketing/launches/constants";

export const dynamic = "force-dynamic";

// Planificar una fecha clave:
//   { mode: "launch", name?, resource_slug? } → crea un lanzamiento que abre ese día (con checklist)
//   { mode: "pieces" } → crea una pieza en LinkedIn y otra en Instagram para ese día
export async function POST(request, { params }) {
  const body = await readBody(request);
  return withDb(async (supabase) => {
    const { data: kd } = await supabase.from("mk_launches_keydates").select("*").eq("id", params.id).maybeSingle();
    if (!kd) return fail("No encontrada", 404);

    if (body.mode === "pieces") {
      const pillarId = await salesPillarId(supabase);
      const notes = kd.notes || null;
      const rows = [
        pieceRow({ title: `${kd.name}: post`, network: "linkedin", format: "post", date: kd.starts_on, time: "09:00", notes }, { pillarId }),
        pieceRow({ title: `${kd.name}: carrusel`, network: "instagram", format: "carrusel", date: kd.starts_on, time: "18:00", notes }, { pillarId }),
      ].map((r) => ({ ...r, tags: ["fecha-clave"] }));
      const { error } = await supabase.from("mk_content").insert(rows);
      if (error) return fail(error.message);
      return json({ ok: true, created: rows.length }, 201);
    }

    const row = {
      name: String(body.name || "").trim() || kd.name,
      resource_slug: body.resource_slug || null,
      status: "planning",
      keydate_id: kd.id,
      starts_on: addDays(kd.starts_on, -DEFAULT_PRE_DAYS),
      launch_on: kd.starts_on,
      ends_on: kd.ends_on && kd.ends_on > kd.starts_on ? kd.ends_on : addDays(kd.starts_on, 3),
    };
    const { data, error } = await supabase.from("mk_launches").insert(row).select().single();
    if (error) return fail(error.message);
    await applyTemplates(supabase, data);
    return json({ ok: true, launch: data }, 201);
  });
}
