// Lectura de testimonios aprobados para mostrarlos en el sitio.
// Uso (en un server component):
//   import { getApprovedTestimonials } from "@/lib/marketing/community/testimonials";
//   const items = await getApprovedTestimonials({ product: "metodo-iman", limit: 6 });
import { getSupabaseAdmin } from "@/lib/supabase";
import { publicPhotoUrl } from "./shared";

/** Forma pública de un testimonio: nunca expone datos internos. */
export function toPublicTestimonial(row) {
  return {
    id: row.id,
    name: row.name,
    relation: row.relation || "",
    text: row.text,
    photoUrl: publicPhotoUrl(row.photo_path),
    socialUrl: row.social_url || "",
    products: row.products || [],
    featured: !!row.featured,
  };
}

/**
 * Testimonios aprobados y con permiso para publicar, destacados primero.
 * Nunca lanza: si la base no está disponible devuelve [] para no romper la página.
 *
 * @param {object} [opts]
 * @param {string} [opts.product]   slug de recurso: solo los etiquetados con ese producto
 * @param {boolean} [opts.featuredOnly]
 * @param {number} [opts.limit]     máximo a devolver (default 12)
 */
export async function getApprovedTestimonials({ product, featuredOnly = false, limit = 12 } = {}) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("mk_community_testimonials")
      .select("id, name, relation, text, photo_path, social_url, products, featured")
      .eq("status", "approved")
      .eq("consent", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 12, 1), 50));
    if (product) query = query.contains("products", [product]);
    if (featuredOnly) query = query.eq("featured", true);

    const { data, error } = await query;
    if (error) {
      console.error("getApprovedTestimonials:", error.message);
      return [];
    }
    return (data || []).map(toPublicTestimonial);
  } catch (err) {
    console.error("getApprovedTestimonials:", err.message);
    return [];
  }
}
