import { json, fail, withSupabase, isUuid } from "@/lib/marketing/community/admin";
import { networkLabel } from "@/lib/marketing/constants";

export const dynamic = "force-dynamic";

// POST: convierte la pregunta en una idea (pieza de mk_content con status 'idea'
// y source 'audiencia') y la marca como usada.
export async function POST(_request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");

  return withSupabase(async (supabase) => {
    const { data: q, error: readErr } = await supabase
      .from("mk_community_questions")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!q) return fail("No existe", 404);
    if (q.content_id) return fail("Esta pregunta ya se convirtió en idea", 409);

    // Pilar "Comunidad" si existe (sembrado en la migración base).
    const { data: pillar } = await supabase
      .from("mk_pillars")
      .select("id")
      .ilike("name", "comunidad")
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    const oneLine = q.text.replace(/\s+/g, " ").trim();
    const title = oneLine.length > 140 ? `${oneLine.slice(0, 137)}…` : oneLine;
    const where = q.network ? ` por ${networkLabel(q.network)}` : "";
    const times = q.times > 1 ? `, se repitió ${q.times} veces` : "";
    const notes = [
      `Pregunta de la audiencia${where} (${q.asked_on}${times}):`,
      `“${q.text}”`,
      q.notes ? `\nNotas: ${q.notes}` : "",
    ].filter(Boolean).join("\n");

    const { data: content, error: insErr } = await supabase
      .from("mk_content")
      .insert({
        title,
        status: "idea",
        source: "audiencia",
        pillar_id: pillar?.id ?? null,
        tags: q.tags || [],
        notes,
        score: Math.min(5, Math.max(1, Math.ceil(Math.log2((q.times || 1) + 1)))),
      })
      .select("id, title")
      .single();
    if (insErr) throw insErr;

    const now = new Date().toISOString();
    const { data: updated, error: upErr } = await supabase
      .from("mk_community_questions")
      .update({ used_at: now, content_id: content.id, updated_at: now })
      .eq("id", q.id)
      .select("*")
      .single();
    if (upErr) {
      // Que no quede una idea huérfana si no se pudo marcar la pregunta.
      await supabase.from("mk_content").delete().eq("id", content.id);
      throw upErr;
    }

    return json({ item: updated, content }, 201);
  });
}
