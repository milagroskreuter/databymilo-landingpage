import { json, fail, withSupabase, adminTestimonial } from "@/lib/marketing/community/admin";
import {
  PUBLIC_BUCKET,
  TESTIMONIAL_STATUSES,
  cleanLine,
  cleanText,
  cleanUrl,
  cleanSlugs,
  uploadImage,
  removeFiles,
} from "@/lib/marketing/community/shared";

export const dynamic = "force-dynamic";

// GET ?status=pending|approved|rejected|all → { items, products }
export async function GET(request) {
  const status = new URL(request.url).searchParams.get("status") || "all";
  return withSupabase(async (supabase) => {
    let query = supabase
      .from("mk_community_testimonials")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);
    if (TESTIMONIAL_STATUSES.includes(status)) query = query.eq("status", status);

    const [{ data, error }, { data: products }] = await Promise.all([
      query,
      supabase.from("resources").select("slug, title, is_paid").order("sort_order", { ascending: true }),
    ]);
    if (error) throw error;
    return json({ items: (data || []).map(adminTestimonial), products: products || [] });
  });
}

// POST (multipart): cargar un testimonio a mano (ej. uno que llegó por DM).
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("Bad request");
  }
  const name = cleanLine(form.get("name") ?? "", 80);
  const text = cleanText(form.get("text") ?? "", 3000);
  const relation = cleanLine(form.get("relation") ?? "", 140);
  const socialUrl = cleanUrl(form.get("social_url") ?? "");
  const products = cleanSlugs(String(form.get("products") ?? ""));
  const consent = String(form.get("consent") ?? "") === "true";
  const status = TESTIMONIAL_STATUSES.includes(form.get("status")) ? form.get("status") : "approved";

  if (!name) return fail("Falta el nombre");
  if (!text) return fail("Falta el texto");
  if (!consent) return fail("Confirmá que la persona dio permiso para publicarlo");

  return withSupabase(async (supabase) => {
    let photoPath = null;
    try {
      photoPath = await uploadImage(supabase, form.get("photo"), {
        bucket: PUBLIC_BUCKET,
        folder: "testimonials",
        maxBytes: 3 * 1024 * 1024,
      });
    } catch (err) {
      return fail(err.message);
    }
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("mk_community_testimonials")
      .insert({
        name,
        text,
        original_text: text,
        relation: relation || null,
        social_url: socialUrl || null,
        products,
        photo_path: photoPath,
        consent: true,
        consent_at: now,
        status,
        source: "manual",
        reviewed_at: status === "pending" ? null : now,
      })
      .select("*")
      .single();
    if (error) {
      await removeFiles(supabase, PUBLIC_BUCKET, [photoPath]);
      throw error;
    }
    return json({ item: adminTestimonial(data) }, 201);
  });
}
