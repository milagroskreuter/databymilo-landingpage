import { json, fail, withSupabase, readJson, isUuid } from "@/lib/marketing/community/admin";

export const dynamic = "force-dynamic";

const FORMAT_LABEL = { reel: "Reel", carrusel: "Carrusel", post: "Post", video: "Video" };

// POST { multiplier? }: crea una idea (mk_content con status 'idea' y source 'competencia')
// inspirada en la publicación, con el link y el texto original como referencia.
export async function POST(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);

  return withSupabase(async (supabase) => {
    const { data: post, error } = await supabase
      .from("mk_competitor_posts")
      .select("*, competitor:mk_competitors(username, network)")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!post) return fail("No existe", 404);
    if (post.content_id) return fail("Esta publicación ya se pasó a Ideas", 409);

    const firstLine = (post.caption || "").split("\n").map((s) => s.trim()).find(Boolean) || "";
    const base = firstLine || `${FORMAT_LABEL[post.format] || "Publicación"} de @${post.competitor?.username}`;
    const title = `Inspo: ${base.length > 120 ? `${base.slice(0, 117)}…` : base}`;

    const mult = Number(body.multiplier);
    const stats = [
      post.likes != null ? `${post.likes} likes` : null,
      post.comments != null ? `${post.comments} comentarios` : null,
      post.views != null ? `${post.views} vistas` : null,
    ].filter(Boolean).join(", ");
    const notes = [
      `Inspirado en un ${(FORMAT_LABEL[post.format] || "posteo").toLowerCase()} de @${post.competitor?.username}${post.posted_at ? ` (${post.posted_at.slice(0, 10)})` : ""}.`,
      stats ? `Resultado: ${stats}${Number.isFinite(mult) && mult > 0 ? `, ${mult.toFixed(1).replace(".", ",")} veces su promedio` : ""}.` : null,
      post.permalink ? `Link: ${post.permalink}` : null,
      "Idea: tomar el formato o el ángulo, no copiar. ¿Cómo lo contaría yo, con mi experiencia?",
      post.caption ? `\nTexto original:\n${post.caption.slice(0, 1500)}` : null,
    ].filter(Boolean).join("\n");

    const { data: content, error: insErr } = await supabase
      .from("mk_content")
      .insert({
        title,
        status: "idea",
        source: "competencia",
        network: post.competitor?.network || "instagram",
        format: post.format === "video" ? "reel" : post.format,
        tags: ["inspo"],
        notes,
        score: Number.isFinite(mult) ? Math.min(5, Math.max(1, Math.round(mult + 1))) : null,
      })
      .select("id, title")
      .single();
    if (insErr) throw insErr;

    const { error: upErr } = await supabase
      .from("mk_competitor_posts")
      .update({ content_id: content.id, starred: true, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    if (upErr) {
      await supabase.from("mk_content").delete().eq("id", content.id);
      throw upErr;
    }
    return json({ content }, 201);
  });
}
