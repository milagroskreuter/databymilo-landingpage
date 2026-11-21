import { json, fail, withSupabase, readJson, isUuid, adminTestimonial } from "@/lib/marketing/community/admin";
import {
  PUBLIC_BUCKET,
  TESTIMONIAL_STATUSES,
  cleanLine,
  cleanText,
  cleanUrl,
  cleanSlugs,
  removeFiles,
} from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// PATCH: aprobar / rechazar / destacar / editar texto / etiquetar productos.
// El texto original queda siempre en original_text; { restoreOriginal: true } lo vuelve a poner.
export async function PATCH(request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  const body = await readJson(request);

  return withSupabase(async (supabase) => {
    const { data: current, error: readErr } = await supabase
      .from("mk_community_testimonials")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!current) return fail("No existe", 404);

    const patch = {};
    if (body.status !== undefined) {
      if (!TESTIMONIAL_STATUSES.includes(body.status)) return fail("Estado inválido");
      patch.status = body.status;
      patch.reviewed_at = body.status === "pending" ? null : new Date().toISOString();
      if (body.status !== "approved") patch.featured = false;
    }
    if (body.featured !== undefined) {
      patch.featured = !!body.featured;
      if (patch.featured && (patch.status ?? current.status) !== "approved") {
        return fail("Solo se pueden destacar testimonios aprobados");
      }
    }
    if (body.text !== undefined) {
      const text = cleanText(body.text, 3000);
      if (!text) return fail("El texto no puede quedar vacío");
      patch.text = text;
    }
    if (body.restoreOriginal) patch.text = current.original_text;
    if (body.name !== undefined) {
      const name = cleanLine(body.name, 80);
      if (!name) return fail("El nombre no puede quedar vacío");
      patch.name = name;
    }
    if (body.relation !== undefined) patch.relation = cleanLine(body.relation, 140) || null;
    if (body.social_url !== undefined) {
      const url = cleanUrl(body.social_url);
      if (cleanLine(body.social_url) && !url) return fail("El link no parece válido");
      patch.social_url = url || null;
    }
    if (body.products !== undefined) patch.products = cleanSlugs(body.products);
    if (body.removePhoto && current.photo_path) patch.photo_path = null;

    if (!Object.keys(patch).length) return fail("Nada para cambiar");
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("mk_community_testimonials")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw error;
    if (patch.photo_path === null) await removeFiles(supabase, PUBLIC_BUCKET, [current.photo_path]);
    return json({ item: adminTestimonial(data) });
  });
}

export async function DELETE(_request, { params }) {
  if (!isUuid(params.id)) return fail("Id inválido");
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase
      .from("mk_community_testimonials")
      .delete()
      .eq("id", params.id)
      .select("photo_path")
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("No existe", 404);
    await removeFiles(supabase, PUBLIC_BUCKET, [data.photo_path]);
    return json({ ok: true });
  });
}
