// Links y embudo: lecturas del lado del servidor (con caché) y armado del destino.
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
export { buildDestination } from "./shared";

export const LINKS_TAG = "mk-links";

export const DEFAULT_PAGE = {
  name: "Milo",
  handle: "@databymilo",
  bio: "Tech, data e IA contado desde adentro de una corpo. Guías, recursos y la carta del domingo.",
  photo_url: "/milo-foto.webp",
  socials: {
    instagram: "https://www.instagram.com/databymilo",
    linkedin: "https://www.linkedin.com/in/milagroskreuter/",
  },
  footer: "",
};

function hasDb() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

/** Después de cada cambio en el admin: refresca /links y las redirecciones. */
export function revalidateLinks() {
  try {
    revalidateTag(LINKS_TAG);
    revalidatePath("/links");
  } catch {}
}

/** Link + recurso asociado (si lo tiene), para la redirección. */
export const getLinkForRedirect = unstable_cache(
  async (slug) => {
    const supabase = getSupabaseAdmin();
    const { data: link, error } = await supabase
      .from("mk_links_links")
      .select("id, slug, dest_type, url, resource_slug, list_slug, campaign, network, add_utm, active")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!link) return null;
    let resource = null;
    if (link.resource_slug && (link.dest_type === "resource" || link.dest_type === "resource_checkout")) {
      const { data } = await supabase
        .from("resources")
        .select("slug, is_paid, href, payment_url")
        .eq("slug", link.resource_slug)
        .maybeSingle();
      resource = data ?? null;
    }
    return { ...link, resource };
  },
  ["mk-links-redirect"],
  { revalidate: 300, tags: [LINKS_TAG] }
);

/** Datos de la página pública /links. */
export const getBioPage = unstable_cache(
  async () => {
    if (!hasDb()) return { page: DEFAULT_PAGE, links: [] };
    const supabase = getSupabaseAdmin();
    const [settings, links] = await Promise.all([
      supabase.from("mk_links_settings").select("value").eq("key", "page").maybeSingle(),
      supabase
        .from("mk_links_links")
        .select("id, slug, title, icon, featured")
        .eq("in_bio", true)
        .eq("active", true)
        .order("bio_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    return {
      page: { ...DEFAULT_PAGE, ...(settings.data?.value || {}) },
      links: links.data ?? [],
    };
  },
  ["mk-links-bio-page"],
  { revalidate: 300, tags: [LINKS_TAG] }
);
