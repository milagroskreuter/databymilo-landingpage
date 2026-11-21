import { json, fail, withSupabase, readJson, isUuid } from "@/lib/marketing/community/admin";
import { cleanText, cleanNetwork, cleanTags, cleanDate } from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// PATCH: editar campos, { bump: true } suma una repetición, { used: false } la vuelve a abrir.
export async function PATCH(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);

  return withSupabase(async (supabase) => {
    const { data: current, error: readErr } = await supabase
      .from("mk_community_questions")
      .select("id, times")
      .eq("id", params.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!current) return fail("No existe", 404);

    const patch = {};
    if (body.text !== undefined) {
      const text = cleanText(body.text, 1000);
      if (!text) return fail("La pregunta no puede quedar vacía");
      patch.text = text;
    }
    if (body.network !== undefined) patch.network = cleanNetwork(body.network);
    if (body.asked_on !== undefined) {
      const d = cleanDate(body.asked_on);
      if (!d) return fail("Fecha inválida");
      patch.asked_on = d;
    }
    if (body.tags !== undefined) patch.tags = cleanTags(body.tags);
    if (body.notes !== undefined) patch.notes = cleanText(body.notes, 1000) || null;
    if (body.times !== undefined) patch.times = Math.min(Math.max(parseInt(body.times, 10) || 1, 1), 9999);
    if (body.bump) patch.times = Math.min((current.times || 1) + 1, 9999);
    if (body.used === false) {
      patch.used_at = null;
      patch.content_id = null;
    }

    if (!Object.keys(patch).length) return fail("Nada para cambiar");
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("mk_community_questions")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw error;
    return json({ item: data });
  });
}

export async function DELETE(_request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  return withSupabase(async (supabase) => {
    const { error } = await supabase.from("mk_community_questions").delete().eq("id", params.id);
    if (error) throw error;
    return json({ ok: true });
  });
}
