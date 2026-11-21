import { fail, json, readBody, withDb } from "@/lib/marketing/launches/launches";
import { keydateFromBody } from "@/lib/marketing/launches/keydates";
import { isDate } from "@/lib/marketing/launches/dates";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const row = keydateFromBody(await readBody(request));
  if (row.name !== undefined && !row.name) return fail("El nombre no puede quedar vacío.", 400);
  if (row.starts_on !== undefined && !isDate(row.starts_on)) return fail("Poné una fecha válida.", 400);
  return withDb(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_launches_keydates")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") return fail("Ya existe esa fecha con ese nombre.", 409);
      return fail(error.message);
    }
    return json({ ok: true, keydate: data });
  });
}

export async function DELETE(_, { params }) {
  return withDb(async (supabase) => {
    const { error } = await supabase.from("mk_launches_keydates").delete().eq("id", params.id);
    if (error) return fail(error.message);
    return json({ ok: true });
  });
}
