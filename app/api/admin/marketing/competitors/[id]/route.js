import { json, fail, withSupabase, readJson, isUuid } from "@/lib/marketing/community/admin";

export const dynamic = "force-dynamic";

// PATCH { notes?, active? }
export async function PATCH(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);
  const patch = { updated_at: new Date().toISOString() };
  if ("notes" in body) patch.notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  if ("active" in body) patch.active = Boolean(body.active);

  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.from("mk_competitors").update(patch).eq("id", params.id).select("*").single();
    if (error) throw error;
    return json({ item: data });
  });
}

// DELETE: deja de seguir la cuenta (borra también sus publicaciones guardadas).
export async function DELETE(_request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  return withSupabase(async (supabase) => {
    const { error } = await supabase.from("mk_competitors").delete().eq("id", params.id);
    if (error) throw error;
    return json({ ok: true });
  });
}
