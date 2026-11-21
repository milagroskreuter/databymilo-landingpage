import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { keydateFromBody, listKeyDates } from "@/lib/marketing/launches/keydates";
import { isDate } from "@/lib/marketing/launches/dates";

export const dynamic = "force-dynamic";

// ?from=YYYY-MM-DD&to=YYYY-MM-DD&all=1 (all incluye las desactivadas)
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const from = isDate(sp.get("from")) ? sp.get("from") : undefined;
  const to = isDate(sp.get("to")) ? sp.get("to") : undefined;
  return withDb(async (supabase) => {
    const keydates = await listKeyDates({ from, to, includeInactive: sp.get("all") === "1", supabase });
    // Lanzamientos ya planificados para cada fecha.
    const { data: launches } = await supabase
      .from("mk_launches")
      .select("id, name, keydate_id")
      .not("keydate_id", "is", null);
    const byKey = {};
    for (const l of launches || []) (byKey[l.keydate_id] ||= []).push({ id: l.id, name: l.name });
    return json({ keydates: keydates.map((k) => ({ ...k, launches: byKey[k.id] || [] })) });
  });
}

export async function POST(request) {
  const row = keydateFromBody(await readBody(request));
  if (!row.name) return fail("Poné un nombre.", 400);
  if (!isDate(row.starts_on)) return fail("Poné una fecha válida.", 400);
  return withDb(async (supabase) => {
    const { data, error } = await supabase.from("mk_launches_keydates").insert(row).select().single();
    if (error) {
      if (error.code === "23505") return fail("Ya existe esa fecha con ese nombre.", 409);
      return fail(error.message);
    }
    return json({ ok: true, keydate: data }, 201);
  });
}
